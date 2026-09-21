import { describe, expect, it } from "vitest";

import { DomainScenarioError, getScenarioOutcomeFacts, stateAtMinute } from "@/domain";
import {
  canonicalFrontPassageScenarios,
  guidedColdFront,
  independentColdFront,
  uncertainBoundary,
  warmFront,
} from "@/scenarios/frontPassageScenarios";
import {
  parseWeatherScenario,
  toKernelScenario,
  type WeatherScenarioV1,
} from "@/scenarios/schema";

function centralAt(scenario: WeatherScenarioV1, minute: number) {
  return stateAtMinute(toKernelScenario(scenario), minute).stations.central;
}

/**
 * Independent re-derivation of the front's position, so the coherence claims below are
 * checked against the authored motion rather than against the validator's own arithmetic.
 */
function frontXAtMinute(scenario: WeatherScenarioV1, minute: number): number {
  const boundary = scenario.boundaries[0]!;
  return boundary.initialPath[0]!.x + boundary.movement.x * (minute / scenario.timeline.stepMinutes);
}

function stationById(scenario: WeatherScenarioV1, stationId: string) {
  return scenario.stations.find((station) => station.id === stationId)!;
}

/** Earliest boundary-linked station effect: the authored passage rule for that station. */
function passageWindow(scenario: WeatherScenarioV1, stationId: string) {
  const effects = scenario.stationEffects
    .filter((effect) => effect.stationId === stationId && effect.boundaryId !== undefined)
    .sort((left, right) => left.startMinute - right.startMinute);
  expect(effects.length).toBeGreaterThan(0);
  return effects[0]!;
}

function crossingMinute(scenario: WeatherScenarioV1, stationId: string): number {
  const boundary = scenario.boundaries[0]!;
  const station = stationById(scenario, stationId);
  const referenceX = boundary.initialPath[0]!.x;
  return ((station.position.x - referenceX) / boundary.movement.x) * scenario.timeline.stepMinutes;
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
      { temperatureC: 16, pressureHpa: 1010, pressureTendencyHpaPer3h: 2, relativeHumidityPct: 60, windDirectionDeg: 265, windSpeedMps: 7, precipitationRateMmh: 4 },
      { temperatureC: 16, pressureHpa: 1010, pressureTendencyHpaPer3h: 2, relativeHumidityPct: 56, windDirectionDeg: 265, windSpeedMps: 7, precipitationRateMmh: 2 },
      { temperatureC: 16, pressureHpa: 1010, pressureTendencyHpaPer3h: 2, relativeHumidityPct: 52, windDirectionDeg: 265, windSpeedMps: 7, precipitationRateMmh: 0 },
    ]);
  });

  it("locks the independent cold-front Central Station golden trace", () => {
    expect([
      centralAt(independentColdFront, 0),
      centralAt(independentColdFront, 120),
      centralAt(independentColdFront, 180),
      centralAt(independentColdFront, 240),
      centralAt(independentColdFront, 300),
    ]).toEqual([
      { temperatureC: 22, pressureHpa: 1008, pressureTendencyHpaPer3h: -1.5, relativeHumidityPct: 69, windDirectionDeg: 185, windSpeedMps: 5, precipitationRateMmh: 0 },
      { temperatureC: 22, pressureHpa: 1008, pressureTendencyHpaPer3h: -1.5, relativeHumidityPct: 69, windDirectionDeg: 185, windSpeedMps: 5, precipitationRateMmh: 0 },
      { temperatureC: 16, pressureHpa: 1012, pressureTendencyHpaPer3h: 1.5, relativeHumidityPct: 55, windDirectionDeg: 270, windSpeedMps: 7.5, precipitationRateMmh: 2 },
      { temperatureC: 16, pressureHpa: 1012, pressureTendencyHpaPer3h: 1.5, relativeHumidityPct: 49, windDirectionDeg: 270, windSpeedMps: 7.5, precipitationRateMmh: 0 },
      { temperatureC: 16, pressureHpa: 1012, pressureTendencyHpaPer3h: 1.5, relativeHumidityPct: 49, windDirectionDeg: 270, windSpeedMps: 7.5, precipitationRateMmh: 0 },
    ]);
  });

  it("locks the warm-front Central Station golden trace and preserves gradual change", () => {
    expect([
      centralAt(warmFront, 0),
      centralAt(warmFront, 120),
      centralAt(warmFront, 180),
      centralAt(warmFront, 300),
    ]).toEqual([
      { temperatureC: 15, pressureHpa: 1016, pressureTendencyHpaPer3h: -1, relativeHumidityPct: 62, windDirectionDeg: 110, windSpeedMps: 3, precipitationRateMmh: 0 },
      { temperatureC: 16.666666666667, pressureHpa: 1015.333333333333, pressureTendencyHpaPer3h: -0.5, relativeHumidityPct: 66, windDirectionDeg: 126.666666666667, windSpeedMps: 3.666666666667, precipitationRateMmh: 0.666666666667 },
      { temperatureC: 20, pressureHpa: 1014, pressureTendencyHpaPer3h: 0.5, relativeHumidityPct: 74, windDirectionDeg: 160, windSpeedMps: 5, precipitationRateMmh: 2 },
      { temperatureC: 20, pressureHpa: 1014, pressureTendencyHpaPer3h: 0.5, relativeHumidityPct: 74, windDirectionDeg: 160, windSpeedMps: 5, precipitationRateMmh: 0 },
    ]);
  });

  it("locks the full seeded uncertain-boundary trace without randomizing truth after commitment", () => {
    const kernel = toKernelScenario(uncertainBoundary);
    const trace = uncertainBoundary.timeline.checkpoints.map(
      (minute) => stateAtMinute(kernel, minute).stations.central,
    );

    // Replay identity: the same scenario/seed/time reproduces the same observation exactly.
    expect(trace).toEqual(uncertainBoundary.timeline.checkpoints.map(
      (minute) => stateAtMinute(kernel, minute).stations.central,
    ));

    expect(trace).toEqual([
      { temperatureC: 21, pressureHpa: 1009, pressureTendencyHpaPer3h: -0.8, relativeHumidityPct: 72, windDirectionDeg: 170, windSpeedMps: 4.5, precipitationRateMmh: 0 },
      { temperatureC: 21, pressureHpa: 1009, pressureTendencyHpaPer3h: -0.8, relativeHumidityPct: 72, windDirectionDeg: 170, windSpeedMps: 4.5, precipitationRateMmh: 0 },
      { temperatureC: 21, pressureHpa: 1009, pressureTendencyHpaPer3h: -0.8, relativeHumidityPct: 72, windDirectionDeg: 170, windSpeedMps: 4.5, precipitationRateMmh: 0 },
      { temperatureC: 16.834365343675, pressureHpa: 1011.541832670011, pressureTendencyHpaPer3h: 0.7, relativeHumidityPct: 62, windDirectionDeg: 222.077103231102, windSpeedMps: 6.5, precipitationRateMmh: 2.5 },
      { temperatureC: 16.67458553263, pressureHpa: 1011.110333937034, pressureTendencyHpaPer3h: 0.7, relativeHumidityPct: 62, windDirectionDeg: 217.224070884287, windSpeedMps: 6.5, precipitationRateMmh: 2.5 },
      { temperatureC: 16.922274971846, pressureHpa: 1011.177922178432, pressureTendencyHpaPer3h: 0.7, relativeHumidityPct: 62, windDirectionDeg: 222.58282828331, windSpeedMps: 6.5, precipitationRateMmh: 2.5 },
    ]);

    // Bounded observational variation must stay genuinely bounded.
    const amplitude = uncertainBoundary.stationEffects[1]!.noise!.temperatureC!.amplitude;
    const settled = stateAtMinute(kernel, uncertainBoundary.timeline.maxMinute).stations.central!;
    expect(Math.abs(settled.temperatureC - (21 - 4.5))).toBeLessThanOrEqual(amplitude);
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

describe("WC-04 front motion and station evidence agree", () => {
  it("places the front at each station inside that station's authored change window", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      for (const station of scenario.stations) {
        const window = passageWindow(scenario, station.id);
        const crossing = crossingMinute(scenario, station.id);
        expect(
          crossing,
          `${scenario.scenarioId}/${station.id} crossing ${crossing} must fall in [${window.startMinute}, ${window.endMinute}]`,
        ).toBeGreaterThanOrEqual(window.startMinute);
        expect(crossing).toBeLessThanOrEqual(window.endMinute);
      }
    }
  });

  it("keeps every front inside the region for the scenario timeline and moving west to east", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const boundary = scenario.boundaries[0]!;
      expect(boundary.movement.x).toBeGreaterThan(0);
      expect(frontXAtMinute(scenario, 0)).toBeLessThan(stationById(scenario, "west").position.x);
      expect(frontXAtMinute(scenario, 0)).toBeGreaterThanOrEqual(0);
      // The front must actually leave the region rather than stalling short of the east station.
      expect(frontXAtMinute(scenario, scenario.timeline.maxMinute)).toBeGreaterThanOrEqual(1);
    }
  });

  it("derives transition width from front speed and window duration", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const boundary = scenario.boundaries[0]!;
      for (const station of scenario.stations) {
        const window = passageWindow(scenario, station.id);
        const expected =
          boundary.movement.x * ((window.endMinute - window.startMinute) / scenario.timeline.stepMinutes);
        expect(boundary.transitionWidth).toBeCloseTo(expected, 9);
      }
    }
  });

  it("keeps the warm front materially more gradual than either cold front", () => {
    const guided = guidedColdFront.boundaries[0]!;
    const independent = independentColdFront.boundaries[0]!;
    const warm = warmFront.boundaries[0]!;

    expect(warm.transitionWidth).toBeGreaterThan(guided.transitionWidth * 2);
    expect(warm.transitionWidth).toBeGreaterThan(independent.transitionWidth * 2);
    expect(guided.transitionWidth).toBeGreaterThan(independent.transitionWidth);

    const warmPassage = warmFront.stationEffects.find((effect) => effect.stationId === "central")!;
    const guidedPassage = guidedColdFront.stationEffects.find((effect) => effect.stationId === "central")!;
    expect(warmPassage.endMinute - warmPassage.startMinute).toBeGreaterThan(
      guidedPassage.endMinute - guidedPassage.startMinute,
    );
  });

  it("keeps each frontal precipitation band riding its front across the affected stations", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const boundary = scenario.boundaries[0]!;
      expect(scenario.precipitationCells.length).toBeGreaterThan(0);
      for (const cell of scenario.precipitationCells) {
        expect(cell.movement).toEqual(boundary.movement);
      }
    }

    // The warm-front band sits ahead of the front but must still arrive inside the
    // window in which each station's precipitation is authored to change.
    for (const scenario of canonicalFrontPassageScenarios) {
      const cell = scenario.precipitationCells[0]!;
      for (const station of scenario.stations) {
        const window = passageWindow(scenario, station.id);
        const bandArrival =
          (((station.position.x - cell.initialCenter.x) / cell.movement.x) * scenario.timeline.stepMinutes);
        expect(
          bandArrival,
          `${scenario.scenarioId}/${station.id} band arrival ${bandArrival} must fall in [${window.startMinute}, ${window.endMinute}]`,
        ).toBeGreaterThanOrEqual(window.startMinute);
        expect(bandArrival).toBeLessThanOrEqual(window.endMinute);
      }
    }
  });
});

describe("WC-04 authored coherence fails closed", () => {
  it("rejects a front authored far from the station it is said to change", () => {
    const malformed = structuredClone(guidedColdFront);
    // Pull the front back west: it would then reach West Station long before minute 30.
    malformed.boundaries[0]!.initialPath = [
      { x: 0.2, y: 0.08 },
      { x: 0.2, y: 0.92 },
    ];
    malformed.airMasses[0]!.initialCenter = { x: 0.1, y: 0.5 };
    expect(() => parseWeatherScenario(malformed)).toThrow(/passage at station "west"/);
    expect(() => parseWeatherScenario(malformed)).toThrow(DomainScenarioError);
  });

  it("rejects a transition width that does not match the authored change window", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.boundaries[0]!.transitionWidth = 0.3;
    expect(() => parseWeatherScenario(malformed)).toThrow(/transitionWidth/);
  });

  it("rejects a precipitation band that does not ride a modeled front", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.precipitationCells[0]!.movement = { x: 0.04, y: 0 };
    expect(() => parseWeatherScenario(malformed)).toThrow(/must move with a modeled front/);
  });

});
