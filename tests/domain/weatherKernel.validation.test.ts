import { describe, expect, it } from "vitest";

import {
  advanceScenario,
  deterministicSignedNoise,
  getScenarioOutcomeFacts,
  initializeScenario,
  parseReplayTrace,
  stateAtMinute
} from "@/domain";
import type { KernelScenarioDefinition } from "@/domain";
import { frontPassageFixture } from "./weatherKernel.fixture";

const malformed = (
  overrides: Partial<KernelScenarioDefinition>
): KernelScenarioDefinition =>
  ({ ...frontPassageFixture, ...overrides }) as KernelScenarioDefinition;

describe("WC-03 validation hardening", () => {
  it("rejects invalid timeline definitions", () => {
    expect(() =>
      initializeScenario(malformed({
        timeline: { ...frontPassageFixture.timeline, startMinute: 30 as 0 }
      }))
    ).toThrow(/startMinute/);

    expect(() =>
      initializeScenario(malformed({
        timeline: { ...frontPassageFixture.timeline, stepMinutes: 0 }
      }))
    ).toThrow(/stepMinutes/);

    expect(() =>
      initializeScenario(malformed({
        timeline: { ...frontPassageFixture.timeline, maxMinute: 175 }
      }))
    ).toThrow(/maxMinute/);

    expect(() =>
      initializeScenario(malformed({
        timeline: { ...frontPassageFixture.timeline, checkpoints: [45] }
      }))
    ).toThrow(/checkpoint/);
  });

  it("requires three stations with unique non-empty identifiers", () => {
    expect(() =>
      initializeScenario(malformed({ stations: frontPassageFixture.stations.slice(0, 2) }))
    ).toThrow(/at least three stations/);

    expect(() =>
      initializeScenario(malformed({
        stations: [
          frontPassageFixture.stations[0]!,
          { ...frontPassageFixture.stations[1]!, id: frontPassageFixture.stations[0]!.id },
          frontPassageFixture.stations[2]!
        ]
      }))
    ).toThrow(/duplicate id/);

    expect(() =>
      initializeScenario(malformed({
        stations: [
          { ...frontPassageFixture.stations[0]!, id: " " },
          frontPassageFixture.stations[1]!,
          frontPassageFixture.stations[2]!
        ]
      }))
    ).toThrow(/empty identifier/);
  });

  it("validates air mass and boundary science references", () => {
    expect(() =>
      initializeScenario(malformed({
        airMasses: [
          { ...frontPassageFixture.airMasses[0]!, sourceRefIds: [] },
          frontPassageFixture.airMasses[1]!
        ]
      }))
    ).toThrow(/source reference/);

    expect(() =>
      initializeScenario(malformed({
        boundaries: [{
          ...frontPassageFixture.boundaries[0]!,
          airMassAId: "missing"
        }]
      }))
    ).toThrow(/unknown air mass/);

    expect(() =>
      initializeScenario(malformed({
        boundaries: [{
          ...frontPassageFixture.boundaries[0]!,
          airMassBId: frontPassageFixture.boundaries[0]!.airMassAId
        }]
      }))
    ).toThrow(/separate two air masses/);

    expect(() =>
      initializeScenario(malformed({
        boundaries: [{
          ...frontPassageFixture.boundaries[0]!,
          initialPath: [{ x: 0.5, y: 0.5 }]
        }]
      }))
    ).toThrow(/at least two path points/);

    expect(() =>
      initializeScenario(malformed({
        boundaries: [{
          ...frontPassageFixture.boundaries[0]!,
          transitionWidth: 0
        }]
      }))
    ).toThrow(/transitionWidth/);
  });

  it("rejects invalid normalized positions and precipitation inputs", () => {
    expect(() =>
      initializeScenario(malformed({
        stations: frontPassageFixture.stations.map((station, index) =>
          index === 0 ? { ...station, position: { x: 1.2, y: 0.5 } } : station
        )
      }))
    ).toThrow(/position.x/);

    expect(() =>
      initializeScenario(malformed({
        precipitationCells: [{
          ...frontPassageFixture.precipitationCells[0]!,
          initialIntensityMmh: -1
        }]
      }))
    ).toThrow(/initialIntensityMmh/);

    expect(() =>
      initializeScenario(malformed({
        precipitationCells: [{
          ...frontPassageFixture.precipitationCells[0]!,
          sourceRefIds: []
        }]
      }))
    ).toThrow(/source reference/);
  });

  it("rejects malformed station effects", () => {
    const effect = frontPassageFixture.stationEffects[0]!;

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{ ...effect, boundaryId: "missing" }]
      }))
    ).toThrow(/unknown boundary/);

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{ ...effect, endMinute: effect.startMinute }]
      }))
    ).toThrow(/invalid time interval/);

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{ ...effect, startMinute: 45 }]
      }))
    ).toThrow(/align to simulation steps/);

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{ ...effect, delta: {} }]
      }))
    ).toThrow(/change at least one observation/);

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{ ...effect, sourceRefIds: [] }]
      }))
    ).toThrow(/source reference/);

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{
          ...effect,
          noise: { temperatureC: { amplitude: -1, key: "bad" } }
        }]
      }))
    ).toThrow(/amplitude/);

    expect(() =>
      initializeScenario(malformed({
        stationEffects: [{
          ...effect,
          noise: { temperatureC: { amplitude: 1, key: " " } }
        }]
      }))
    ).toThrow(/stable key/);
  });

  it("rejects malformed forecast windows", () => {
    const window = frontPassageFixture.forecastWindows[0]!;

    expect(() =>
      initializeScenario(malformed({
        forecastWindows: [{ ...window, endMinute: window.startMinute }]
      }))
    ).toThrow(/invalid time interval/);

    expect(() =>
      initializeScenario(malformed({
        forecastWindows: [{ ...window, endMinute: 75 }]
      }))
    ).toThrow(/align to simulation steps/);

    expect(() =>
      initializeScenario(malformed({
        forecastWindows: [{ ...window, targetStationIds: [] }]
      }))
    ).toThrow(/at least one station/);

    expect(() =>
      initializeScenario(malformed({
        forecastWindows: [{ ...window, targetStationIds: ["central", "central"] }]
      }))
    ).toThrow(/duplicate id/);

    expect(() =>
      initializeScenario(malformed({
        forecastWindows: [{ ...window, targetStationIds: ["missing"] }]
      }))
    ).toThrow(/unknown station/);
  });

  it("rejects invalid requested time and advance operations", () => {
    expect(() => stateAtMinute(frontPassageFixture, 45)).toThrow(/simulation step/);
    expect(() => advanceScenario(frontPassageFixture, initializeScenario(frontPassageFixture), 0))
      .toThrow(/positive integer/);
  });

  it("rejects identity mismatches and ignores mutated presentation state for outcome facts", () => {
    const state = initializeScenario(frontPassageFixture);
    expect(() =>
      getScenarioOutcomeFacts({ ...frontPassageFixture, seed: 99 }, state)
    ).toThrow(/identity\/version\/seed/);

    const mutatedPresentationState = {
      ...state,
      stations: {
        ...state.stations,
        central: { ...state.stations.central!, temperatureC: 69 }
      }
    };
    const facts = getScenarioOutcomeFacts(frontPassageFixture, mutatedPresentationState);
    const central = facts.stationChanges.find((fact) => fact.stationId === "central");
    expect(central?.observed.temperatureC).toBe(23);
  });

  it("keeps zero-amplitude deterministic noise exactly zero", () => {
    expect(deterministicSignedNoise(42, "anything", 0)).toBe(0);
  });

  it("accepts every observation field at its exact bound and rejects one step outside", () => {
    // [dimension, at-bound value, just-outside value] — the pairs the failure messages name.
    const bounds: readonly [
      keyof KernelScenarioDefinition["stations"][number]["initial"],
      number,
      number
    ][] = [
      ["temperatureC", -100, -100.001],
      ["temperatureC", 70, 70.001],
      ["pressureHpa", 800, 799.999],
      ["pressureHpa", 1100, 1100.001],
      ["pressureTendencyHpaPer3h", -50, -50.001],
      ["pressureTendencyHpaPer3h", 50, 50.001],
      ["relativeHumidityPct", 0, -0.001],
      ["relativeHumidityPct", 100, 100.001],
      ["windDirectionDeg", 0, 360],
      ["windSpeedMps", 0, -0.001],
      ["windSpeedMps", 150, 150.001],
      ["precipitationRateMmh", 0, -0.001],
      ["precipitationRateMmh", 500, 500.001]
    ];
    for (const [dimension, atBound, outside] of bounds) {
      const accepted = malformed({
        stations: frontPassageFixture.stations.map((station, index) =>
          index === 0
            ? { ...station, initial: { ...station.initial, [dimension]: atBound } }
            : station
        )
      });
      expect(() => initializeScenario(accepted), `${dimension}=${atBound}`).not.toThrow();

      const rejected = malformed({
        stations: frontPassageFixture.stations.map((station, index) =>
          index === 0
            ? { ...station, initial: { ...station.initial, [dimension]: outside } }
            : station
        )
      });
      expect(() => initializeScenario(rejected), `${dimension}=${outside}`).toThrow(
        new RegExp(String(dimension).replace(/([A-Z])/g, "\\$1"))
      );
    }
  });

  it("winds direction back into [0, 360) at every state instead of rejecting large authored shifts", () => {
    const wrapped = {
      ...frontPassageFixture,
      stationEffects: frontPassageFixture.stationEffects.map((effect) =>
        effect.stationId === "central"
          ? { ...effect, delta: { ...effect.delta, windDirectionDeg: 360 } }
          : effect
      )
    };
    expect(() => stateAtMinute(wrapped, 120)).not.toThrow();
    // 180° + 360° must wind back to the same compass direction.
    expect(stateAtMinute(wrapped, 120).stations.central?.windDirectionDeg).toBe(180);
  });

  it("rejects NaN and infinity in scenario geometry and observation data", () => {
    expect(() =>
      initializeScenario(malformed({
        stations: frontPassageFixture.stations.map((station, index) =>
          index === 0
            ? { ...station, initial: { ...station.initial, temperatureC: Number.NaN } }
            : station
        )
      }))
    ).toThrow(/temperatureC/);

    expect(() =>
      initializeScenario(malformed({
        boundaries: [
          { ...frontPassageFixture.boundaries[0]!, movement: { x: Number.POSITIVE_INFINITY, y: 0 } }
        ]
      }))
    ).toThrow(/movement.x/);

    expect(() =>
      initializeScenario(malformed({
        precipitationCells: [
          { ...frontPassageFixture.precipitationCells[0]!, intensityDeltaMmhPerStep: Number.NaN }
        ]
      }))
    ).toThrow(/intensityDeltaMmhPerStep/);
  });

  it("fails closed when an authored change carries a station out of physical range mid-simulation", () => {
    // Humidity 70 % + an authored +40 % shift leaves the [0, 100] % range by minute 120.
    // The parse-time validator cannot see this (it only checks initial readings), so the
    // guard must live in the per-step science and reject the state when it is derived.
    const invalidMidScenario = malformed({
      stationEffects: [
        { ...frontPassageFixture.stationEffects[0]!, delta: { relativeHumidityPct: 40 } }
      ]
    });
    expect(() => initializeScenario(invalidMidScenario)).not.toThrow();
    expect(() => stateAtMinute(invalidMidScenario, 90)).not.toThrow();
    expect(() => stateAtMinute(invalidMidScenario, 120)).toThrow(/relativeHumidityPct/);
  });

  it("treats a zero-amplitude noise rule as exactly no noise", () => {
    const zeroNoise = {
      ...frontPassageFixture,
      scenarioId: "front-passage-zero-noise",
      stationEffects: frontPassageFixture.stationEffects.map((effect) => ({
        ...effect,
        noise: { temperatureC: { amplitude: 0, key: "sensor-temp" } }
      }))
    };
    expect(stateAtMinute(zeroNoise, 90).stations.central).toEqual(
      stateAtMinute(frontPassageFixture, 90).stations.central
    );
  });

  it("rejects invalid requested time and advance operations", () => {
    expect(() => parseReplayTrace("{")).toThrow(/not valid JSON/);
    expect(() => parseReplayTrace("[]")).toThrow(/must be an object/);

    const malformedCheckpoint = {
      formatVersion: "1",
      scenarioId: "x",
      schemaVersion: "1",
      contentVersion: "1",
      seed: 1,
      actions: [{ type: "advance", steps: 1 }],
      checkpoints: [
        {
          actionIndex: -1,
          action: null,
          state: {
            scenarioId: "wrong",
            schemaVersion: "1",
            contentVersion: "1",
            seed: 1,
            minute: 0,
            stepIndex: 0
          }
        },
        {
          actionIndex: 0,
          action: { type: "advance", steps: 1 },
          state: {
            scenarioId: "x",
            schemaVersion: "1",
            contentVersion: "1",
            seed: 1,
            minute: 30,
            stepIndex: 1
          }
        }
      ]
    };
    expect(() => parseReplayTrace(JSON.stringify(malformedCheckpoint)))
      .toThrow(/malformed checkpoint/);
  });
});
