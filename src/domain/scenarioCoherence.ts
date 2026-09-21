import { DomainScenarioError } from "./weatherValidation";
import type {
  BoundaryDefinition,
  KernelScenarioDefinition,
  NormalizedPoint,
  StationEffectRule
} from "./weatherTypes";

/**
 * Authored front/station coherence contract.
 *
 * The kernel evolves station observations from authored `stationEffects` windows
 * and moves fronts, air masses, and precipitation geometrically from authored
 * motion vectors. Neither mechanism can see the other, so an authored scenario
 * can silently place a front hundreds of simulation minutes away from a station
 * while that station records a complete frontal change. A learner reasoning from
 * the map would then be actively misled, which defeats the purpose of a
 * map-evidence forecast mission.
 *
 * These checks make that class of authored-content error fail closed at the
 * authored-data boundary. They do not change simulation behavior: the kernel
 * still derives every scientific value from `stationEffects`, seed, and time.
 *
 * Deliberately NOT part of `assertValidKernelScenario`. That contract is
 * evaluated on every `stateAtMinute` call and governs stored replay traces, so
 * tightening it here would reject previously authored content and invalidate
 * historical replays. Front/station coherence is an authoring rule, enforced
 * where untrusted authored data enters the system.
 *
 * Scope assumption for v1: a boundary that a station effect references is a
 * zonal front - a path spanning the region that translates along +x
 * (`movement.y === 0`). Boundaries with a non-zero y translation are left
 * unvalidated rather than guessed at.
 */

const TOLERANCE = 1e-9;

function referenceXAtY(path: readonly NormalizedPoint[], y: number): number {
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index]!;
    const end = path[index + 1]!;
    const lower = Math.min(start.y, end.y);
    const upper = Math.max(start.y, end.y);
    if (start.y !== end.y && y >= lower && y <= upper) {
      const ratio = (y - start.y) / (end.y - start.y);
      return start.x + (end.x - start.x) * ratio;
    }
  }
  // Flat or degenerate path: fall back to the first point.
  return path[0]!.x;
}

type FrontReach =
  | { readonly kind: "reaches"; readonly minute: number }
  | { readonly kind: "no-eastward-motion" }
  | { readonly kind: "already-past"; readonly minute: number }
  | { readonly kind: "beyond-timeline"; readonly minute: number };

/** Where the authored boundary motion puts the front relative to one station. */
function frontReach(
  boundary: BoundaryDefinition,
  stationX: number,
  stationY: number,
  stepMinutes: number,
  maxMinute: number
): FrontReach {
  if (!(boundary.movement.x > 0)) return { kind: "no-eastward-motion" };
  const referenceX = referenceXAtY(boundary.initialPath, stationY);
  const minute = ((stationX - referenceX) / boundary.movement.x) * stepMinutes;
  if (minute < 0) return { kind: "already-past", minute };
  if (minute > maxMinute) return { kind: "beyond-timeline", minute };
  return { kind: "reaches", minute };
}

/** Author-facing description of a failed reach, so the message is actionable. */
function describeReach(reach: FrontReach): string {
  switch (reach.kind) {
    case "no-eastward-motion":
      return "never, because the authored boundary does not advance eastward";
    case "already-past":
      return `at minute ${reach.minute}, before the scenario starts`;
    case "beyond-timeline":
      return `at minute ${reach.minute}, after the scenario ends`;
    default:
      return `at minute ${reach.minute}`;
  }
}

/** Earliest boundary-linked effect per (station, boundary) pair: the passage rule. */
function passageEffects(scenario: KernelScenarioDefinition): StationEffectRule[] {
  const earliest = new Map<string, StationEffectRule>();
  for (const effect of scenario.stationEffects) {
    if (!effect.boundaryId) continue;
    const key = `${effect.stationId}\u0000${effect.boundaryId}`;
    const existing = earliest.get(key);
    if (!existing || effect.startMinute < existing.startMinute) earliest.set(key, effect);
  }
  return [...earliest.values()];
}

export function assertScenarioCoherence(scenario: KernelScenarioDefinition): void {
  const { stepMinutes, maxMinute } = scenario.timeline;
  const stationById = new Map(scenario.stations.map((station) => [station.id, station]));
  const boundaryById = new Map(scenario.boundaries.map((boundary) => [boundary.id, boundary]));

  for (const effect of passageEffects(scenario)) {
    const boundary = boundaryById.get(effect.boundaryId!)!;
    if (boundary.movement.y !== 0) continue;
    const station = stationById.get(effect.stationId)!;

    const reach = frontReach(
      boundary,
      station.position.x,
      station.position.y,
      stepMinutes,
      maxMinute
    );

    if (
      reach.kind !== "reaches" ||
      reach.minute < effect.startMinute - TOLERANCE ||
      reach.minute > effect.endMinute + TOLERANCE
    ) {
      throw new DomainScenarioError(
        `Effect ${effect.id} claims boundary "${boundary.id}" passage at station "${station.id}", but the ` +
          `authored boundary motion places the front there ${describeReach(reach)}, outside the authored ` +
          `change interval from minute ${effect.startMinute} to minute ${effect.endMinute}. A station cannot ` +
          `record a frontal change before the front arrives or after it has passed.`
      );
    }

    const windowSteps = (effect.endMinute - effect.startMinute) / stepMinutes;
    const expectedWidth = Math.abs(boundary.movement.x) * windowSteps;
    if (Math.abs(boundary.transitionWidth - expectedWidth) > TOLERANCE) {
      throw new DomainScenarioError(
        `Boundary "${boundary.id}" transitionWidth ${boundary.transitionWidth} must equal the distance the ` +
          `front travels during the authored change interval of effect ${effect.id} (${expectedWidth}), so the ` +
          `station traverses the authored transition zone exactly across that same interval.`
      );
    }
  }

  for (const cell of scenario.precipitationCells) {
    const ridesAFront = scenario.boundaries.some(
      (boundary) =>
        boundary.movement.x === cell.movement.x && boundary.movement.y === cell.movement.y
    );
    if (!ridesAFront) {
      throw new DomainScenarioError(
        `Precipitation cell "${cell.id}" must move with a modeled front so the precipitation layer and the ` +
          `front layer cannot disagree about where the frontal band is.`
      );
    }
  }
}
