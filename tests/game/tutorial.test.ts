import { describe, expect, it } from "vitest";

import { canonicalFrontPassageScenarios } from "@/scenarios";
import {
  buildGuidedTutorial,
  coachingComplete,
  contextualHint,
  createSessionMachine,
  currentTutorialStep,
  tutorialProgress,
  visibleHints,
  type ForecastSessionState,
  type SessionAction
} from "@/game";

const guided = canonicalFrontPassageScenarios[0]!;
const machine = createSessionMachine(guided);
const accepted = guided.acceptedRanges[0]!;

const run = (actions: readonly SessionAction[]): ForecastSessionState =>
  actions.reduce((state, action) => machine.reduce(state, action), machine.initialState);

const completeForecast = (): SessionAction[] => [
  { type: "setRange", field: "temperatureChangeC", range: accepted.temperatureChangeC },
  { type: "setRange", field: "precipitationProbabilityPct", range: accepted.precipitationProbabilityPct },
  { type: "setRange", field: "windDirectionDeg", range: accepted.windDirectionSectorsDeg[0]! },
  { type: "setRange", field: "transitionWindow", range: accepted.transitionArrivalMinute },
  { type: "setConfidence", confidence: "medium" },
  { type: "setRecommendation", recommendationId: "cool-sharp" }
];

/** Every action needed to reach the debrief, with no coaching actions at all. */
const completeRun = (): SessionAction[] => [
  { type: "start" },
  { type: "selectStation", stationId: "west" },
  { type: "selectStation", stationId: "central" },
  { type: "selectStation", stationId: "east" },
  { type: "advance", steps: 2 },
  { type: "openEvidence", evidenceId: "guided-stations-initial" },
  { type: "openEvidence", evidenceId: "guided-pressure-trend" },
  { type: "openEvidence", evidenceId: "guided-front-position" },
  { type: "advance", steps: 1 },
  { type: "openEvidence", evidenceId: "guided-precipitation-band" },
  ...completeForecast(),
  { type: "commit" },
  { type: "setMinute", minute: machine.verificationMinute },
  { type: "verify" },
  { type: "finish" }
];

describe("guided tutorial progression", () => {
  it("stays out of the way until the observation starts", () => {
    expect(currentTutorialStep(machine, machine.initialState)).toBeUndefined();
    expect(tutorialProgress(machine, machine.initialState).completed).toBe(0);
  });

  it("advances one action at a time, completing every step by the debrief", () => {
    const expectedSequence: readonly {
      readonly actions: readonly SessionAction[];
      readonly step: string | undefined;
    }[] = [
      { actions: [{ type: "start" }], step: "read-station-report" },
      { actions: [{ type: "selectStation", stationId: "west" }], step: "compare-stations" },
      {
        actions: [
          { type: "selectStation", stationId: "central" },
          { type: "selectStation", stationId: "east" }
        ],
        step: "read-trends"
      },
      {
        actions: [
          { type: "advance", steps: 2 },
          { type: "openEvidence", evidenceId: "guided-pressure-trend" }
        ],
        step: "follow-front"
      },
      {
        actions: [{ type: "openEvidence", evidenceId: "guided-front-position" }],
        step: "check-precipitation"
      },
      {
        actions: [{ type: "openEvidence", evidenceId: "guided-precipitation-band" }],
        step: "record-forecast"
      },
      { actions: completeForecast(), step: "commit-forecast" },
      { actions: [{ type: "commit" }], step: "compare-with-record" },
      {
        actions: [{ type: "setMinute", minute: machine.verificationMinute }, { type: "verify" }],
        step: "read-debrief"
      },
      { actions: [{ type: "finish" }], step: undefined }
    ];

    let state = machine.initialState;
    for (const stage of expectedSequence) {
      state = stage.actions.reduce((current, action) => machine.reduce(current, action), state);
      expect(currentTutorialStep(machine, state)?.id, JSON.stringify(stage)).toBe(stage.step);
    }
    expect(tutorialProgress(machine, state).completed).toBe(tutorialProgress(machine, state).total);
  });

  it("keeps the step list under 'hints on request' but reveals nothing until asked", () => {
    const started = run([{ type: "start" }]);
    expect(currentTutorialStep(machine, started)?.id).toBe("read-station-report");

    const reduced = machine.reduce(started, { type: "setAssistance", assistance: "reduced" });
    const step = currentTutorialStep(machine, reduced);
    expect(step?.id).toBe("read-station-report");
    // The promise of the label: nothing is revealed until the player asks.
    expect(visibleHints(step!, reduced)).toEqual([]);
    const asked = machine.reduce(reduced, { type: "useHint", stepId: step!.id });
    expect(visibleHints(step!, asked)).toHaveLength(1);
  });

  it("goes silent when coaching is disabled, and never runs on independent missions", () => {
    const started = run([{ type: "start" }]);
    const off = machine.reduce(started, { type: "setAssistance", assistance: "off" });
    expect(currentTutorialStep(machine, off)).toBeUndefined();

    const independent = createSessionMachine(canonicalFrontPassageScenarios[1]!);
    const independentStarted = independent.reduce(independent.initialState, { type: "start" });
    expect(currentTutorialStep(independent, independentStarted)).toBeUndefined();
    expect(buildGuidedTutorial(independent).length).toBeGreaterThan(0);
  });

  it("stands down once the step list is complete, which is distinct from being disabled", () => {
    let state = machine.initialState;
    for (const action of completeRun()) {
      state = machine.reduce(state, action);
    }
    expect(currentTutorialStep(machine, state)).toBeUndefined();
    expect(coachingComplete(machine, state)).toBe(true);

    // Same undefined step, different reason: coaching is still wanted here.
    const startedAgain = machine.reduce(machine.initialState, { type: "start" });
    expect(currentTutorialStep(machine, startedAgain)?.id).toBe("read-station-report");
    expect(coachingComplete(machine, startedAgain)).toBe(false);
  });

  it("reveals one hint at a time and never more than it has", () => {
    const started = run([{ type: "start" }]);
    const step = currentTutorialStep(machine, started)!;
    expect(visibleHints(step, started)).toHaveLength(1);
    const once = machine.reduce(started, { type: "useHint", stepId: step.id });
    expect(visibleHints(step, once)).toHaveLength(2);
    const twice = machine.reduce(once, { type: "useHint", stepId: step.id });
    expect(visibleHints(step, twice)).toHaveLength(2);
  });
});

describe("no dead ends", () => {
  it("completes the whole guided path with no hint and no coaching action at all", () => {
    const state = run(completeRun());
    expect(state.phase).toBe("debrief");
    const progress = tutorialProgress(machine, state);
    expect(progress.completed).toBe(progress.total);
    expect(state.hintsUsed).toEqual({});
  });

  it("leaves the cursor on a reachable step after a premature, invalid or unknown action", () => {
    const started = run([{ type: "start" }]);
    const wrongActions: readonly SessionAction[] = [
      // Premature: commit with an empty draft, and compare before the window closes.
      { type: "commit" },
      { type: "verify" },
      // Unknown identifiers: not a station, not evidence, not a hint.
      { type: "selectStation", stationId: "atlantis" },
      { type: "openEvidence", evidenceId: "not-a-real-evidence-id" },
      { type: "useHint", stepId: "not-a-real-step" },
      // Nonsensical time travel, and past the end of the timeline.
      { type: "setMinute", minute: -60 },
      { type: "advance", steps: 999 }
    ];

    for (const action of wrongActions) {
      const after = machine.reduce(started, action);
      // The session survives, and the player is still told what to do next.
      expect(after.phase, JSON.stringify(action)).toBe("observing");
      const step = currentTutorialStep(machine, after);
      expect(step?.id, JSON.stringify(action)).toBe("read-station-report");
      expect(visibleHints(step!, after).length).toBeGreaterThan(0);
    }
  });

  it("every gated step is reachable from the initial state using only its own condition", () => {
    // The step list is strictly sequential, so a step whose condition can never be met from
    // the state the player is in would strand them. Walk the mission and assert that each
    // step becomes the current step before it is completed.
    const steps = buildGuidedTutorial(machine);
    let state = machine.initialState;
    let index = 0;
    for (const action of completeRun()) {
      state = machine.reduce(state, action);
      while (index < steps.length && steps[index]!.isComplete(state)) index += 1;
      const step = currentTutorialStep(machine, state);
      // Whenever a step is outstanding it is the next unmet one, never an unreachable one.
      expect(step?.id ?? "complete", JSON.stringify({ action, index })).toBe(
        steps[index]?.id ?? "complete"
      );
    }
    expect(index).toBe(steps.length);
  });
});

describe("hint integrity", () => {
  it("never puts a number in coaching text, so hints cannot reveal an answer", () => {
    const steps = buildGuidedTutorial(machine);
    const texts = steps.flatMap((step) => [step.title, step.instruction, ...step.hints]);
    for (const text of texts) {
      expect(text, text).not.toMatch(/[0-9]/);
    }
  });

  it("keeps contextual hints non-numeric for every mission and phase", () => {
    for (const scenario of canonicalFrontPassageScenarios) {
      const scenarioMachine = createSessionMachine(scenario);
      let state = scenarioMachine.initialState;
      const seen = new Set<string>();
      const actions: SessionAction[] = [
        { type: "start" },
        { type: "advance", steps: 4 },
        { type: "selectStation", stationId: "west" }
      ];
      for (const action of actions) {
        state = scenarioMachine.reduce(state, action);
        seen.add(contextualHint(scenarioMachine, state));
      }
      for (const text of seen) expect(text, `${scenario.scenarioId}: ${text}`).not.toMatch(/[0-9]/);
    }
  });

  it("nudges toward the next available evidence and the missing fields", () => {
    const started = run([{ type: "start" }]);
    expect(contextualHint(machine, started)).toContain("station readings");
    const observed = run([
      { type: "start" },
      { type: "advance", steps: 1 },
      { type: "openEvidence", evidenceId: "guided-stations-initial" },
      { type: "openEvidence", evidenceId: "guided-pressure-trend" },
      { type: "openEvidence", evidenceId: "guided-front-position" },
      { type: "advance", steps: 1 },
      { type: "openEvidence", evidenceId: "guided-precipitation-band" }
    ]);
    expect(contextualHint(machine, observed)).toContain("Attach the evidence");
  });
});
