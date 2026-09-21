import { describe, expect, it } from "vitest";

import {
  getScenarioOutcomeFacts,
  parseReplayTrace,
  recomputeReplayTrace,
  replayScenario,
  serializeReplayTrace,
  stateAtMinute,
  type AdvanceReplayAction,
  type KernelScenarioDefinition,
} from "@/domain";
import { canonicalFrontPassageScenarios } from "@/scenarios/frontPassageScenarios";
import { toKernelScenario, type WeatherScenarioV1 } from "@/scenarios/schema";

function stepCount(scenario: WeatherScenarioV1): number {
  return scenario.timeline.maxMinute / scenario.timeline.stepMinutes;
}

function oneStepActions(scenario: WeatherScenarioV1): AdvanceReplayAction[] {
  return Array.from({ length: stepCount(scenario) }, () => ({ type: "advance", steps: 1 }));
}

/** Uneven chunking that still lands exactly on the authored maximum minute. */
function chunkedActions(scenario: WeatherScenarioV1): AdvanceReplayAction[] {
  const total = stepCount(scenario);
  const actions: AdvanceReplayAction[] = [];
  let remaining = total;
  let size = 1;
  while (remaining > 0) {
    const steps = Math.min(size, remaining);
    actions.push({ type: "advance", steps });
    remaining -= steps;
    size = size === 1 ? 3 : 1;
  }
  return actions;
}

function declaresNoise(scenario: WeatherScenarioV1): boolean {
  return scenario.stationEffects.some(
    (effect) => effect.noise !== undefined && Object.keys(effect.noise).length > 0,
  );
}

function stationsAt(kernel: KernelScenarioDefinition, minute: number) {
  return stateAtMinute(kernel, minute).stations;
}

describe("WC-04 canonical mission replay conformance", () => {
  it("replays every canonical scenario deterministically to completion", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const steps = stepCount(scenario);
      const trace = replayScenario(kernel, oneStepActions(scenario));

      // Visits every simulation step once, in order, and finishes at the authored maximum.
      expect(trace.checkpoints.map((checkpoint) => checkpoint.state.minute)).toEqual(
        Array.from({ length: steps + 1 }, (_, index) => index * scenario.timeline.stepMinutes),
      );
      expect(trace.checkpoints.at(-1)!.state.progress).toEqual({
        status: "complete",
        completedAtMinute: scenario.timeline.maxMinute,
      });

      // Replayed state at each authored checkpoint equals the canonical snapshot.
      for (const minute of scenario.timeline.checkpoints) {
        const replayed = trace.checkpoints[minute / scenario.timeline.stepMinutes]!.state;
        expect(replayed).toEqual(stateAtMinute(kernel, minute));
      }
    }
  });

  it("reproduces identical traces for identical scenario, seed, and action logs", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const actions = chunkedActions(scenario);
      expect(replayScenario(kernel, actions)).toEqual(replayScenario(kernel, actions));
    }
  });

  it("is invariant to how advance actions are chunked", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const whole = replayScenario(kernel, chunkedActions(scenario));
      const split = replayScenario(kernel, oneStepActions(scenario));
      expect(whole.checkpoints.at(-1)!.state).toEqual(split.checkpoints.at(-1)!.state);
      expect(whole.actions).not.toEqual(split.actions);
    }
  });

  it("round-trips serialization and recomputes authority from the action log", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const trace = replayScenario(kernel, chunkedActions(scenario));
      const parsed = parseReplayTrace(serializeReplayTrace(trace));

      expect(parsed).toEqual(trace);
      expect(recomputeReplayTrace(kernel, parsed)).toEqual(trace);
    }
  });

  it("ignores tampered serialized checkpoints when recomputing authoritative state", () => {
    const scenario = canonicalFrontPassageScenarios[3]!;
    const kernel = toKernelScenario(scenario);
    const trace = replayScenario(kernel, chunkedActions(scenario));
    const tampered = {
      ...parseReplayTrace(serializeReplayTrace(trace)),
      checkpoints: trace.checkpoints.map((checkpoint, index) =>
        index === 2
          ? {
              ...checkpoint,
              state: {
                ...checkpoint.state,
                stations: {
                  ...checkpoint.state.stations,
                  central: { ...checkpoint.state.stations.central!, temperatureC: 99 },
                },
              },
            }
          : checkpoint,
      ),
    };

    const authoritative = recomputeReplayTrace(kernel, tampered);
    expect(authoritative.checkpoints[2]!.state.stations.central!.temperatureC).not.toBe(99);
    expect(authoritative).toEqual(trace);
  });

  it("binds replay identity to contentVersion so superseded science cannot be replayed as current", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const superseded: KernelScenarioDefinition = {
        ...kernel,
        contentVersion: `${scenario.contentVersion.replace(/-2$/, "")}-1`,
      };
      const supersededTrace = replayScenario(superseded, oneStepActions(scenario));

      expect(() => recomputeReplayTrace(kernel, supersededTrace)).toThrow(
        /identity\/version\/seed/,
      );
      expect(supersededTrace.contentVersion).not.toBe(kernel.contentVersion);
    }
  });

  it("keeps outcome facts reproducible from replay state for every canonical scenario", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const trace = replayScenario(kernel, oneStepActions(scenario));
      const finalState = trace.checkpoints.at(-1)!.state;

      expect(getScenarioOutcomeFacts(kernel, finalState)).toEqual(
        getScenarioOutcomeFacts(kernel, stateAtMinute(kernel, scenario.timeline.maxMinute)),
      );
      expect(getScenarioOutcomeFacts(kernel, finalState).stationChanges).toHaveLength(3);
    }
  });

  it("lets the authored seed move only the scenarios that declare observational noise", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const kernel = toKernelScenario(scenario);
      const reseeded: KernelScenarioDefinition = { ...kernel, seed: kernel.seed + 987654 };
      const moved = scenario.timeline.checkpoints.some(
        (minute) =>
          JSON.stringify(stationsAt(kernel, minute)) !== JSON.stringify(stationsAt(reseeded, minute)),
      );

      expect(moved).toBe(declaresNoise(scenario));
    }
  });
});
