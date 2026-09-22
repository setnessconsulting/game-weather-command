import { describe, expect, it } from "vitest";

import { canonicalFrontPassageScenarios } from "@/scenarios";
import {
  buildGuidedTutorial,
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

  it("disappears when coaching is reduced or disabled, and never runs on independent missions", () => {
    const started = run([{ type: "start" }]);
    expect(currentTutorialStep(machine, started)?.id).toBe("read-station-report");
    expect(currentTutorialStep(machine, machine.reduce(started, { type: "setAssistance", assistance: "reduced" }))).toBeUndefined();
    expect(currentTutorialStep(machine, machine.reduce(started, { type: "setAssistance", assistance: "off" }))).toBeUndefined();

    const independent = createSessionMachine(canonicalFrontPassageScenarios[1]!);
    const independentStarted = independent.reduce(independent.initialState, { type: "start" });
    expect(currentTutorialStep(independent, independentStarted)).toBeUndefined();
    expect(buildGuidedTutorial(independent).length).toBeGreaterThan(0);
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
