import type { ForecastWindow } from "@/domain";
import { parseWeatherScenario, toKernelScenario, type WeatherScenarioV1 } from "@/scenarios";
import type { KernelScenarioDefinition } from "@/domain";

import {
  EMPTY_FORECAST_DRAFT,
  RECOMMENDATION_OPTIONS,
  validateForecastDraft,
  type ConfidenceLevel,
  type ForecastDraft,
  type NumericRangeValue,
  type RecommendationOption
} from "./forecast";
import {
  formatSimulatedTimestamp,
  formatMinuteRange
} from "./units";
import { verifyForecast, type VerificationReport } from "./verification";

export type SessionPhase = "briefing" | "observing" | "awaiting-outcome" | "verified" | "debrief";
export type AssistanceLevel = "guided" | "reduced" | "off";
export type RangeField = "temperatureChangeC" | "precipitationProbabilityPct" | "windDirectionDeg" | "transitionWindow";

export interface ForecastAttempt {
  readonly attemptIndex: number;
  readonly committedAtMinute: number;
  readonly forecast: ForecastDraft;
  readonly selectedEvidenceIds: readonly string[];
  /** Populated only by the verify action; never before. */
  readonly verification?: VerificationReport;
}

export interface SessionStatus {
  readonly message: string;
  readonly tone: "info" | "attention" | "success";
}

export interface ForecastSessionState {
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly phase: SessionPhase;
  readonly minute: number;
  readonly selectedStationId: string;
  readonly inspectedStationIds: readonly string[];
  readonly openedEvidenceIds: readonly string[];
  readonly selectedEvidenceIds: readonly string[];
  readonly forecast: ForecastDraft;
  readonly attempts: readonly ForecastAttempt[];
  readonly activeAttemptIndex: number | null;
  readonly assistance: AssistanceLevel;
  readonly hintsUsed: Readonly<Record<string, number>>;
  readonly status: SessionStatus | undefined;
}

export type SessionAction =
  | { readonly type: "start" }
  | { readonly type: "advance"; readonly steps: number }
  | { readonly type: "setMinute"; readonly minute: number }
  | { readonly type: "selectStation"; readonly stationId: string }
  | { readonly type: "openEvidence"; readonly evidenceId: string }
  | { readonly type: "toggleEvidence"; readonly evidenceId: string }
  | { readonly type: "setRange"; readonly field: RangeField; readonly range: NumericRangeValue | null }
  | { readonly type: "setConfidence"; readonly confidence: ConfidenceLevel }
  | { readonly type: "setRecommendation"; readonly recommendationId: string }
  | { readonly type: "useHint"; readonly stepId: string }
  | { readonly type: "setAssistance"; readonly assistance: AssistanceLevel }
  | { readonly type: "commit" }
  | { readonly type: "revise" }
  | { readonly type: "verify" }
  | { readonly type: "finish" }
  | { readonly type: "reset" };

export interface SessionMachine {
  readonly scenario: WeatherScenarioV1;
  readonly kernel: KernelScenarioDefinition;
  readonly window: ForecastWindow;
  readonly targetStationId: string;
  readonly targetStationName: string;
  /** Publicly known: the published forecast window closes here, and comparison unlocks here. */
  readonly verificationMinute: number;
  readonly initialState: ForecastSessionState;
  reduce(state: ForecastSessionState, action: SessionAction): ForecastSessionState;
}

const clampMinute = (kernel: KernelScenarioDefinition, minute: number): number => {
  const clamped = Math.max(kernel.timeline.startMinute, Math.min(minute, kernel.timeline.maxMinute));
  return Math.round(clamped / kernel.timeline.stepMinutes) * kernel.timeline.stepMinutes;
};

/**
 * Builds a session machine for a canonical scenario.
 *
 * The reducer is pure and every input is serializable, so a session can be replayed from its
 * action log and must reach the identical state and identical verification report.
 * Scientific truth is read from the kernel on demand and is never stored in session state;
 * dashboard copies of observations therefore cannot become authority.
 */
export function createSessionMachine(scenarioInput: unknown): SessionMachine {
  const scenario = parseWeatherScenario(scenarioInput);
  const kernel = toKernelScenario(scenario);
  const window = scenario.forecastWindows[0]!;
  const targetStationId = window.targetStationIds[0]!;
  const targetStation = scenario.stations.find((station) => station.id === targetStationId)!;

  const initialState: ForecastSessionState = {
    scenarioId: scenario.scenarioId,
    contentVersion: scenario.contentVersion,
    phase: "briefing",
    minute: kernel.timeline.startMinute,
    selectedStationId: targetStationId,
    inspectedStationIds: [],
    openedEvidenceIds: [],
    selectedEvidenceIds: [],
    forecast: EMPTY_FORECAST_DRAFT,
    attempts: [],
    activeAttemptIndex: null,
    assistance: scenario.missionType === "guided-cold-front" ? "guided" : "reduced",
    hintsUsed: {},
    status: undefined
  };

  const verificationMinute = Math.min(kernel.timeline.maxMinute, window.endMinute);

  const reduce = (state: ForecastSessionState, action: SessionAction): ForecastSessionState => {
    switch (action.type) {
      case "start":
        return {
          ...state,
          phase: "observing",
          status: {
            message: `Observation began at ${formatSimulatedTimestamp(state.minute)}. Collect evidence before committing a forecast.`,
            tone: "info"
          }
        };

      case "advance": {
        if (!Number.isSafeInteger(action.steps) || action.steps <= 0) return state;
        const next = clampMinute(kernel, state.minute + kernel.timeline.stepMinutes * action.steps);
        if (next === state.minute) {
          return {
            ...state,
            status: { message: "The scenario has reached its final simulated step.", tone: "attention" }
          };
        }
        return {
          ...state,
          minute: next,
          status: {
            message:
              `Simulated time is now ${formatSimulatedTimestamp(next)}.` +
              (state.phase === "awaiting-outcome" && next >= verificationMinute
                ? " The published forecast window has closed, so you can compare the forecast with the record."
                : state.phase === "observing" && next >= window.endMinute
                  ? " The published forecast window has closed. Anything recorded from now is a hindcast, not a forecast."
                  : "")
            ,
            tone: "info"
          }
        };
      }

      case "setMinute": {
        const next = clampMinute(kernel, action.minute);
        return { ...state, minute: next };
      }

      case "selectStation": {
        if (!scenario.stations.some((station) => station.id === action.stationId)) return state;
        const inspected = state.inspectedStationIds.includes(action.stationId)
          ? state.inspectedStationIds
          : [...state.inspectedStationIds, action.stationId];
        return { ...state, selectedStationId: action.stationId, inspectedStationIds: inspected };
      }

      case "openEvidence": {
        if (state.openedEvidenceIds.includes(action.evidenceId)) return state;
        return { ...state, openedEvidenceIds: [...state.openedEvidenceIds, action.evidenceId] };
      }

      case "toggleEvidence": {
        const evidence = scenario.evidence.find((item) => item.id === action.evidenceId);
        if (!evidence || evidence.availableAtMinute > state.minute) return state;
        const selected = state.selectedEvidenceIds.includes(action.evidenceId);
        return {
          ...state,
          selectedEvidenceIds: selected
            ? state.selectedEvidenceIds.filter((id) => id !== action.evidenceId)
            : [...state.selectedEvidenceIds, action.evidenceId],
          status: selected
            ? { message: "Evidence detached from the forecast reasoning.", tone: "info" }
            : { message: "Evidence attached to the forecast reasoning.", tone: "info" }
        };
      }

      case "setRange":
        return { ...state, forecast: { ...state.forecast, [action.field]: action.range } };

      case "setConfidence":
        return { ...state, forecast: { ...state.forecast, confidence: action.confidence } };

      case "setRecommendation":
        return { ...state, forecast: { ...state.forecast, recommendationId: action.recommendationId } };

      case "useHint":
        return {
          ...state,
          hintsUsed: { ...state.hintsUsed, [action.stepId]: (state.hintsUsed[action.stepId] ?? 0) + 1 }
        };

      case "setAssistance":
        return { ...state, assistance: action.assistance };

      case "commit": {
        if (state.phase !== "observing") return state;
        const validation = validateForecastDraft(state.forecast, scenario, window);
        if (!validation.ok) {
          return {
            ...state,
            status: {
              message: validation.issues.find((issue) => issue.severity === "blocking")!.message,
              tone: "attention"
            }
          };
        }
        const attempt: ForecastAttempt = {
          attemptIndex: state.attempts.length,
          committedAtMinute: state.minute,
          forecast: state.forecast,
          selectedEvidenceIds: [...state.selectedEvidenceIds]
        };
        const hindcast = state.minute >= window.endMinute;
        return {
          ...state,
          phase: "awaiting-outcome",
          attempts: [...state.attempts, attempt],
          activeAttemptIndex: attempt.attemptIndex,
          status: {
            message: hindcast
              ? `Recorded at ${formatSimulatedTimestamp(state.minute)} as a hindcast: the published window closed at ${formatSimulatedTimestamp(
                  window.endMinute
                )}, so the outcome may already be visible.`
              : `Forecast committed at ${formatSimulatedTimestamp(
                  state.minute
                )}. Advance the clock to ${formatSimulatedTimestamp(
                  verificationMinute
                )} to compare it with the record.`,
            tone: hindcast ? "attention" : "success"
          }
        };
      }

      case "revise": {
        const previous = state.activeAttemptIndex !== null ? state.attempts[state.activeAttemptIndex] : undefined;
        return {
          ...state,
          phase: "observing",
          activeAttemptIndex: null,
          forecast: previous ? previous.forecast : state.forecast,
          status: {
            message: previous
              ? `Revision ${state.attempts.length + 1} started from your last committed forecast. Changing it is not a penalty; it is the job.`
              : "Revision started.",
            tone: "info"
          }
        };
      }

      case "verify": {
        if (state.activeAttemptIndex === null) {
          return {
            ...state,
            status: { message: "Commit a forecast before comparing it with the record.", tone: "attention" }
          };
        }
        if (state.minute < verificationMinute) {
          return {
            ...state,
            status: {
              message: `Advance the simulated clock to ${formatSimulatedTimestamp(
                verificationMinute
              )} (the close of ${formatMinuteRange(window.startMinute, window.endMinute)}) before comparing.`,
              tone: "attention"
            }
          };
        }
        const attempt = state.attempts[state.activeAttemptIndex]!;
        const report = verifyForecast({
          scenario,
          kernel,
          window,
          stationId: targetStationId,
          forecast: attempt.forecast,
          selectedEvidenceIds: attempt.selectedEvidenceIds,
          committedAtMinute: attempt.committedAtMinute,
          verificationMinute: state.minute
        });
        return {
          ...state,
          phase: "verified",
          attempts: state.attempts.map((candidate, index) =>
            index === state.activeAttemptIndex ? { ...candidate, verification: report } : candidate
          ),
          status: { message: report.headline, tone: "success" }
        };
      }

      case "finish": {
        if (state.activeAttemptIndex === null) return state;
        return {
          ...state,
          phase: "debrief",
          status: { message: "Debrief open. Review the evidence behind the outcome.", tone: "info" }
        };
      }

      case "reset":
        return initialState;

      default:
        return state;
    }
  };

  return {
    scenario,
    kernel,
    window,
    targetStationId,
    targetStationName: targetStation.name,
    verificationMinute,
    initialState,
    reduce
  };
}

export interface SessionSnapshot {
  readonly state: ForecastSessionState;
  readonly activeAttempt: ForecastAttempt | undefined;
  readonly latestVerification: VerificationReport | undefined;
}

export function sessionSnapshot(state: ForecastSessionState): SessionSnapshot {
  const activeAttempt =
    state.activeAttemptIndex !== null ? state.attempts[state.activeAttemptIndex] : undefined;
  const latestVerification = [...state.attempts].reverse().find((attempt) => attempt.verification)?.verification;
  return { state, activeAttempt, latestVerification };
}

export function sessionValidation(state: ForecastSessionState, machine: SessionMachine) {
  return validateForecastDraft(state.forecast, machine.scenario, machine.window);
}

export function recommendationOptionsFor(machine: SessionMachine): readonly RecommendationOption[] {
  return RECOMMENDATION_OPTIONS[machine.scenario.missionType];
}

/** Replays an action log against a scenario and must reproduce the identical final state. */
export function replaySession(scenario: WeatherScenarioV1, actions: readonly SessionAction[]): ForecastSessionState {
  const machine = createSessionMachine(scenario);
  return actions.reduce((state, action) => machine.reduce(state, action), machine.initialState);
}
