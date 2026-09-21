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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isReplayAction(value: unknown): value is ReplayAction {
  if (!isRecord(value)) return false;
  return (
    value.type === "advance" &&
    Number.isSafeInteger(value.steps) &&
    typeof value.steps === "number" &&
    value.steps > 0
  );
}

function isScenarioStateIdentity(
  value: unknown,
  trace: Pick<ReplayTrace, "scenarioId" | "schemaVersion" | "contentVersion" | "seed">
): value is ScenarioState {
  if (!isRecord(value)) return false;
  return (
    value.scenarioId === trace.scenarioId &&
    value.schemaVersion === trace.schemaVersion &&
    value.contentVersion === trace.contentVersion &&
    value.seed === trace.seed &&
    typeof value.minute === "number" &&
    Number.isSafeInteger(value.minute) &&
    value.minute >= 0 &&
    typeof value.stepIndex === "number" &&
    Number.isSafeInteger(value.stepIndex) &&
    value.stepIndex >= 0
  );
}

export function replayScenario(
  scenario: KernelScenarioDefinition,
  actions: readonly ReplayAction[]
): ReplayTrace {
  let state = initializeScenario(scenario);
  const checkpoints: ReplayCheckpoint[] = [{ actionIndex: -1, action: null, state }];

  actions.forEach((action, actionIndex) => {
    if (!isReplayAction(action)) {
      throw new DomainScenarioError("Unsupported or malformed replay action.");
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

/**
 * Parses transport/storage shape only. Parsed checkpoints are not scientific authority;
 * consumers that need authoritative state must call recomputeReplayTrace.
 */
export function parseReplayTrace(serialized: string): ReplayTrace {
  let candidate: unknown;
  try {
    candidate = JSON.parse(serialized);
  } catch {
    throw new DomainScenarioError("Replay trace is not valid JSON.");
  }

  if (!isRecord(candidate)) {
    throw new DomainScenarioError("Replay trace must be an object.");
  }

  const identity = {
    scenarioId: candidate.scenarioId,
    schemaVersion: candidate.schemaVersion,
    contentVersion: candidate.contentVersion,
    seed: candidate.seed
  };

  if (
    candidate.formatVersion !== "1" ||
    identity.schemaVersion !== "1" ||
    typeof identity.scenarioId !== "string" ||
    !identity.scenarioId ||
    typeof identity.contentVersion !== "string" ||
    !identity.contentVersion ||
    !Number.isSafeInteger(identity.seed) ||
    !Array.isArray(candidate.actions) ||
    !candidate.actions.every(isReplayAction) ||
    !Array.isArray(candidate.checkpoints) ||
    candidate.checkpoints.length !== candidate.actions.length + 1
  ) {
    throw new DomainScenarioError("Unsupported or malformed replay trace.");
  }

  const typedIdentity = identity as Pick<
    ReplayTrace,
    "scenarioId" | "schemaVersion" | "contentVersion" | "seed"
  >;

  for (let index = 0; index < candidate.checkpoints.length; index += 1) {
    const checkpoint = candidate.checkpoints[index];
    if (!isRecord(checkpoint) || !isScenarioStateIdentity(checkpoint.state, typedIdentity)) {
      throw new DomainScenarioError("Replay trace contains a malformed checkpoint.");
    }
    const expectedActionIndex = index - 1;
    if (checkpoint.actionIndex !== expectedActionIndex) {
      throw new DomainScenarioError("Replay checkpoint action index is inconsistent.");
    }
    if (index === 0) {
      if (checkpoint.action !== null) {
        throw new DomainScenarioError("Initial replay checkpoint must not contain an action.");
      }
    } else if (
      !isReplayAction(checkpoint.action) ||
      JSON.stringify(checkpoint.action) !== JSON.stringify(candidate.actions[index - 1])
    ) {
      throw new DomainScenarioError("Replay checkpoint action does not match the action log.");
    }
  }

  return candidate as unknown as ReplayTrace;
}


/**
 * Recomputes authoritative checkpoints from the canonical scenario and parsed action log.
 * Serialized checkpoint payloads are deliberately ignored.
 */
export function recomputeReplayTrace(
  scenario: KernelScenarioDefinition,
  trace: ReplayTrace
): ReplayTrace {
  if (
    trace.scenarioId !== scenario.scenarioId ||
    trace.schemaVersion !== scenario.schemaVersion ||
    trace.contentVersion !== scenario.contentVersion ||
    trace.seed !== scenario.seed
  ) {
    throw new DomainScenarioError(
      "Replay trace does not belong to the supplied scenario identity/version/seed."
    );
  }
  return replayScenario(scenario, trace.actions);
}
