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

describe("kernel determinism boundaries", () => {
  it("produces byte-identical state at the first, last, and over-advanced minutes", () => {
    for (const minute of [0, 180]) {
      expect(stateAtMinute(frontPassageFixture, minute)).toEqual(stateAtMinute(frontPassageFixture, minute));
    }
    const first = advanceScenario(frontPassageFixture, initializeScenario(frontPassageFixture));
    expect(first).toEqual(stateAtMinute(frontPassageFixture, 30));
    const pastEnd = advanceScenario(frontPassageFixture, initializeScenario(frontPassageFixture), 99);
    expect(pastEnd).toEqual(stateAtMinute(frontPassageFixture, 180));
  });

  it("changes nothing in the scenario it reads", () => {
    const before = JSON.stringify(frontPassageFixture);
    initializeScenario(frontPassageFixture);
    stateAtMinute(frontPassageFixture, 90);
    advanceScenario(frontPassageFixture, initializeScenario(frontPassageFixture), 2);
    getScenarioOutcomeFacts(frontPassageFixture, stateAtMinute(frontPassageFixture, 120));
    expect(JSON.stringify(frontPassageFixture)).toBe(before);
  });

  it("returns fresh immutable snapshots whose observation objects are not shared between calls", () => {
    const a = stateAtMinute(frontPassageFixture, 90);
    const b = stateAtMinute(frontPassageFixture, 90);
    expect(a).toEqual(b);
    expect(a.stations.central).not.toBe(b.stations.central);
  });

  it("keeps progress running through the second-to-last step and complete only at the end", () => {
    expect(stateAtMinute(frontPassageFixture, 150).progress).toEqual({ status: "running" });
    expect(stateAtMinute(frontPassageFixture, 180).progress).toEqual({
      status: "complete",
      completedAtMinute: 180
    });
  });

  it("shifts wind-direction deltas to the shortest signed change even across the 180° seam", () => {
    // Initial 175° with a +40° authored shift wraps to 215°; the signed change must read +40°,
    // not -320°, so learner-facing "the wind veered 40°" stays true across the seam.
    const seamScenario = {
      ...frontPassageFixture,
      stations: frontPassageFixture.stations.map((station) =>
        station.id === "central"
          ? { ...station, initial: { ...station.initial, windDirectionDeg: 175 } }
          : station
      ),
      stationEffects: frontPassageFixture.stationEffects.map((effect) =>
        effect.stationId === "central"
          ? { ...effect, delta: { ...effect.delta, windDirectionDeg: 40 } }
          : effect
      )
    };
    const facts = getScenarioOutcomeFacts(seamScenario, stateAtMinute(seamScenario, 120));
    const central = facts.stationChanges.find((fact) => fact.stationId === "central");
    expect(central?.observed.windDirectionDeg).toBe(215);
    expect(central?.delta.windDirectionDeg).toBe(40);
  });

  it("accepts a noise rule only when the effect is active and stays silent before the change starts", () => {
    const noisy = stateAtMinute(noisyFrontPassageFixture, 90);
    const clean = stateAtMinute(frontPassageFixture, 90);
    expect(noisy.stations.central?.temperatureC).not.toBe(clean.stations.central?.temperatureC);

    // At minute 0 progress is 0 for every effect, so no noise may be applied at all.
    expect(stateAtMinute(noisyFrontPassageFixture, 0).stations.central).toEqual(
      stateAtMinute(frontPassageFixture, 0).stations.central
    );
  });

  it("floors precipitation intensity at zero when the authored trend would go negative", () => {
    const fading = {
      ...frontPassageFixture,
      precipitationCells: [
        {
          ...frontPassageFixture.precipitationCells[0]!,
          initialIntensityMmh: 2,
          intensityDeltaMmhPerStep: -1
        }
      ]
    };
    // 2 - 1*stepIndex reaches 0 at step 2 and would be -2 at step 6 without the floor.
    expect(stateAtMinute(fading, 60).precipitationCells[0]?.intensityMmh).toBe(0);
    expect(stateAtMinute(fading, 180).precipitationCells[0]?.intensityMmh).toBe(0);
  });

  it("rejects non-finite, fractional, negative, and out-of-range minutes before touching the science", () => {
    expect(() => stateAtMinute(frontPassageFixture, Number.NaN)).toThrow(DomainScenarioError);
    expect(() => stateAtMinute(frontPassageFixture, Number.POSITIVE_INFINITY)).toThrow(DomainScenarioError);
    expect(() => stateAtMinute(frontPassageFixture, 45)).toThrow(DomainScenarioError);
    expect(() => stateAtMinute(frontPassageFixture, -30)).toThrow(DomainScenarioError);
    expect(() => stateAtMinute(frontPassageFixture, 210)).toThrow(DomainScenarioError);
  });

  it("reports forecast windows inclusively at start and exclusively at the end", () => {
    const window = frontPassageFixture.forecastWindows[0]!;
    const justBefore = stateAtMinute(frontPassageFixture, window.startMinute);
    expect(getAvailableForecastWindows(frontPassageFixture, justBefore).map((w) => w.id)).toEqual([window.id]);
    const atEnd = stateAtMinute(frontPassageFixture, window.endMinute);
    expect(getAvailableForecastWindows(frontPassageFixture, atEnd)).toEqual([]);
  });

  it("rejects advancing a state that belongs to a different contentVersion", () => {
    const state = initializeScenario(frontPassageFixture);
    const superseded = { ...frontPassageFixture, contentVersion: "test-0" };
    expect(() => advanceScenario(superseded, state)).toThrow(/identity\/version\/seed/);
  });

  it("moves geometric features by step count, not by minutes elapsed", () => {
    // The front starts at x = 0.35 and moves 0.05 per step, so minute 60 (step 2) is x = 0.45
    // exactly - geometry is a function of the step index, never of elapsed wall time.
    const state = stateAtMinute(frontPassageFixture, 60);
    expect(state.minute).toBe(60);
    expect(state.stepIndex).toBe(2);
    expect(state.boundaries[0]?.path).toEqual([
      { x: 0.45, y: 0.1 },
      { x: 0.45, y: 0.9 }
    ]);
    expect(state.airMasses[0]?.center).toEqual({ x: 0.19, y: 0.5 });
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

  it("rejects an empty action log before simulating anything", () => {
    expect(() => replayScenario(frontPassageFixture, [{ type: "advance", steps: 0 }])).toThrow(
      /Unsupported or malformed replay action/
    );
  });

  it("replays the empty action log to the initial checkpoint", () => {
    const trace = replayScenario(frontPassageFixture, []);
    expect(trace.actions).toEqual([]);
    expect(trace.checkpoints).toHaveLength(1);
    expect(trace.checkpoints[0]?.state.minute).toBe(0);
    expect(trace.checkpoints[0]?.action).toBeNull();
  });

  it("round-trips a trace whose actions no longer match its stored checkpoints", () => {
    const trace = replayScenario(frontPassageFixture, [
      { type: "advance", steps: 1 },
      { type: "advance", steps: 2 }
    ]);
    const tampered = {
      ...trace,
      checkpoints: trace.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint, action: { type: "advance", steps: 5 } } : checkpoint
      )
    };
    expect(() => parseReplayTrace(JSON.stringify(tampered))).toThrow(
      /does not match the action log/
    );
  });

  it("rejects a first checkpoint that smuggles an action and a non-object checkpoint state", () => {
    const trace = replayScenario(frontPassageFixture, [{ type: "advance", steps: 1 }]);
    const smuggled = {
      ...trace,
      checkpoints: trace.checkpoints.map((checkpoint, index) =>
        index === 0 ? { ...checkpoint, action: { type: "advance", steps: 1 } } : checkpoint
      )
    };
    expect(() => parseReplayTrace(JSON.stringify(smuggled))).toThrow(
      /Initial replay checkpoint must not contain an action/
    );

    const nullState = {
      ...trace,
      checkpoints: trace.checkpoints.map((checkpoint, index) =>
        index === 1 ? { ...checkpoint, state: null } : checkpoint
      )
    };
    expect(() => parseReplayTrace(JSON.stringify(nullState))).toThrow(/malformed checkpoint/);
  });

  it("rejects a checkpoint count that disagrees with the action log", () => {
    const trace = replayScenario(frontPassageFixture, [{ type: "advance", steps: 1 }]);
    const short = { ...trace, checkpoints: trace.checkpoints.slice(0, 1) };
    expect(() => parseReplayTrace(JSON.stringify(short))).toThrow(
      /Unsupported or malformed replay trace/
    );
  });

  it("rejects recomputing a trace that belongs to a different scenario", () => {
    const trace = replayScenario(frontPassageFixture, [{ type: "advance", steps: 1 }]);
    const foreign = { ...frontPassageFixture, scenarioId: "another-scenario" };
    expect(() => recomputeReplayTrace(foreign, trace)).toThrow(/identity\/version\/seed/);
  });
});
