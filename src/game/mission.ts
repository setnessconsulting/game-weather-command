import { canonicalFrontPassageScenarios, type WeatherScenarioV1 } from "@/scenarios";

import type { MissionType } from "./forecast";

export type MissionDifficulty = "coached" | "standard" | "challenging";

export interface MissionSummary {
  readonly missionType: MissionType;
  readonly scenarioId: string;
  readonly title: string;
  readonly objective: string;
  readonly focus: string;
  readonly difficulty: MissionDifficulty;
  readonly difficultyLabel: string;
  readonly teaches: readonly string[];
  readonly targetStationId: string;
  readonly targetStationName: string;
  readonly forecastWindow: { readonly startMinute: number; readonly endMinute: number };
  readonly timeline: WeatherScenarioV1["timeline"];
  readonly evidenceCount: number;
  readonly stationCount: number;
}

const missionCopy: Record<
  MissionType,
  { readonly focus: string; readonly difficulty: MissionDifficulty; readonly teaches: readonly string[] }
> = {
  "guided-cold-front": {
    focus: "Learn the whole loop with step-by-step coaching, then forecast the arrival time of a cold front.",
    difficulty: "coached",
    teaches: [
      "Reading a station report",
      "Comparing stations to detect motion",
      "Turning boundary motion into an arrival window",
      "Calibrating confidence to evidence"
    ]
  },
  "independent-cold-front": {
    focus: "Same physics, no coaching: the order in which stations change is your timing evidence.",
    difficulty: "standard",
    teaches: [
      "Using change sequence as timing evidence",
      "Separating a confident temperature shift from a less certain shower band"
    ]
  },
  "warm-front": {
    focus: "A gradual transition instead of a sharp one: the same instruments, a different shape of change.",
    difficulty: "standard",
    teaches: [
      "Recognising gradual change across several steps",
      "Distinguishing warm-front from cold-front behaviour",
      "Forecasting within a wider, slower transition"
    ]
  },
  "uncertain-boundary": {
    focus: "The direction of change is visible but the timing is not. Defensible uncertainty is the target.",
    difficulty: "challenging",
    teaches: [
      "Reasoning with noisy observations",
      "Forecasting a wide but still useful window",
      "Calibrating confidence when evidence is genuinely mixed"
    ]
  }
};

const difficultyLabels: Record<MissionDifficulty, string> = {
  coached: "Coached",
  standard: "Standard",
  challenging: "Challenging"
};

export const MISSIONS: readonly MissionSummary[] = canonicalFrontPassageScenarios.map((scenario) => {
  const copy = missionCopy[scenario.missionType];
  const window = scenario.forecastWindows[0]!;
  const targetStationId = window.targetStationIds[0]!;
  const targetStation = scenario.stations.find((station) => station.id === targetStationId)!;
  return {
    missionType: scenario.missionType,
    scenarioId: scenario.scenarioId,
    title: scenario.title,
    objective: scenario.objective,
    focus: copy.focus,
    difficulty: copy.difficulty,
    difficultyLabel: difficultyLabels[copy.difficulty],
    teaches: copy.teaches,
    targetStationId,
    targetStationName: targetStation.name,
    forecastWindow: { startMinute: window.startMinute, endMinute: window.endMinute },
    timeline: scenario.timeline,
    evidenceCount: scenario.evidence.length,
    stationCount: scenario.stations.length
  };
});

export function scenarioByMissionType(missionType: MissionType): WeatherScenarioV1 | undefined {
  return canonicalFrontPassageScenarios.find((scenario) => scenario.missionType === missionType);
}

export function missionByMissionType(missionType: MissionType): MissionSummary | undefined {
  return MISSIONS.find((mission) => mission.missionType === missionType);
}

export function missionForScenario(scenario: WeatherScenarioV1): MissionSummary | undefined {
  return missionByMissionType(scenario.missionType);
}

export function scenarioById(scenarioId: string): WeatherScenarioV1 | undefined {
  return canonicalFrontPassageScenarios.find((scenario) => scenario.scenarioId === scenarioId);
}
