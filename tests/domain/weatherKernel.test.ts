import { describe, expect, it } from "vitest";

import {
  DomainScenarioError,
  advanceScenario,
  getAvailableForecastWindows,
  getScenarioOutcomeFacts,
  initializeScenario,
  parseReplayTrace,
  recomputeReplayTrace,
  replayScenario,
  serializeReplayTrace,
  stateAtMinute
} from "@/domain";
import {
  frontPassageFixture,
  noisyFrontPassageFixture
} from "./weatherKernel.fixture";

describe("weather kernel", () => {
  it("creates the canonical initial snapshot without wall-clock input", () => {
    const state = initializeScenario(frontPassageFixture);
    expect(state.minute).toBe(0);
    expect(state.stepIndex).toBe(0);
    expect(state.stations.central?.temperatureC).toBe(23);
    expect(state.progress).toEqual({ status: "running" });
  });

  it("interpolates authored station effects on explicit simulation steps", () => {
    const halfway = stateAtMinute(frontPassageFixture, 90);
    expect(halfway.stations.central).toEqual({
      temperatureC: 19,
      pressureHpa: 1011,
      pressureTendencyHpaPer3h: 1,
      relativeHumidityPct: 60,
      windDirectionDeg: 225,
      windSpeedMps: 6.5,
      precipitationRateMmh: 3
    });

    const after = stateAtMinute(frontPassageFixture, 120);
    expect(after.stations.central).toEqual({
      temperatureC: 15,
      pressureHpa: 1015,
      pressureTendencyHpaPer3h: 3,
      relativeHumidityPct: 50,
      windDirectionDeg: 270,
      windSpeedMps: 8,
      precipitationRateMmh: 6
    });
  });

  it("moves air masses, boundaries, and precipitation from step count rather than frame time", () => {
    const state = stateAtMinute(frontPassageFixture, 120);
    expect(state.airMasses[0]?.center).toEqual({ x: 0.23, y: 0.5 });
    expect(state.boundaries[0]?.path).toEqual([
      { x: 0.55, y: 0.1 },
      { x: 0.55, y: 0.9 }
    ]);
    expect(state.precipitationCells[0]).toEqual({
      id: "band",
      center: { x: 0.56, y: 0.5 },
      intensityMmh: 6
    });
  });

  it("is invariant to chunking of advance actions", () => {
    const initial = initializeScenario(noisyFrontPassageFixture);
    const twice = advanceScenario(
      noisyFrontPassageFixture,
      advanceScenario(noisyFrontPassageFixture, initial, 1),
      1
    );
    const chunked = advanceScenario(noisyFrontPassageFixture, initial, 2);
    expect(twice).toEqual(chunked);
  });

  it("replays seeded observation noise identically for the same scenario and seed", () => {
    const a = stateAtMinute(noisyFrontPassageFixture, 90);
    const b = stateAtMinute(noisyFrontPassageFixture, 90);
    expect(a).toEqual(b);

    const changedSeed = {
      ...noisyFrontPassageFixture,
      seed: noisyFrontPassageFixture.seed + 1
    };
    const c = stateAtMinute(changedSeed, 90);
    expect(c.stations.central?.temperatureC).not.toBe(a.stations.central?.temperatureC);
  });

  it("exposes forecast windows based only on scenario time", () => {
    expect(
      getAvailableForecastWindows(frontPassageFixture, stateAtMinute(frontPassageFixture, 60))
        .map((window) => window.id)
    ).toEqual(["central-next-90"]);
    expect(
      getAvailableForecastWindows(frontPassageFixture, stateAtMinute(frontPassageFixture, 90))
    ).toEqual([]);
  });

  it("provides raw outcome facts without a hidden correctness flag", () => {
    const facts = getScenarioOutcomeFacts(
      frontPassageFixture,
      stateAtMinute(frontPassageFixture, 120)
    );
    const central = facts.stationChanges.find((fact) => fact.stationId === "central");
    expect(central?.delta.temperatureC).toBe(-8);
    expect(central?.delta.pressureHpa).toBe(8);
    expect(central?.delta.windDirectionDeg).toBe(90);
    expect(facts).not.toHaveProperty("correct");
    expect(facts).not.toHaveProperty("score");
  });


  it("reports wind-direction outcome deltas as shortest signed changes", () => {
    const scenario = {
      ...frontPassageFixture,
      stations: frontPassageFixture.stations.map((station) =>
        station.id === "central"
          ? { ...station, initial: { ...station.initial, windDirectionDeg: 270 } }
          : station
      ),
      stationEffects: frontPassageFixture.stationEffects.map((effect) =>
        effect.stationId === "central"
          ? { ...effect, delta: { ...effect.delta, windDirectionDeg: -90 } }
          : effect
      )
    };
    const facts = getScenarioOutcomeFacts(scenario, stateAtMinute(scenario, 120));
    const central = facts.stationChanges.find((fact) => fact.stationId === "central");
    expect(central?.observed.windDirectionDeg).toBe(180);
    expect(central?.delta.windDirectionDeg).toBe(-90);
  });

  it("rejects state from a different seed even when scenario id/content match", () => {
    const state = initializeScenario(frontPassageFixture);
    const changedSeed = { ...frontPassageFixture, seed: frontPassageFixture.seed + 1 };
    expect(() => advanceScenario(changedSeed, state)).toThrow(/identity\/version\/seed/);
  });

  it("marks completion only at the authored maximum minute and clamps over-advance", () => {
    const initial = initializeScenario(frontPassageFixture);
    const complete = advanceScenario(frontPassageFixture, initial, 99);
    expect(complete.minute).toBe(180);
    expect(complete.progress).toEqual({ status: "complete", completedAtMinute: 180 });
  });
});

describe("scenario validation", () => {
  it("rejects unsupported schema versions", () => {
    const malformed = { ...frontPassageFixture, schemaVersion: "2" } as unknown as typeof frontPassageFixture;
    expect(() => initializeScenario(malformed)).toThrow(DomainScenarioError);
  });

  it("rejects physically invalid initial observations instead of silently clamping them", () => {
    const malformed = {
      ...frontPassageFixture,
      stations: frontPassageFixture.stations.map((station, index) =>
        index === 0
          ? { ...station, initial: { ...station.initial, relativeHumidityPct: 120 } }
          : station
      )
    };
    expect(() => initializeScenario(malformed)).toThrow(/relativeHumidityPct/);
  });

  it("rejects unresolved cross-references", () => {
    const malformed = {
      ...frontPassageFixture,
      stationEffects: [
        { ...frontPassageFixture.stationEffects[0]!, stationId: "missing-station" }
      ]
    };
    expect(() => initializeScenario(malformed)).toThrow(/unknown station/);
  });
});

describe("replay contract", () => {
  it("serializes a deterministic action trace and round-trips its identity", () => {
    const trace = replayScenario(frontPassageFixture, [
      { type: "advance", steps: 1 },
      { type: "advance", steps: 3 },
      { type: "advance", steps: 2 }
    ]);
    expect(trace.checkpoints.map((checkpoint) => checkpoint.state.minute)).toEqual([
      0, 30, 120, 180
    ]);

    const parsed = parseReplayTrace(serializeReplayTrace(trace));
    expect(parsed).toEqual(trace);
    expect(parsed.checkpoints.at(-1)?.state.progress.status).toBe("complete");
  });

  it("recomputes authoritative replay state instead of trusting serialized checkpoints", () => {
    const trace = replayScenario(frontPassageFixture, [{ type: "advance", steps: 2 }]);
    const tampered = {
      ...trace,
      checkpoints: trace.checkpoints.map((checkpoint, index) =>
        index === 1
          ? {
              ...checkpoint,
              state: {
                ...checkpoint.state,
                stations: {
                  ...checkpoint.state.stations,
                  central: { ...checkpoint.state.stations.central!, temperatureC: 69 }
                }
              }
            }
          : checkpoint
      )
    };
    const parsed = parseReplayTrace(JSON.stringify(tampered));
    expect(parsed.checkpoints[1]?.state.stations.central?.temperatureC).toBe(69);

    const authoritative = recomputeReplayTrace(frontPassageFixture, parsed);
    expect(authoritative.checkpoints[1]?.state.stations.central?.temperatureC).not.toBe(69);
    expect(authoritative).toEqual(replayScenario(frontPassageFixture, parsed.actions));
  });

  it("rejects malformed replay versions", () => {
    expect(() => parseReplayTrace('{"formatVersion":"99"}')).toThrow(
      /Unsupported or malformed replay trace/
    );
  });

  it("rejects malformed action payloads and inconsistent checkpoints", () => {
    const trace = replayScenario(frontPassageFixture, [{ type: "advance", steps: 1 }]);
    const malformedAction = {
      ...trace,
      actions: [{ type: "advance", steps: 0 }]
    };
    expect(() => parseReplayTrace(JSON.stringify(malformedAction))).toThrow(
      /Unsupported or malformed replay trace/
    );

    const malformedCheckpoint = {
      ...trace,
      checkpoints: trace.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint, actionIndex: 99 } : checkpoint
      )
    };
    expect(() => parseReplayTrace(JSON.stringify(malformedCheckpoint))).toThrow(
      /action index is inconsistent/
    );
  });
});
