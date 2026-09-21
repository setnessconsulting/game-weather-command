import type { KernelScenarioDefinition } from "@/domain";

const baseStation = {
  pressureTendencyHpaPer3h: -1,
  relativeHumidityPct: 70,
  windDirectionDeg: 180,
  windSpeedMps: 5,
  precipitationRateMmh: 0
} as const;

export const frontPassageFixture: KernelScenarioDefinition = {
  schemaVersion: "1",
  contentVersion: "test-1",
  scenarioId: "front-passage-kernel-fixture",
  seed: 42,
  timeline: {
    startMinute: 0,
    stepMinutes: 30,
    maxMinute: 180,
    checkpoints: [0, 60, 120, 180]
  },
  stations: [
    {
      id: "west",
      name: "West",
      position: { x: 0.2, y: 0.5 },
      initial: { ...baseStation, temperatureC: 22, pressureHpa: 1008 }
    },
    {
      id: "central",
      name: "Central",
      position: { x: 0.5, y: 0.5 },
      initial: { ...baseStation, temperatureC: 23, pressureHpa: 1007 }
    },
    {
      id: "east",
      name: "East",
      position: { x: 0.8, y: 0.5 },
      initial: { ...baseStation, temperatureC: 24, pressureHpa: 1006 }
    }
  ],
  airMasses: [
    {
      id: "cool-dry",
      label: "Cooler, drier air",
      initialCenter: { x: 0.15, y: 0.5 },
      movement: { x: 0.02, y: 0 },
      sourceRefIds: ["source-fronts"]
    },
    {
      id: "warm-moist",
      label: "Warmer, moister air",
      initialCenter: { x: 0.7, y: 0.5 },
      movement: { x: 0.01, y: 0 },
      sourceRefIds: ["source-fronts"]
    }
  ],
  boundaries: [
    {
      id: "cold-front",
      kind: "cold-front",
      airMassAId: "cool-dry",
      airMassBId: "warm-moist",
      initialPath: [
        { x: 0.35, y: 0.1 },
        { x: 0.35, y: 0.9 }
      ],
      movement: { x: 0.05, y: 0 },
      transitionWidth: 0.1,
      sourceRefIds: ["source-fronts"]
    }
  ],
  precipitationCells: [
    {
      id: "band",
      initialCenter: { x: 0.4, y: 0.5 },
      movement: { x: 0.04, y: 0 },
      initialIntensityMmh: 2,
      intensityDeltaMmhPerStep: 1
    }
  ],
  stationEffects: [
    {
      id: "central-passage",
      stationId: "central",
      boundaryId: "cold-front",
      startMinute: 60,
      endMinute: 120,
      delta: {
        temperatureC: -8,
        pressureHpa: 8,
        pressureTendencyHpaPer3h: 4,
        relativeHumidityPct: -20,
        windDirectionDeg: 90,
        windSpeedMps: 3,
        precipitationRateMmh: 6
      },
      sourceRefIds: ["source-fronts"]
    }
  ],
  forecastWindows: [
    {
      id: "central-next-90",
      targetStationIds: ["central"],
      startMinute: 0,
      endMinute: 90
    }
  ]
};

export const noisyFrontPassageFixture: KernelScenarioDefinition = {
  ...frontPassageFixture,
  scenarioId: "front-passage-noisy-fixture",
  stationEffects: frontPassageFixture.stationEffects.map((effect) => ({
    ...effect,
    noise: {
      temperatureC: { amplitude: 0.25, key: "sensor-temp" },
      pressureHpa: { amplitude: 0.2, key: "sensor-pressure" }
    }
  }))
};
