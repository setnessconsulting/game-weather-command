import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  it("locks every station observation of every canonical scenario in the golden matrix", () => {
    // The full three-station by every-step matrix is locked in
    // tests/fixtures/goldenObservationMatrix.json and asserted by
    // tests/scenarios/goldenObservationMatrix.test.ts. This test keeps the binding
    // visible here: the matrix must cover exactly the four canonical scenarios.
    const matrix = JSON.parse(
      readFileSync(resolve(process.cwd(), "tests/fixtures/goldenObservationMatrix.json"), "utf8")
    ) as { scenarios: Record<string, { contentVersion: string }> };

    expect(Object.keys(matrix.scenarios).sort()).toEqual([
      "guided-cold-front-shift",
      "independent-cold-front-variant",
      "uncertain-boundary-variant",
      "warm-front-gradual-change",
    ]);
    for (const scenario of canonicalFrontPassageScenarios) {
      expect(matrix.scenarios[scenario.scenarioId]?.contentVersion).toBe(scenario.contentVersion);
    }
  });

  it("keeps the uncertain mission's observational noise bounded around the authored change", () => {
    const kernel = toKernelScenario(uncertainBoundary);
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

  it("keeps each frontal precipitation band riding its front", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const boundary = scenario.boundaries[0]!;
      expect(scenario.precipitationCells.length).toBeGreaterThan(0);
      for (const cell of scenario.precipitationCells) {
        expect(cell.movement).toEqual(boundary.movement);
      }
    }
  });

  it("makes station precipitation agree with the band at every station and minute", () => {
    // F12 invariant: a station reports precipitation exactly while an authored band
    // covers it, so the radar-style layer and the station record can never disagree
    // about when it is raining.
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const cell = scenario.precipitationCells[0]!;
      for (const station of scenario.stations) {
        for (
          let minute = 0;
          minute <= scenario.timeline.maxMinute;
          minute += scenario.timeline.stepMinutes
        ) {
          const stepIndex = minute / scenario.timeline.stepMinutes;
          const center = {
            x: cell.initialCenter.x + cell.movement.x * stepIndex,
            y: cell.initialCenter.y + cell.movement.y * stepIndex
          };
          const intensity = Math.max(
            0,
            cell.initialIntensityMmh + cell.intensityDeltaMmhPerStep * stepIndex
          );
          const distance = Math.hypot(station.position.x - center.x, station.position.y - center.y);
          // The exact footprint boundary is a float-noise zone; the invariant is only
          // asserted where coverage is unambiguous.
          if (Math.abs(distance - cell.footprintRadius) < 1e-6) continue;
          const covered = distance < cell.footprintRadius && intensity > 0;
          const reported = stateAtMinute(kernel, minute).stations[station.id]!.precipitationRateMmh > 0;
          expect(
            reported,
            `${scenario.scenarioId}/${station.id} at minute ${minute}: rain must match band coverage`
          ).toBe(covered);
        }
      }
    }
  });

  it("clears the uncertain mission's rain once the band leaves the region", () => {
    // F15: the uncertain mission has no post-passage clearing effects; the band
    // leaving the region is what ends the rain, matching the other three missions.
    const kernel = toKernelScenario(uncertainBoundary);
    const finalMinute = uncertainBoundary.timeline.maxMinute;
    const cell = uncertainBoundary.precipitationCells[0]!;
    const stepIndex = finalMinute / uncertainBoundary.timeline.stepMinutes;
    const centerX = cell.initialCenter.x + cell.movement.x * stepIndex;
    expect(centerX).toBeGreaterThan(1);
    for (const station of uncertainBoundary.stations) {
      expect(
        stateAtMinute(kernel, finalMinute).stations[station.id]!.precipitationRateMmh,
        `${station.id} must be dry once the band has left`
      ).toBe(0);
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

  it("rejects a station effect that authors precipitation instead of deriving it from the band", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.stationEffects[0]!.delta.precipitationRateMmh = 4;
    expect(() => parseWeatherScenario(malformed)).toThrow(/must not author precipitationRateMmh/);
  });

  it("rejects a station effect that authors pressure tendency instead of deriving it from the trajectory", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.stationEffects[0]!.delta.pressureTendencyHpaPer3h = 4;
    expect(() => parseWeatherScenario(malformed)).toThrow(/must not author precipitationRateMmh/);
  });

  it("rejects an accepted envelope that excludes the observed transition window", () => {
    const malformed = structuredClone(warmFront);
    // The observed Valley Station window is 90-180; 120-180 excludes the onset.
    malformed.acceptedRanges[0]!.transitionArrivalMinute = { min: 120, max: 180 };
    expect(() => parseWeatherScenario(malformed)).toThrow(/does not contain the observed transition window/);
  });

  it("rejects an accepted envelope for a station with no derivable transition", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.forecastWindows[0]!.targetStationIds = ["central", "west"];
    malformed.acceptedRanges[0]!.targetStationId = "west";
    // Remove west's temperature change: its record then shows no derivable transition.
    delete malformed.stationEffects[0]!.delta.temperatureC;
    expect(() => parseWeatherScenario(malformed)).toThrow(/no derivable temperature transition/);
  });

  it("rejects an accepted envelope that excludes another station's observed window", () => {
    const malformed = structuredClone(guidedColdFront);
    malformed.forecastWindows[0]!.targetStationIds = ["central", "east"];
    malformed.acceptedRanges[0]!.targetStationId = "east";
    // East's observed window is 150-180; the guided envelope 90-120 excludes it.
    expect(() => parseWeatherScenario(malformed)).toThrow(/does not contain the observed transition window/);
  });

});
