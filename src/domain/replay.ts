import { advanceScenario, initializeScenario } from "./weatherKernel";
import { DomainScenarioError } from "./weatherValidation";
import type { KernelScenarioDefinition, ScenarioState } from "./weatherTypes";

export interface AdvanceReplayAction {
  readonly type: "advance";
  readonly steps: number;
}

export type ReplayAction = AdvanceReplayAction;

export interface ReplayCheckpoint {
  readonly actionIndex: number;
  readonly action: ReplayAction | null;
  readonly state: ScenarioState;
}

export interface ReplayTrace {
  readonly formatVersion: "1";
  readonly scenarioId: string;
  readonly schemaVersion: "1";
  readonly contentVersion: string;
  readonly seed: number;
  readonly actions: readonly ReplayAction[];
  readonly checkpoints: readonly ReplayCheckpoint[];
}

export function replayScenario(
  scenario: KernelScenarioDefinition,
  actions: readonly ReplayAction[]
): ReplayTrace {
  let state = initializeScenario(scenario);
  const checkpoints: ReplayCheckpoint[] = [{ actionIndex: -1, action: null, state }];

  actions.forEach((action, actionIndex) => {
    if (action.type !== "advance") {
      throw new DomainScenarioError("Unsupported replay action.");
    }
    state = advanceScenario(scenario, state, action.steps);
    checkpoints.push({ actionIndex, action, state });
  });

  return {
    formatVersion: "1",
    scenarioId: scenario.scenarioId,
    schemaVersion: scenario.schemaVersion,
    contentVersion: scenario.contentVersion,
    seed: scenario.seed,
    actions: [...actions],
    checkpoints
  };
}

export function serializeReplayTrace(trace: ReplayTrace): string {
  return JSON.stringify(trace);
}

export function parseReplayTrace(serialized: string): ReplayTrace {
  const candidate: unknown = JSON.parse(serialized);
  if (!candidate || typeof candidate !== "object") {
    throw new DomainScenarioError("Replay trace must be an object.");
  }

  const trace = candidate as Partial<ReplayTrace>;
  if (
    trace.formatVersion !== "1" ||
    trace.schemaVersion !== "1" ||
    typeof trace.scenarioId !== "string" ||
    typeof trace.contentVersion !== "string" ||
    !Number.isSafeInteger(trace.seed) ||
    !Array.isArray(trace.actions) ||
    !Array.isArray(trace.checkpoints)
  ) {
    throw new DomainScenarioError("Unsupported or malformed replay trace.");
  }
  return trace as ReplayTrace;
}
