import { deterministicSignedNoise } from "./deterministicNoise";
import {
  assertSaneObservation,
  assertValidKernelScenario,
  DomainScenarioError
} from "./weatherValidation";
import type {
  ForecastWindow,
  KernelScenarioDefinition,
  NormalizedPoint,
  ObservationDimension,
  ScenarioOutcomeFacts,
  ScenarioState,
  StationObservation,
  StationObservationChange,
  StationObservationDelta
} from "./weatherTypes";

const DOMAIN_DECIMAL_PLACES = 12;
const DOMAIN_SCALE = 10 ** DOMAIN_DECIMAL_PLACES;

const observationDimensions: readonly ObservationDimension[] = [
  "temperatureC",
  "pressureHpa",
  "pressureTendencyHpaPer3h",
  "relativeHumidityPct",
  "windDirectionDeg",
  "windSpeedMps",
  "precipitationRateMmh"
];

const canonicalNumber = (value: number): number =>
  Math.round(value * DOMAIN_SCALE) / DOMAIN_SCALE;

const normalizeDirection = (degrees: number): number =>
  canonicalNumber(((degrees % 360) + 360) % 360);

const translate = (
  point: NormalizedPoint,
  movement: NormalizedPoint,
  steps: number
): NormalizedPoint => ({
  x: canonicalNumber(point.x + movement.x * steps),
  y: canonicalNumber(point.y + movement.y * steps)
});

function progressAt(minute: number, startMinute: number, endMinute: number): number {
  if (minute <= startMinute) return 0;
  if (minute >= endMinute) return 1;
  return (minute - startMinute) / (endMinute - startMinute);
}

function applyDelta(
  base: StationObservation,
  delta: StationObservationDelta,
  progress: number
): StationObservation {
  const value = <K extends ObservationDimension>(dimension: K): number =>
    canonicalNumber(base[dimension] + (delta[dimension] ?? 0) * progress);

  return {
    temperatureC: value("temperatureC"),
    pressureHpa: value("pressureHpa"),
    pressureTendencyHpaPer3h: value("pressureTendencyHpaPer3h"),
    relativeHumidityPct: value("relativeHumidityPct"),
    windDirectionDeg: normalizeDirection(value("windDirectionDeg")),
    windSpeedMps: value("windSpeedMps"),
    precipitationRateMmh: value("precipitationRateMmh")
  };
}

/**
 * Station observation before the two derived dimensions are applied: the authored
 * effect deltas (with seeded observational noise) for every dimension the station
 * instruments directly, plus the derived placeholders for tendency and precipitation.
 *
 * Pressure tendency and precipitation are NOT authored per-effect deltas. Tendency is
 * derived from the pressure trajectory the kernel actually produces, and precipitation
 * is derived from the precipitation-band geometry, so the tendency column, the
 * pressure chart, the radar-style band and the station rain readings can never
 * contradict one another. See docs/SCIENCE_MODEL.md.
 */
function rawObservationAt(
  scenario: KernelScenarioDefinition,
  stationId: string,
  minute: number
): StationObservation {
  const station = scenario.stations.find((candidate) => candidate.id === stationId);
  if (!station) throw new DomainScenarioError(`Unknown station "${stationId}".`);

  let observation: StationObservation = {
    ...station.initial,
    pressureTendencyHpaPer3h: station.initial.pressureTendencyHpaPer3h ?? 0
  };
  const effects = scenario.stationEffects.filter((effect) => effect.stationId === stationId);

  for (const effect of effects) {
    const progress = progressAt(minute, effect.startMinute, effect.endMinute);
    observation = applyDelta(observation, effect.delta, progress);

    if (progress > 0 && effect.noise) {
      const noisy = { ...observation };
      for (const dimension of observationDimensions) {
        const rule = effect.noise[dimension];
        if (!rule) continue;
        const key = [
          scenario.scenarioId,
          scenario.contentVersion,
          stationId,
          effect.id,
          dimension,
          rule.key,
          minute
        ].join(":");
        noisy[dimension] = canonicalNumber(
          noisy[dimension] + deterministicSignedNoise(scenario.seed, key, rule.amplitude)
        );
      }
      observation = {
        ...noisy,
        windDirectionDeg: normalizeDirection(noisy.windDirectionDeg)
      };
    }
  }

  return observation;
}

/** Precipitation reported by a station at a minute, derived from band geometry. */
export function precipitationAt(
  scenario: KernelScenarioDefinition,
  stationId: string,
  minute: number
): number {
  const station = scenario.stations.find((candidate) => candidate.id === stationId);
  if (!station) throw new DomainScenarioError(`Unknown station "${stationId}".`);

  const stepIndex = minute / scenario.timeline.stepMinutes;
  let precipitation = 0;
  for (const cell of scenario.precipitationCells) {
    const center = translate(cell.initialCenter, cell.movement, stepIndex);
    const intensity = Math.max(0, cell.initialIntensityMmh + cell.intensityDeltaMmhPerStep * stepIndex);
    const distance = Math.hypot(station.position.x - center.x, station.position.y - center.y);
    if (distance < cell.footprintRadius) {
      precipitation += intensity * (1 - distance / cell.footprintRadius);
    }
  }
  return canonicalNumber(precipitation);
}

function observationAt(
  scenario: KernelScenarioDefinition,
  stationId: string,
  minute: number
): StationObservation {
  const observation = rawObservationAt(scenario, stationId, minute);

  // Tendency: change over the preceding 3 h of the pressure trajectory this kernel
  // produces, clamped at the scenario start. Computed, never authored, so the
  // tendency column always agrees with the pressure chart beside it.
  const tendencyWindowStart = Math.max(scenario.timeline.startMinute, minute - 90);
  const tendency = canonicalNumber(
    observation.pressureHpa - rawObservationAt(scenario, stationId, tendencyWindowStart).pressureHpa
  );

  const derived: StationObservation = {
    ...observation,
    pressureTendencyHpaPer3h: tendency,
    precipitationRateMmh: precipitationAt(scenario, stationId, minute)
  };

  assertSaneObservation(derived, `station ${stationId} at minute ${minute}`);
  return derived;
}

export function stateAtMinute(
  scenario: KernelScenarioDefinition,
  minute: number
): ScenarioState {
  assertValidKernelScenario(scenario);
  const { timeline } = scenario;

  if (
    !Number.isSafeInteger(minute) ||
    minute < 0 ||
    minute > timeline.maxMinute ||
    minute % timeline.stepMinutes !== 0
  ) {
    throw new DomainScenarioError("Requested minute must be an in-range simulation step.");
  }

  const stepIndex = minute / timeline.stepMinutes;
  const stations: Record<string, StationObservation> = Object.fromEntries(
    scenario.stations.map((station) => [station.id, observationAt(scenario, station.id, minute)])
  );

  const progress =
    minute === timeline.maxMinute
      ? ({ status: "complete", completedAtMinute: minute } as const)
      : ({ status: "running" } as const);

  return {
    scenarioId: scenario.scenarioId,
    schemaVersion: scenario.schemaVersion,
    contentVersion: scenario.contentVersion,
    seed: scenario.seed,
    minute,
    stepIndex,
    stations,
    airMasses: scenario.airMasses.map((airMass) => ({
      id: airMass.id,
      center: translate(airMass.initialCenter, airMass.movement, stepIndex)
    })),
    boundaries: scenario.boundaries.map((boundary) => ({
      id: boundary.id,
      path: boundary.initialPath.map((point) =>
        translate(point, boundary.movement, stepIndex)
      )
    })),
    precipitationCells: scenario.precipitationCells.map((cell) => ({
      id: cell.id,
      center: translate(cell.initialCenter, cell.movement, stepIndex),
      intensityMmh: canonicalNumber(
        Math.max(0, cell.initialIntensityMmh + cell.intensityDeltaMmhPerStep * stepIndex)
      ),
      footprintRadius: cell.footprintRadius
    })),
    progress
  };
}

export function initializeScenario(scenario: KernelScenarioDefinition): ScenarioState {
  return stateAtMinute(scenario, scenario.timeline.startMinute);
}

export interface StationTransitionWindow {
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface SeriesPoint {
  readonly minute: number;
  readonly temperatureC: number;
}

/**
 * Observed transition window for a series of station observations: the enclosing span
 * of consecutive observation steps whose absolute temperature-change rate is at least
 * half of the series' maximum rate. A front passage is the fastest sustained change in
 * a station record, so this recovers the passage window from public evidence alone
 * without exposing authoring metadata. Returns undefined when the record contains no
 * meaningful temperature change.
 */
export function deriveTransitionWindow(
  points: readonly SeriesPoint[],
  stepMinutes: number
): StationTransitionWindow | undefined {
  if (points.length < 2) return undefined;

  const total = Math.abs(points[points.length - 1]!.temperatureC - points[0]!.temperatureC);
  if (total < 0.5) return undefined;

  const rates = points.slice(1).map((point, index) =>
    Math.abs(point.temperatureC - points[index]!.temperatureC) / stepMinutes
  );
  const maxRate = Math.max(...rates);
  if (maxRate <= 0) return undefined;

  const threshold = maxRate / 2;
  let startMinute: number | undefined;
  let endMinute: number | undefined;

  rates.forEach((rate, index) => {
    if (rate < threshold) return;
    const from = points[index]!.minute;
    const to = points[index + 1]!.minute;
    if (startMinute === undefined) startMinute = from;
    endMinute = to;
  });

  if (startMinute === undefined || endMinute === undefined) return undefined;
  return { startMinute, endMinute };
}

/**
 * Observed transition window for a station over a full kernel scenario, derived only
 * from the station's own reported observations. See `deriveTransitionWindow`.
 */
export function deriveStationTransitionWindow(
  scenario: KernelScenarioDefinition,
  stationId: string
): StationTransitionWindow | undefined {
  const { startMinute, stepMinutes, maxMinute } = scenario.timeline;
  const points: SeriesPoint[] = [];
  for (let minute = startMinute; minute <= maxMinute; minute += stepMinutes) {
    points.push({ minute, temperatureC: stateAtMinute(scenario, minute).stations[stationId]!.temperatureC });
  }
  return deriveTransitionWindow(points, stepMinutes);
}

export function advanceScenario(
  scenario: KernelScenarioDefinition,
  state: ScenarioState,
  steps = 1
): ScenarioState {
  if (
    state.scenarioId !== scenario.scenarioId ||
    state.schemaVersion !== scenario.schemaVersion ||
    state.contentVersion !== scenario.contentVersion ||
    state.seed !== scenario.seed
  ) {
    throw new DomainScenarioError(
      "State does not belong to the supplied scenario identity/version/seed."
    );
  }
  if (!Number.isSafeInteger(steps) || steps <= 0) {
    throw new DomainScenarioError("advanceScenario steps must be a positive integer.");
  }

  const minute = Math.min(
    scenario.timeline.maxMinute,
    state.minute + scenario.timeline.stepMinutes * steps
  );
  return stateAtMinute(scenario, minute);
}

export function getAvailableForecastWindows(
  scenario: KernelScenarioDefinition,
  state: ScenarioState
): readonly ForecastWindow[] {
  return scenario.forecastWindows.filter(
    (forecastWindow) => state.minute >= forecastWindow.startMinute && state.minute < forecastWindow.endMinute
  );
}

const signedDirectionChange = (observedDegrees: number, initialDegrees: number): number =>
  canonicalNumber(((observedDegrees - initialDegrees + 540) % 360) - 180);

function subtractObservation(
  observed: StationObservation,
  initial: StationObservation
): StationObservationChange {
  return {
    temperatureC: canonicalNumber(observed.temperatureC - initial.temperatureC),
    pressureHpa: canonicalNumber(observed.pressureHpa - initial.pressureHpa),
    pressureTendencyHpaPer3h: canonicalNumber(
      observed.pressureTendencyHpaPer3h - initial.pressureTendencyHpaPer3h
    ),
    relativeHumidityPct: canonicalNumber(
      observed.relativeHumidityPct - initial.relativeHumidityPct
    ),
    windDirectionDeg: signedDirectionChange(observed.windDirectionDeg, initial.windDirectionDeg),
    windSpeedMps: canonicalNumber(observed.windSpeedMps - initial.windSpeedMps),
    precipitationRateMmh: canonicalNumber(
      observed.precipitationRateMmh - initial.precipitationRateMmh
    )
  };
}

export function getScenarioOutcomeFacts(
  scenario: KernelScenarioDefinition,
  state: ScenarioState
): ScenarioOutcomeFacts {
  if (
    state.scenarioId !== scenario.scenarioId ||
    state.schemaVersion !== scenario.schemaVersion ||
    state.contentVersion !== scenario.contentVersion ||
    state.seed !== scenario.seed
  ) {
    throw new DomainScenarioError(
      "Outcome facts require state from the supplied scenario identity/version/seed."
    );
  }

  // Recompute the canonical scientific snapshot from scenario + simulation time.
  // Callers may hold presentation copies of state; those copies are never scientific authority.
  const canonicalState = stateAtMinute(scenario, state.minute);

  return {
    scenarioId: scenario.scenarioId,
    contentVersion: scenario.contentVersion,
    minute: canonicalState.minute,
    stationChanges: scenario.stations.map((station) => {
      const observed = canonicalState.stations[station.id];
      if (!observed) throw new DomainScenarioError(`Canonical state is missing station "${station.id}".`);
      return {
        stationId: station.id,
        fromMinute: 0,
        toMinute: state.minute,
        initial: station.initial,
        observed,
        delta: subtractObservation(observed, station.initial)
      };
    })
  };
}
