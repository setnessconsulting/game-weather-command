import { describe, expect, it } from "vitest";

import { stateAtMinute, type KernelScenarioDefinition } from "@/domain";
import { canonicalFrontPassageScenarios } from "@/scenarios";
import {
  buildAllStationSeries,
  buildRegionalSummary,
  buildStationSeries,
  createSessionMachine,
  deriveObservedTransitionWindow,
  observedTransition,
  seriesChange
} from "@/game";

/**
 * The observed transition window is graded from the station's own reported observations.
 * These tests pin it to the scenario's authored temperature-changing passage, so the
 * learner-facing convention can never silently drift away from the authored science.
 */
function authoredTemperatureWindows(
  kernel: KernelScenarioDefinition,
  stationId: string
): { startMinute: number; endMinute: number } | undefined {
  const effects = kernel.stationEffects.filter(
    (effect) => effect.stationId === stationId && effect.delta.temperatureC !== undefined
  );
  if (effects.length === 0) return undefined;
  return {
    startMinute: Math.min(...effects.map((effect) => effect.startMinute)),
    endMinute: Math.max(...effects.map((effect) => effect.endMinute))
  };
}

describe("observed transition derivation", () => {
  it("recovers the authored passage window from public observations alone", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const machine = createSessionMachine(scenario);
      for (const station of scenario.stations) {
        const derived = observedTransition(machine.kernel, station.id);
        const authored = authoredTemperatureWindows(machine.kernel, station.id);
        expect(authored, `${scenario.scenarioId}/${station.id} should have an authored change`).toBeDefined();
        expect(
          { startMinute: derived?.startMinute, endMinute: derived?.endMinute },
          `${scenario.scenarioId}/${station.id}`
        ).toEqual(authored);
      }
    }
  });

  it("orders station changes west to east for every eastward-moving front", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const machine = createSessionMachine(scenario);
      const ordered = [...scenario.stations].sort((a, b) => a.position.x - b.position.x);
      const starts = ordered.map((station) => observedTransition(machine.kernel, station.id)!.startMinute);
      expect(starts, scenario.scenarioId).toEqual([...starts].sort((a, b) => a - b));
    }
  });

  it("reports the realised change over the transition, not the authored delta", () => {
    const uncertain = canonicalFrontPassageScenarios.find(
      (scenario) => scenario.missionType === "uncertain-boundary"
    )!;
    const machine = createSessionMachine(uncertain);
    const authored = machine.kernel.stationEffects.find(
      (effect) => effect.id === "central-uncertain-change"
    )!;
    const derived = observedTransition(machine.kernel, "central")!;
    const authoredDelta = authored.delta.temperatureC!;
    expect(derived.temperatureChangeC).not.toBe(authoredDelta);
    const amplitude = authored.noise?.temperatureC?.amplitude ?? 0;
    expect(Math.abs(derived.temperatureChangeC - authoredDelta)).toBeLessThanOrEqual(amplitude + 0.01);
  });

  it("returns no window when a station record never changes", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const series = buildStationSeries(machine.kernel, "west", scenario.timeline.startMinute);
    expect(series.points).toHaveLength(1);
    expect(deriveObservedTransitionWindow(series)).toBeUndefined();
  });
});

describe("station series", () => {
  it("extends one reading per step and matches canonical state at each step", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const series = buildStationSeries(machine.kernel, "central", 120);
    expect(series.points.map((point) => point.minute)).toEqual([0, 30, 60, 90, 120]);
    for (const point of series.points) {
      expect(point.observation).toEqual(stateAtMinute(machine.kernel, point.minute).stations.central);
    }
  });

  it("clamps beyond the scenario end instead of throwing", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const series = buildStationSeries(machine.kernel, "central", 10_000);
    expect(series.points[series.points.length - 1]!.minute).toBe(scenario.timeline.maxMinute);
  });

  it("builds every station series and reports cumulative change", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const series = buildAllStationSeries(machine.kernel, scenario.timeline.maxMinute);
    expect(series).toHaveLength(scenario.stations.length);
    for (const stationSeries of series) {
      const change = seriesChange(stationSeries);
      expect(change.temperatureC).toBeLessThan(0);
      expect(change.windDirectionDeg).toBeGreaterThan(0);
    }
  });
});

describe("regional summary", () => {
  it("describes motion, orientation and extrapolated arrival in words as well as numbers", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const summary = buildRegionalSummary(scenario, machine.kernel, stateAtMinute(machine.kernel, 0));
    const boundary = summary.boundaries[0]!;

    expect(boundary.motionSummary).toContain("eastward");
    expect(boundary.orientation).toBe("runs north-south");
    expect(boundary.positionSummary).toContain("Cold front");
    expect(boundary.airMassLabels).toHaveLength(2);

    const sorted = [...scenario.stations].sort((a, b) => a.position.x - b.position.x);
    const etas = sorted.map(
      (station) => boundary.proximity.find((proximity) => proximity.stationId === station.id)!.etaMinutes
    );
    expect(etas.every((eta) => typeof eta === "number")).toBe(true);
    expect(etas).toEqual([...etas].sort((a, b) => a! - b!));
  });

  it("explains when arrival cannot be extrapolated after the front has passed", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const summary = buildRegionalSummary(
      scenario,
      machine.kernel,
      stateAtMinute(machine.kernel, scenario.timeline.maxMinute)
    );
    const west = summary.boundaries[0]!.proximity.find((proximity) => proximity.stationId === "west")!;
    expect(west.etaMinutes).toBeUndefined();
    expect(west.note).toContain("already past");
  });

  it("reports precipitation cells with intensity trend and position", () => {
    const scenario = canonicalFrontPassageScenarios[0]!;
    const machine = createSessionMachine(scenario);
    const summary = buildRegionalSummary(scenario, machine.kernel, stateAtMinute(machine.kernel, 60));
    const cell = summary.precipitationCells[0]!;
    expect(cell.intensityMmh).toBeGreaterThan(0);
    expect(cell.intensityTrend).toContain("weakening");
    expect(cell.positionSummary).toContain("Precipitation band");
  });

  it("is deterministic for the same snapshot", () => {
    const scenario = canonicalFrontPassageScenarios[3]!;
    const machine = createSessionMachine(scenario);
    const state = stateAtMinute(machine.kernel, 240);
    expect(buildRegionalSummary(scenario, machine.kernel, state)).toEqual(
      buildRegionalSummary(scenario, machine.kernel, state)
    );
  });
});
