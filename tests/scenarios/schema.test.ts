import { describe, expect, it } from "vitest";

import { foundationScenario } from "@/scenarios/foundationScenario";
import {
  acceptedRangeSchema,
  parseFoundationScenario,
  parseWeatherScenario,
  type WeatherScenarioV1,
} from "@/scenarios/schema";

// A minimal but fully cross-referenced v1 scenario. It passes parseWeatherScenario as is;
// each cross-validation rule is then broken one field at a time.
function validScenario(): WeatherScenarioV1 {
  const stations = [
    { id: "west", name: "West", position: { x: 0.2, y: 0.5 } },
    { id: "central", name: "Central", position: { x: 0.5, y: 0.5 } },
    { id: "east", name: "East", position: { x: 0.8, y: 0.5 } },
  ];
  const initial = {
    temperatureC: 20,
    pressureHpa: 1010,
    pressureTendencyHpaPer3h: -1,
    relativeHumidityPct: 60,
    windDirectionDeg: 180,
    windSpeedMps: 5,
    precipitationRateMmh: 0,
  } as const;
  return {
    schemaVersion: "1",
    contentVersion: "schema-test-1",
    scenarioId: "schema-test",
    title: "Schema Test",
    missionType: "guided-cold-front",
    objective: "Prove the cross-validation layer.",
    learningObjectives: ["Reason from evidence."],
    seed: 5,
    scienceReviewStatus: "pending-independent",
    timeline: { startMinute: 0, stepMinutes: 30, maxMinute: 180, checkpoints: [0, 90, 180] },
    stations: stations.map((station) => ({ ...station, initial: { ...initial } })),
    airMasses: [
      {
        id: "cool",
        label: "Cool",
        initialCenter: { x: 0.2, y: 0.5 },
        movement: { x: 0, y: 0 },
        sourceRefIds: ["s1"],
      },
      {
        id: "mild",
        label: "Mild",
        initialCenter: { x: 0.8, y: 0.5 },
        movement: { x: 0, y: 0 },
        sourceRefIds: ["s1"],
      },
    ],
    boundaries: [
      {
        id: "edge",
        kind: "other-bounded-transition",
        airMassAId: "cool",
        airMassBId: "mild",
        initialPath: [
          { x: 0.4, y: 0 },
          { x: 0.4, y: 1 },
        ],
        movement: { x: 0, y: 0 },
        transitionWidth: 0.1,
        sourceRefIds: ["s1"],
      },
    ],
    precipitationCells: [],
    stationEffects: [
      {
        id: "west-change",
        stationId: "west",
        startMinute: 60,
        endMinute: 120,
        delta: { temperatureC: -5 },
        sourceRefIds: ["s1"],
      },
    ],
    forecastWindows: [
      { id: "central-window", targetStationIds: ["central"], startMinute: 0, endMinute: 150 },
    ],
    evidence: [
      {
        id: "stations",
        type: "station",
        availableAtMinute: 0,
        targetIds: ["west", "central", "east"],
        learningTags: ["baseline"],
      },
    ],
    acceptedRanges: [
      {
        id: "central-accepted",
        forecastWindowId: "central-window",
        targetStationId: "central",
        transitionArrivalMinute: { min: 0, max: 150 },
        temperatureChangeC: { min: -10, max: 10 },
        precipitationProbabilityPct: { min: 0, max: 100 },
        windDirectionSectorsDeg: [{ min: 0, max: 360 }],
        defensibleConfidence: ["low"],
      },
    ],
    debrief: [
      {
        id: "debrief-1",
        evidenceIds: ["stations"],
        outcomeDimensions: ["temperature"],
        explanation: "The station changed.",
        sourceRefIds: ["s1"],
      },
    ],
    sources: [
      { id: "s1", url: "https://example.test/fronts", relationship: "Motion", usage: "Model", reviewed: true },
    ],
    simplifications: [{ id: "simp-1", description: "Simplified.", learnerFacing: true }],
  };
}

describe("foundationScenarioSchema", () => {
  it("accepts the canonical foundation fixture", () => {
    expect(parseFoundationScenario(foundationScenario)).toEqual(foundationScenario);
  });

  it("rejects an insufficient station set", () => {
    expect(() => parseFoundationScenario({ ...foundationScenario, stations: [] })).toThrow();
  });

  it("rejects out-of-bounds normalized coordinates", () => {
    const invalid = {
      ...foundationScenario,
      stations: foundationScenario.stations.map((station, index) =>
        index === 0 ? { ...station, position: { x: 2, y: station.position.y } } : station,
      ),
    };
    expect(() => parseFoundationScenario(invalid)).toThrow();
  });
});

describe("weatherScenarioV1 cross-validation", () => {
  it("accepts a fully cross-referenced minimal scenario", () => {
    expect(parseWeatherScenario(structuredClone(validScenario()))).toEqual(validScenario());
  });

  it("rejects duplicated source, evidence, accepted-range and debrief identifiers", () => {
    const duplicateSource = structuredClone(validScenario());
    duplicateSource.sources.push({ ...duplicateSource.sources[0]! });
    expect(() => parseWeatherScenario(duplicateSource)).toThrow(/sources/);

    const duplicateEvidence = structuredClone(validScenario());
    duplicateEvidence.evidence.push({ ...duplicateEvidence.evidence[0]! });
    expect(() => parseWeatherScenario(duplicateEvidence)).toThrow(/evidence/);

    const duplicateRange = structuredClone(validScenario());
    duplicateRange.acceptedRanges.push({ ...duplicateRange.acceptedRanges[0]! });
    expect(() => parseWeatherScenario(duplicateRange)).toThrow(/acceptedRanges/);

    const duplicateDebrief = structuredClone(validScenario());
    duplicateDebrief.debrief.push({ ...duplicateDebrief.debrief[0]! });
    expect(() => parseWeatherScenario(duplicateDebrief)).toThrow(/debrief/);
  });

  it("rejects evidence scheduled off the simulation grid or beyond the timeline", () => {
    const midStep = structuredClone(validScenario());
    midStep.evidence[0]!.availableAtMinute = 45;
    expect(() => parseWeatherScenario(midStep)).toThrow(/in-range simulation step/);

    const tooLate = structuredClone(validScenario());
    tooLate.evidence[0]!.availableAtMinute = 210;
    expect(() => parseWeatherScenario(tooLate)).toThrow(/in-range simulation step/);
  });

  it("rejects evidence that names a target outside its evidence kind", () => {
    const wrongKind = structuredClone(validScenario());
    wrongKind.evidence[0]!.type = "boundary";
    expect(() => parseWeatherScenario(wrongKind)).toThrow(/unknown target/);
  });

  it("rejects accepted ranges that reference unknown windows or stations, or escape the window", () => {
    const unknownWindow = structuredClone(validScenario());
    unknownWindow.acceptedRanges[0]!.forecastWindowId = "no-such-window";
    expect(() => parseWeatherScenario(unknownWindow)).toThrow(/unknown forecast window/);

    const unknownStation = structuredClone(validScenario());
    unknownStation.acceptedRanges[0]!.targetStationId = "no-such-station";
    expect(() => parseWeatherScenario(unknownStation)).toThrow(/unknown station/);

    const outsideWindow = structuredClone(validScenario());
    outsideWindow.acceptedRanges[0]!.targetStationId = "west";
    expect(() => parseWeatherScenario(outsideWindow)).toThrow(/outside its forecast window/);

    const lateTiming = structuredClone(validScenario());
    lateTiming.acceptedRanges[0]!.transitionArrivalMinute = { min: 0, max: 210 };
    expect(() => parseWeatherScenario(lateTiming)).toThrow(/timing must fit its forecast window/);
  });

  it("rejects debrief relationships that cite evidence the scenario does not ship", () => {
    const broken = structuredClone(validScenario());
    broken.debrief[0]!.evidenceIds = ["no-such-evidence"];
    expect(() => parseWeatherScenario(broken)).toThrow(/unknown evidence/);
  });
});

describe("acceptedRangeSchema boundaries", () => {
  const range = {
    id: "r1",
    forecastWindowId: "w1",
    targetStationId: "central",
    transitionArrivalMinute: { min: 0, max: 100 },
    temperatureChangeC: { min: -8, max: -5 },
    precipitationProbabilityPct: { min: 0, max: 100 },
    windDirectionSectorsDeg: [{ min: 240, max: 300 }],
    defensibleConfidence: ["medium"],
  } as const;

  it("accepts probability and wind edges at exactly 0 and 100 / 360", () => {
    expect(acceptedRangeSchema.parse(range)).toBeDefined();
    expect(acceptedRangeSchema.parse({ ...range, windDirectionSectorsDeg: [{ min: 0, max: 360 }] })).toBeDefined();
  });

  it("rejects probability percentages outside [0, 100]", () => {
    expect(() =>
      acceptedRangeSchema.parse({ ...range, precipitationProbabilityPct: { min: 0, max: 101 } })
    ).toThrow();
    expect(() =>
      acceptedRangeSchema.parse({ ...range, precipitationProbabilityPct: { min: -1, max: 100 } })
    ).toThrow();
  });

  it("rejects an inverted probability range and an inverted wind sector", () => {
    expect(() =>
      acceptedRangeSchema.parse({ ...range, precipitationProbabilityPct: { min: 80, max: 20 } })
    ).toThrow(/min must be <= max/);
    expect(() =>
      acceptedRangeSchema.parse({ ...range, windDirectionSectorsDeg: [{ min: 300, max: 240 }] })
    ).toThrow(/sector min must be < max/);
  });

  it("requires at least one defensible confidence level", () => {
    expect(() => acceptedRangeSchema.parse({ ...range, defensibleConfidence: [] })).toThrow();
  });
});
