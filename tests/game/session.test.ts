import { describe, expect, it } from "vitest";

import { canonicalFrontPassageScenarios, parseWeatherScenario, type WeatherScenarioV1 } from "@/scenarios";
import {
  createSessionMachine,
  replaySession,
  sessionSnapshot,
  sessionValidation,
  type ForecastDraft,
  type ForecastSessionState,
  type SessionAction
} from "@/game";

const guided = canonicalFrontPassageScenarios[0]!;
const machine = createSessionMachine(guided);
const accepted = guided.acceptedRanges[0]!;

const draft: ForecastDraft = {
  temperatureChangeC: accepted.temperatureChangeC,
  precipitationProbabilityPct: accepted.precipitationProbabilityPct,
  windDirectionDeg: accepted.windDirectionSectorsDeg[0]!,
  transitionWindow: accepted.transitionArrivalMinute,
  confidence: "medium",
  recommendationId: "cool-sharp"
};

function observeEverything(): SessionAction[] {
  return [
    { type: "start" },
    { type: "selectStation", stationId: "west" },
    { type: "selectStation", stationId: "central" },
    { type: "selectStation", stationId: "east" },
    { type: "advance", steps: 2 },
    ...guided.evidence.flatMap((evidence): SessionAction[] => [
      { type: "openEvidence", evidenceId: evidence.id },
      { type: "toggleEvidence", evidenceId: evidence.id }
    ])
  ];
}

function fillForecast(): SessionAction[] {
  return [
    { type: "setRange", field: "temperatureChangeC", range: draft.temperatureChangeC! },
    { type: "setRange", field: "precipitationProbabilityPct", range: draft.precipitationProbabilityPct! },
    { type: "setRange", field: "windDirectionDeg", range: draft.windDirectionDeg! },
    { type: "setRange", field: "transitionWindow", range: draft.transitionWindow! },
    { type: "setConfidence", confidence: draft.confidence! },
    { type: "setRecommendation", recommendationId: draft.recommendationId! }
  ];
}

const run = (actions: readonly SessionAction[]): ForecastSessionState =>
  actions.reduce((state, action) => machine.reduce(state, action), machine.initialState);

describe("session lifecycle", () => {
  it("walks briefing to debrief through the complete evidence and forecast loop", () => {
    let state = run([...observeEverything(), ...fillForecast()]);
    expect(state.phase).toBe("observing");
    expect(state.minute).toBe(60);
    expect(state.inspectedStationIds).toEqual(["west", "central", "east"]);
    expect(state.selectedEvidenceIds).toHaveLength(guided.evidence.length);

    state = machine.reduce(state, { type: "commit" });
    expect(state.phase).toBe("awaiting-outcome");
    expect(state.attempts).toHaveLength(1);
    expect(state.status?.tone).toBe("success");
    // A committed forecast must not carry its own answer before the comparison.
    expect(state.attempts[0]!.verification).toBeUndefined();
    expect(JSON.stringify(state)).not.toContain("acceptedRange");

    state = machine.reduce(state, { type: "verify" });
    expect(state.phase).toBe("awaiting-outcome");
    expect(state.status?.tone).toBe("attention");
    expect(state.attempts[0]!.verification).toBeUndefined();

    state = machine.reduce(state, { type: "setMinute", minute: machine.verificationMinute });
    state = machine.reduce(state, { type: "verify" });
    expect(state.phase).toBe("verified");
    const report = state.attempts[0]!.verification!;
    expect(report.mode).toBe("forecast");
    expect(report.stationName).toBe("Central Station");
    expect(report.timing.level).toBe("supported");

    state = machine.reduce(state, { type: "finish" });
    expect(state.phase).toBe("debrief");
    expect(state.status?.message).toContain("Debrief open");
  });

  it("blocks a commit that is missing fields and says what is missing", () => {
    const state = machine.reduce(run([{ type: "start" }]), { type: "commit" });
    expect(state.phase).toBe("observing");
    expect(state.attempts).toHaveLength(0);
    expect(state.status?.tone).toBe("attention");
    expect(state.status?.message).toContain("temperature");
  });

  it("records a late commit as a hindcast without dead-ending the mission", () => {
    let state = run([{ type: "start" }, ...fillForecast()]);
    state = machine.reduce(state, { type: "setMinute", minute: 180 });
    state = machine.reduce(state, { type: "commit" });
    expect(state.phase).toBe("awaiting-outcome");
    expect(state.status?.tone).toBe("attention");
    expect(state.status?.message).toContain("hindcast");
  });

  it("keeps revising non-punitive: the draft carries over and earlier attempts are kept", () => {
    let state = verifyOnce();
    const before = state.attempts.length;
    state = machine.reduce(state, { type: "revise" });
    expect(state.phase).toBe("observing");
    expect(state.attempts).toHaveLength(before);
    expect(state.forecast.temperatureChangeC).toEqual(draft.temperatureChangeC);
    expect(state.status?.message).toContain("not a penalty");
  });
});

function verifyOnce(): ForecastSessionState {
  let state = run([...observeEverything(), ...fillForecast(), { type: "commit" }]);
  state = machine.reduce(state, { type: "setMinute", minute: machine.verificationMinute });
  return machine.reduce(state, { type: "verify" });
}

describe("session input handling", () => {
  it("ignores locked evidence and unknown identifiers", () => {
    let state = run([{ type: "start" }]);
    const locked = guided.evidence.find((evidence) => evidence.availableAtMinute > 0)!;
    state = machine.reduce(state, { type: "toggleEvidence", evidenceId: locked.id });
    state = machine.reduce(state, { type: "toggleEvidence", evidenceId: "not-real" });
    state = machine.reduce(state, { type: "selectStation", stationId: "not-real" });
    expect(state.selectedEvidenceIds).toEqual([]);
    expect(state.inspectedStationIds).toEqual([]);
    expect(state.selectedStationId).toBe(machine.targetStationId);
  });

  it("detaches evidence and reports it", () => {
    let state = run([{ type: "start" }, { type: "openEvidence", evidenceId: "guided-stations-initial" }]);
    state = machine.reduce(state, { type: "toggleEvidence", evidenceId: "guided-stations-initial" });
    expect(state.selectedEvidenceIds).toEqual(["guided-stations-initial"]);
    state = machine.reduce(state, { type: "toggleEvidence", evidenceId: "guided-stations-initial" });
    expect(state.selectedEvidenceIds).toEqual([]);
    expect(state.status?.message).toContain("detached");
  });

  it("snaps the time cursor onto simulation steps and clamps to the scenario end", () => {
    let state = run([{ type: "start" }]);
    state = machine.reduce(state, { type: "setMinute", minute: 40 });
    expect(state.minute).toBe(30);
    state = machine.reduce(state, { type: "setMinute", minute: 99_999 });
    expect(state.minute).toBe(guided.timeline.maxMinute);

    const clamped = machine.reduce(state, { type: "advance", steps: 1 });
    expect(clamped.minute).toBe(guided.timeline.maxMinute);
    expect(clamped.status?.message).toContain("final simulated step");

    const rejected = machine.reduce(state, { type: "advance", steps: 0 });
    expect(rejected).toBe(state);
  });

  it("tracks assistance and hint usage, defaulting guided only for the coached mission", () => {
    const independent = canonicalFrontPassageScenarios[1]!;
    expect(createSessionMachine(independent).initialState.assistance).toBe("reduced");
    expect(machine.initialState.assistance).toBe("guided");

    let state = run([{ type: "start" }, { type: "useHint", stepId: "read-station-report" }]);
    expect(state.hintsUsed["read-station-report"]).toBe(1);
    state = machine.reduce(state, { type: "setAssistance", assistance: "off" });
    expect(state.assistance).toBe("off");
  });

  it("resets to a clean briefing", () => {
    const state = machine.reduce(verifyOnce(), { type: "reset" });
    expect(state).toEqual(machine.initialState);
  });

  it("exposes validation and a snapshot without leaking the answer", () => {
    const state = run([{ type: "start" }]);
    expect(sessionValidation(state, machine).ok).toBe(false);
    const snapshot = sessionSnapshot(state);
    expect(snapshot.activeAttempt).toBeUndefined();
    expect(snapshot.latestVerification).toBeUndefined();

    const verified = sessionSnapshot(verifyOnce());
    expect(verified.latestVerification?.timing.level).toBe("supported");
  });
});

describe("session replay", () => {
  it("reproduces the identical state, including the verification report", () => {
    const actions: SessionAction[] = [
      ...observeEverything(),
      ...fillForecast(),
      { type: "commit" },
      { type: "setMinute", minute: machine.verificationMinute },
      { type: "verify" },
      { type: "finish" }
    ];
    const live = actions.reduce((state, action) => machine.reduce(state, action), machine.initialState);
    const replayed = replaySession(guided, actions);
    expect(replayed).toEqual(live);
    expect(replaySession(guided, actions)).toEqual(replayed);
  });

  it("reproduces the same verification result for a revised attempt", () => {
    const revisable: SessionAction[] = [
      ...observeEverything(),
      ...fillForecast(),
      { type: "commit" },
      { type: "setMinute", minute: machine.verificationMinute },
      { type: "verify" },
      { type: "revise" },
      { type: "setRange", field: "transitionWindow", range: { min: 30, max: 60 } },
      { type: "commit" },
      { type: "verify" }
    ];
    const live = revisable.reduce((state, action) => machine.reduce(state, action), machine.initialState);
    expect(live.attempts).toHaveLength(2);
    expect(live.attempts[0]!.verification?.timing.level).toBe("supported");
    // The revision misses the observed window by exactly one simulation step, which is a
    // near miss rather than a wrong answer, and the report must say so.
    expect(live.attempts[1]!.verification?.timing.level).toBe("partially-supported");
    expect(replaySession(guided, revisable)).toEqual(live);
  });

  it("rejects an unparsable scenario instead of building a machine", () => {
    expect(() => createSessionMachine({ scenarioId: "nope" })).toThrow();
    expect(() => parseWeatherScenario({ scenarioId: "nope" })).toThrow();
  });

  it("builds a machine for every canonical scenario", () => {
    for (const scenario of canonicalFrontPassageScenarios as readonly WeatherScenarioV1[]) {
      const built = createSessionMachine(scenario);
      expect(built.initialState.phase).toBe("briefing");
      expect(built.verificationMinute).toBeLessThanOrEqual(scenario.timeline.maxMinute);
      expect(built.window.endMinute).toBeLessThanOrEqual(scenario.timeline.maxMinute);
    }
  });
});
