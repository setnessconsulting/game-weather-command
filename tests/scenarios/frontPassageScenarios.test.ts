import { describe, expect, it } from "vitest";

import { getScenarioOutcomeFacts, stateAtMinute } from "@/domain";
import {
  canonicalFrontPassageScenarios,
  guidedColdFront,
  independentColdFront,
  uncertainBoundary,
  warmFront,
} from "@/scenarios/frontPassageScenarios";
import { parseWeatherScenario, toKernelScenario } from "@/scenarios/schema";

function centralAt(scenario: typeof guidedColdFront, minute: number) {
  return stateAtMinute(toKernelScenario(scenario), minute).stations.central;
}

describe("WC-04 canonical Front Passage science content", () => {
  it("ships exactly the four locked v1 mission types", () => {
    expect(canonicalFrontPassageScenarios.map((scenario) => scenario.missionType)).toEqual([
      "guided-cold-front",
      "independent-cold-front",
      "warm-front",
      "uncertain-boundary",
    ]);
    expect(new Set(canonicalFrontPassageScenarios.map((scenario) => scenario.scenarioId)).size).toBe(4);
  });

  it("keeps independent science review truthfully pending", () => {
    expect(canonicalFrontPassageScenarios.every(
      (scenario) => scenario.scienceReviewStatus === "pending-independent",
    )).toBe(true);
  });

  it("round-trips every canonical scenario through authored validation", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      expect(parseWeatherScenario(structuredClone(scenario))).toEqual(scenario);
      expect(scenario.sources.every((source) => source.reviewed)).toBe(true);
    }
  });

  it("locks the guided cold-front Central Station golden trace", () => {
    expect([
      centralAt(guidedColdFront, 0),
      centralAt(guidedColdFront, 60),
      centralAt(guidedColdFront, 120),
      centralAt(guidedColdFront, 180),
      centralAt(guidedColdFront, 240),
    ]).toEqual([
      { temperatureC: 23, pressureHpa: 1006, pressureTendencyHpaPer3h: -2, relativeHumidityPct: 78, windDirectionDeg: 190, windSpeedMps: 4, precipitationRateMmh: 0 },
      { temperatureC: 23, pressureHpa: 1006, pressureTendencyHpaPer3h: -2, relativeHumidityPct: 78, windDirectionDeg: 190, windSpeedMps: 4, precipitationRateMmh: 0 },
      { temperatureC: 16, pressureHpa: 1012, pressureTendencyHpaPer3h: 3, relativeHumidityPct: 60, windDirectionDeg: 265, windSpeedMps: 7, precipitationRateMmh: 4 },
      { temperatureC: 16, pressureHpa: 1012, pressureTendencyHpaPer3h: 3, relativeHumidityPct: 56, windDirectionDeg: 265, windSpeedMps: 7, precipitationRateMmh: 2 },
      { temperatureC: 16, pressureHpa: 1012, pressureTendencyHpaPer3h: 3, relativeHumidityPct: 52, windDirectionDeg: 265, windSpeedMps: 7, precipitationRateMmh: 0 },
    ]);
  });

  it("locks the independent cold-front Central Station golden trace", () => {
    expect([
      centralAt(independentColdFront as typeof guidedColdFront, 0),
      centralAt(independentColdFront as typeof guidedColdFront, 120),
      centralAt(independentColdFront as typeof guidedColdFront, 180),
      centralAt(independentColdFront as typeof guidedColdFront, 240),
      centralAt(independentColdFront as typeof guidedColdFront, 300),
    ]).toEqual([
      { temperatureC: 22, pressureHpa: 1008, pressureTendencyHpaPer3h: -1.5, relativeHumidityPct: 69, windDirectionDeg: 185, windSpeedMps: 5, precipitationRateMmh: 0 },
      { temperatureC: 22, pressureHpa: 1008, pressureTendencyHpaPer3h: -1.5, relativeHumidityPct: 69, windDirectionDeg: 185, windSpeedMps: 5, precipitationRateMmh: 0 },
      { temperatureC: 16, pressureHpa: 1013, pressureTendencyHpaPer3h: 2, relativeHumidityPct: 55, windDirectionDeg: 270, windSpeedMps: 7.5, precipitationRateMmh: 2 },
      { temperatureC: 16, pressureHpa: 1013, pressureTendencyHpaPer3h: 2, relativeHumidityPct: 49, windDirectionDeg: 270, windSpeedMps: 7.5, precipitationRateMmh: 0 },
      { temperatureC: 16, pressureHpa: 1013, pressureTendencyHpaPer3h: 2, relativeHumidityPct: 49, windDirectionDeg: 270, windSpeedMps: 7.5, precipitationRateMmh: 0 },
    ]);
  });

  it("locks the warm-front Central Station golden trace and preserves gradual change", () => {
    expect([
      centralAt(warmFront as typeof guidedColdFront, 0),
      centralAt(warmFront as typeof guidedColdFront, 120),
      centralAt(warmFront as typeof guidedColdFront, 180),
      centralAt(warmFront as typeof guidedColdFront, 300),
    ]).toEqual([
      { temperatureC: 15, pressureHpa: 1016, pressureTendencyHpaPer3h: -1, relativeHumidityPct: 62, windDirectionDeg: 110, windSpeedMps: 3, precipitationRateMmh: 0 },
      { temperatureC: 16.666666666667, pressureHpa: 1015, pressureTendencyHpaPer3h: -0.5, relativeHumidityPct: 66, windDirectionDeg: 126.666666666667, windSpeedMps: 3.666666666667, precipitationRateMmh: 0.666666666667 },
      { temperatureC: 20, pressureHpa: 1013, pressureTendencyHpaPer3h: 0.5, relativeHumidityPct: 74, windDirectionDeg: 160, windSpeedMps: 5, precipitationRateMmh: 2 },
      { temperatureC: 20, pressureHpa: 1013, pressureTendencyHpaPer3h: 0.5, relativeHumidityPct: 74, windDirectionDeg: 160, windSpeedMps: 5, precipitationRateMmh: 0 },
    ]);
  });

  it("locks seeded uncertain-boundary observations without randomizing truth after commitment", () => {
    const kernel = toKernelScenario(uncertainBoundary);
    const at180 = stateAtMinute(kernel, 180).stations.central;
    const repeated = stateAtMinute(kernel, 180).stations.central;

    expect(at180).toEqual(repeated);
    expect(at180).toEqual({
      temperatureC: 16.020475686295,
      pressureHpa: 1012.739967634715,
      pressureTendencyHpaPer3h: 1.2,
      relativeHumidityPct: 62,
      windDirectionDeg: 217.798989269882,
      windSpeedMps: 6.5,
      precipitationRateMmh: 2.5,
    });
  });

  it("keeps canonical outcomes inside the authored learner forecast envelopes", () => {
    const cases = [
      { scenario: guidedColdFront, minute: 120 },
      { scenario: independentColdFront, minute: 150 },
      { scenario: warmFront, minute: 180 },
      { scenario: uncertainBoundary, minute: 180 },
    ] as const;

    for (const { scenario, minute } of cases) {
      const kernel = toKernelScenario(scenario);
      const state = stateAtMinute(kernel, minute);
      const facts = getScenarioOutcomeFacts(kernel, state);
      const central = facts.stationChanges.find((fact) => fact.stationId === "central");
      const range = scenario.acceptedRanges[0]!;
      const observed = state.stations.central!;

      expect(central).toBeDefined();
      expect(central!.delta.temperatureC).toBeGreaterThanOrEqual(range.temperatureChangeC.min);
      expect(central!.delta.temperatureC).toBeLessThanOrEqual(range.temperatureChangeC.max);
      expect(range.windDirectionSectorsDeg.some(
        (sector) => observed.windDirectionDeg >= sector.min && observed.windDirectionDeg <= sector.max,
      )).toBe(true);
    }
  });

  it("rejects unresolved science references instead of silently accepting them", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.stationEffects[0]!.sourceRefIds = ["missing-source"];
    expect(() => parseWeatherScenario(malformed)).toThrow(/Unknown science source reference/);
  });
});
