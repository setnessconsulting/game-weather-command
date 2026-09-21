import { describe, expect, it } from "vitest";

import {
  DomainScenarioError,
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

  it("rejects state mismatches when deriving outcome facts", () => {
    const state = initializeScenario(frontPassageFixture);
    expect(() =>
      getScenarioOutcomeFacts({ ...frontPassageFixture, seed: 99 }, state)
    ).toThrow(/identity\/version\/seed/);

    const missingStation = {
      ...state,
      stations: { ...state.stations, central: undefined }
    } as unknown as typeof state;
    expect(() => getScenarioOutcomeFacts(frontPassageFixture, missingStation))
      .toThrow(/missing station/);
  });

  it("keeps zero-amplitude deterministic noise exactly zero", () => {
    expect(deterministicSignedNoise(42, "anything", 0)).toBe(0);
  });

  it("rejects malformed replay JSON and checkpoint payloads", () => {
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
