import type { ForecastSessionState, SessionMachine } from "./session";

export interface TutorialStep {
  readonly id: string;
  readonly title: string;
  readonly instruction: string;
  readonly hints: readonly string[];
  isComplete(state: ForecastSessionState): boolean;
}

const hasEvidenceOfType = (machine: SessionMachine, state: ForecastSessionState, type: string): boolean =>
  machine.scenario.evidence.some(
    (evidence) => evidence.type === type && state.openedEvidenceIds.includes(evidence.id)
  );

const allRangesEntered = (state: ForecastSessionState): boolean =>
  state.forecast.temperatureChangeC !== null &&
  state.forecast.precipitationProbabilityPct !== null &&
  state.forecast.windDirectionDeg !== null &&
  state.forecast.transitionWindow !== null;

/**
 * Builds the guided mission's contextual coaching path.
 *
 * Steps only ever describe an action the player can take next. None of them names an expected
 * number, range, station outcome or front arrival time, so completing the tutorial cannot
 * substitute for reading the evidence.
 */
export function buildGuidedTutorial(machine: SessionMachine): readonly TutorialStep[] {
  const types = new Set(machine.scenario.evidence.map((evidence) => evidence.type));
  const steps: TutorialStep[] = [];

  if (types.has("station")) {
    steps.push({
      id: "read-station-report",
      title: "Read a station report",
      instruction:
        "Open the station readings evidence, or select a station on the map, and read every instrument on that report.",
      hints: [
        "The evidence list sits under the map. Anything you can open there is safe to use, and nothing there reveals the outcome.",
        "Every station report shows temperature, pressure and its tendency, humidity, wind and precipitation. Read all six, not just temperature."
      ],
      isComplete: (state) =>
        state.inspectedStationIds.length > 0 || hasEvidenceOfType(machine, state, "station")
    });
  }

  steps.push({
    id: "compare-stations",
    title: "Compare the stations",
    instruction:
      "Select every station in the station list. A single station tells you what is happening; comparing stations tells you how the system is moving.",
    hints: [
      "Select each station in turn and note which instruments differ from the others.",
      "Look for a station that has already started to change while another has not. That difference is the strongest timing evidence you have."
    ],
    isComplete: (state) => state.inspectedStationIds.length >= machine.scenario.stations.length
  });

  if (types.has("trend")) {
    steps.push({
      id: "read-trends",
      title: "Read the trends",
      instruction:
        "Open the station trends evidence. Trends show how each station has changed since the mission began, and which part of the record changed fastest.",
      hints: [
        "If a trend looks flat, advance the simulated clock and read it again.",
        "Pressure tendency matters as much as pressure: a level that stops falling is a signal in its own right."
      ],
      isComplete: (state) => hasEvidenceOfType(machine, state, "trend")
    });
  }

  if (types.has("boundary")) {
    steps.push({
      id: "follow-front",
      title: "Follow the front",
      instruction:
        "Open the front position and motion evidence to see where the boundary is, which way it is heading, and roughly when it reaches each station.",
      hints: [
        "The extrapolated arrival times ignore the fact that real fronts change speed. Use them as a starting point, then sanity-check them against the station records.",
        "Compare the extrapolated arrival with the stations that have already changed. The two should tell the same story."
      ],
      isComplete: (state) => hasEvidenceOfType(machine, state, "boundary")
    });
  }

  if (types.has("precipitation")) {
    steps.push({
      id: "check-precipitation",
      title: "Check the precipitation band",
      instruction:
        "Open the precipitation evidence. Precipitation follows the boundary, so it is a useful cross-check on direction and on what the change will feel like.",
      hints: [
        "Precipitation intensity and position are modelled evidence, not a radar picture. Read the numbers, not just the shape.",
        "If the band is weakening, the chance of heavy rain at your target station is lower than its current intensity suggests."
      ],
      isComplete: (state) => hasEvidenceOfType(machine, state, "precipitation")
    });
  }

  steps.push({
    id: "record-forecast",
    title: "Record the forecast",
    instruction:
      "Fill in all four parts of the forecast: temperature change, precipitation probability, wind direction, and the timing window. Then attach the evidence you used.",
    hints: [
      "For each field, ask which piece of evidence made you choose that number.",
      "Attach the evidence you actually used. Attaching nothing is allowed, but the debrief will not be able to show your reasoning.",
      "A range is a statement about what you expect to be possible, not a guess at one exact number. Widen it if the evidence is genuinely mixed."
    ],
    isComplete: allRangesEntered
  });

  steps.push({
    id: "state-confidence",
    title: "State confidence and a recommendation",
    instruction:
      "Choose how confident the evidence really makes you, then pick the one operational recommendation your forecast would actually support.",
    hints: [
      "Confidence should track the evidence, not how much you want to be right.",
      "Your recommendation should be the one your own forecast supports. If it does not match, one of the two needs changing."
    ],
    isComplete: (state) => state.forecast.confidence !== null && state.forecast.recommendationId !== null
  });

  steps.push({
    id: "commit-forecast",
    title: "Commit the forecast",
    instruction: "Commit it. A forecast only becomes testable once it is written down.",
    hints: [
      "Committing does not end the mission. You can revise as many times as you like.",
      "Commit before the published forecast window closes. After that your entry is recorded as a hindcast."
    ],
    isComplete: (state) => state.attempts.length > 0
  });

  steps.push({
    id: "compare-with-record",
    title: "Compare with the record",
    instruction:
      "Advance the simulated clock to the close of the forecast window, then compare the forecast with what the stations actually recorded.",
    hints: [
      "Use the advance controls. Nothing is hidden from you once the window has closed.",
      "Read each dimension separately. A forecast can be right about direction and wrong about timing."
    ],
    isComplete: (state) => state.attempts.some((attempt) => attempt.verification !== undefined)
  });

  steps.push({
    id: "read-debrief",
    title: "Read the debrief",
    instruction:
      "Open the debrief to connect each outcome to the evidence behind it, then decide whether to revise.",
    hints: ["Use the debrief and revising together. The second attempt is usually where the learning happens."],
    isComplete: (state) => state.phase === "debrief"
  });

  return steps;
}

export function currentTutorialStep(
  machine: SessionMachine,
  state: ForecastSessionState
): TutorialStep | undefined {
  if (state.assistance !== "guided") return undefined;
  if (machine.scenario.missionType !== "guided-cold-front") return undefined;
  if (state.phase === "briefing") return undefined;
  return buildGuidedTutorial(machine).find((step) => !step.isComplete(state));
}

export function tutorialProgress(
  machine: SessionMachine,
  state: ForecastSessionState
): { readonly completed: number; readonly total: number } {
  const steps = buildGuidedTutorial(machine);
  return { completed: steps.filter((step) => step.isComplete(state)).length, total: steps.length };
}

export function visibleHints(step: TutorialStep, state: ForecastSessionState): readonly string[] {
  const used = state.hintsUsed[step.id] ?? 0;
  const revealCount = Math.min(step.hints.length, state.assistance === "guided" ? used + 1 : used);
  return revealCount <= 0 ? [] : step.hints.slice(0, revealCount);
}

/**
 * On-demand nudge for missions without step coaching. State-derived and deliberately
 * non-revealing, so it never collapses an independent mission into tutorial mode.
 */
export function contextualHint(machine: SessionMachine, state: ForecastSessionState): string {
  if (state.phase === "briefing") {
    return "Start the observation, then read at least two stations before deciding anything.";
  }
  if (state.phase === "verified") {
    return "Open the debrief to connect the outcome to the evidence you attached, then revise if a dimension was weak.";
  }
  if (state.phase === "debrief") {
    return "If any dimension was unsupported, revise from the same evidence and compare again.";
  }
  const unopened = machine.scenario.evidence.find(
    (evidence) => evidence.availableAtMinute <= state.minute && !state.openedEvidenceIds.includes(evidence.id)
  );
  if (unopened) {
    const titles: Record<string, string> = {
      station: "station readings",
      trend: "station trends",
      boundary: "front position and motion",
      precipitation: "precipitation band",
      map: "regional context"
    };
    return `You have not opened the ${titles[unopened.type] ?? unopened.type} evidence yet, and it is available now.`;
  }
  if (state.selectedEvidenceIds.length === 0) {
    return "Attach the evidence that supports your numbers. A forecast with no attached evidence cannot be inspected afterwards.";
  }
  if (!allRangesEntered(state)) {
    return "Some forecast fields are still empty. Fill in every field, even if you are unsure about it.";
  }
  if (state.forecast.confidence === null || state.forecast.recommendationId === null) {
    return "Choose a confidence level and a recommendation before committing.";
  }
  if (state.attempts.length === 0) {
    return "Commit the forecast, then advance the clock to the close of the published window to compare it with the record.";
  }
  return "Advance the clock to the close of the published forecast window, then compare.";
}
