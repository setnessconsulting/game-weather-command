import { describe, expect, it } from "vitest";

import {
  assertScenarioCoherence,
  DomainScenarioError,
  type BoundaryDefinition,
  type KernelScenarioDefinition,
  type PrecipitationCellDefinition,
  type StationDefinition,
  type StationEffectRule,
} from "@/domain";

const baseObservation = {
  temperatureC: 20,
  pressureHpa: 1008,
  pressureTendencyHpaPer3h: -1,
  relativeHumidityPct: 70,
  windDirectionDeg: 180,
  windSpeedMps: 4,
  precipitationRateMmh: 0,
} as const;

/**
 * Minimal kernel scenario used to isolate the authored coherence rules.
 * Front at x=0.2 moving 0.05/step; Central at x=0.4 => crossing at step 4 => minute 120,
 * inside the authored 60-120 window, with transitionWidth 0.05 * 2 steps = 0.1.
 */
function coherentScenario(): KernelScenarioDefinition {
  return {
    schemaVersion: "1",
    contentVersion: "coherence-test-1",
    scenarioId: "coherence-test",
    seed: 7,
    timeline: { startMinute: 0, stepMinutes: 30, maxMinute: 180, checkpoints: [0, 60, 120, 180] },
    stations: [
      { id: "west", name: "West", position: { x: 0.1, y: 0.5 }, initial: { ...baseObservation } },
      { id: "central", name: "Central", position: { x: 0.4, y: 0.5 }, initial: { ...baseObservation } },
      { id: "east", name: "East", position: { x: 0.7, y: 0.5 }, initial: { ...baseObservation } },
    ],
    airMasses: [
      {
        id: "cool",
        label: "Cooler air",
        initialCenter: { x: 0.1, y: 0.5 },
        movement: { x: 0.05, y: 0 },
        sourceRefIds: ["source-fronts"],
      },
      {
        id: "mild",
        label: "Milder air",
        initialCenter: { x: 0.7, y: 0.5 },
        movement: { x: 0.01, y: 0 },
        sourceRefIds: ["source-fronts"],
      },
    ],
    boundaries: [
      {
        id: "cold-front",
        kind: "cold-front",
        airMassAId: "cool",
        airMassBId: "mild",
        initialPath: [
          { x: 0.2, y: 0.05 },
          { x: 0.2, y: 0.95 },
        ],
        movement: { x: 0.05, y: 0 },
        transitionWidth: 0.1,
        sourceRefIds: ["source-fronts"],
      },
    ],
    precipitationCells: [
      {
        id: "band",
        initialCenter: { x: 0.2, y: 0.5 },
        movement: { x: 0.05, y: 0 },
        initialIntensityMmh: 2,
        intensityDeltaMmhPerStep: 0,
        sourceRefIds: ["source-fronts"],
      },
    ],
    stationEffects: [
      {
        id: "central-passage",
        stationId: "central",
        boundaryId: "cold-front",
        startMinute: 60,
        endMinute: 120,
        delta: { temperatureC: -6 },
        sourceRefIds: ["source-fronts"],
      },
    ],
    forecastWindows: [
      { id: "central-window", targetStationIds: ["central"], startMinute: 0, endMinute: 120 },
    ],
  };
}

interface ScenarioOverrides {
  readonly boundary?: Partial<BoundaryDefinition>;
  readonly precipitationCell?: Partial<PrecipitationCellDefinition>;
  readonly stationEffect?: Partial<StationEffectRule>;
  readonly additionalStationEffect?: StationEffectRule;
  readonly stationOverrides?: Readonly<Record<string, Partial<StationDefinition>>>;
}

function scenarioWith(overrides: ScenarioOverrides = {}): KernelScenarioDefinition {
  const base = coherentScenario();
  return {
    ...base,
    stations: base.stations.map((station) => ({
      ...station,
      ...(overrides.stationOverrides?.[station.id] ?? {}),
    })),
    boundaries: base.boundaries.map((boundary) => ({ ...boundary, ...(overrides.boundary ?? {}) })),
    precipitationCells: base.precipitationCells.map((cell) => ({
      ...cell,
      ...(overrides.precipitationCell ?? {}),
    })),
    stationEffects: [
      ...base.stationEffects.map((effect) => ({ ...effect, ...(overrides.stationEffect ?? {}) })),
      ...(overrides.additionalStationEffect ? [overrides.additionalStationEffect] : []),
    ],
  };
}

describe("authored front/station coherence", () => {
  it("accepts a scenario whose front reaches the station inside its change window", () => {
    expect(() => assertScenarioCoherence(scenarioWith())).not.toThrow();
  });

  it("rejects a station change that completes before the front arrives", () => {
    expect(() => assertScenarioCoherence(
      scenarioWith({ stationEffect: { startMinute: 0, endMinute: 30 } }),
    )).toThrow(/Effect central-passage claims boundary "cold-front" passage at station "central"/);
  });

  it("rejects a station change authored after the front has already passed", () => {
    expect(() => assertScenarioCoherence(
      scenarioWith({ stationEffect: { startMinute: 150, endMinute: 180 } }),
    )).toThrow(/outside the authored/);
  });

  it("treats a boundary that never moves as a failed passage claim", () => {
    expect(() => assertScenarioCoherence(scenarioWith({
      boundary: { movement: { x: 0, y: 0 } },
      precipitationCell: { movement: { x: 0, y: 0 } },
    }))).toThrow(/never within the timeline/);
  });

  it("treats a front that stalls short of the station as a failed passage claim", () => {
    // 0.01/step from x=0.2 never reaches x=0.4 inside 180 minutes.
    expect(() => assertScenarioCoherence(scenarioWith({
      boundary: { movement: { x: 0.01, y: 0 } },
      precipitationCell: { movement: { x: 0.01, y: 0 } },
    }))).toThrow(/never within the timeline/);
  });

  it("requires the transition width to match front speed across the change window", () => {
    let thrown: unknown;
    try {
      assertScenarioCoherence(scenarioWith({ boundary: { transitionWidth: 0.4 } }));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(DomainScenarioError);
    expect((thrown as Error).message).toMatch(/transitionWidth/);
  });

  it("requires every precipitation cell to ride a modeled front", () => {
    expect(() => assertScenarioCoherence(
      scenarioWith({ precipitationCell: { movement: { x: 0.02, y: 0 } } }),
    )).toThrow(/must move with a modeled front/);
  });

  it("resolves the reference front position at the station latitude on a diagonal path", () => {
    // Diagonal path from x=0.1@y=0 to x=0.3@y=1 => x=0.2 at Central's y=0.5, unchanged crossing.
    const scenario = scenarioWith({
      boundary: {
        initialPath: [
          { x: 0.1, y: 0 },
          { x: 0.3, y: 1 },
        ],
      },
    });
    expect(() => assertScenarioCoherence(scenario)).not.toThrow();
  });

  it("skips boundaries that translate along y rather than guessing at their geometry", () => {
    expect(() => assertScenarioCoherence(scenarioWith({
      boundary: { movement: { x: 0.05, y: 0.01 } },
      precipitationCell: { movement: { x: 0.05, y: 0.01 } },
    }))).not.toThrow();
  });

  it("falls back to the first path point when the path does not span the station latitude", () => {
    const scenario = scenarioWith({
      stationOverrides: { central: { position: { x: 0.4, y: 1 } } },
    });
    expect(() => assertScenarioCoherence(scenario)).not.toThrow();
  });

  it("scopes the timing rule to the passage rule, not to post-frontal follow-up effects", () => {
    const scenario = scenarioWith({
      additionalStationEffect: {
        id: "central-drying",
        stationId: "central",
        boundaryId: "cold-front",
        startMinute: 120,
        endMinute: 180,
        delta: { relativeHumidityPct: -5 },
        sourceRefIds: ["source-fronts"],
      },
    });
    expect(() => assertScenarioCoherence(scenario)).not.toThrow();
  });
});
