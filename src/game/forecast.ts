import type { ForecastWindow } from "@/domain";
import type { WeatherScenarioV1 } from "@/scenarios";

import { formatMinuteRange } from "./units";

export type ConfidenceLevel = "low" | "medium" | "high";
export type ForecastDirection = "cooler" | "warmer" | "unsure";
export type MissionType = WeatherScenarioV1["missionType"];

export interface NumericRangeValue {
  readonly min: number;
  readonly max: number;
}

export interface ForecastDraft {
  /** Expected signed temperature change at the target station. */
  readonly temperatureChangeC: NumericRangeValue | null;
  /** Expected probability that measurable precipitation occurs at the target station. */
  readonly precipitationProbabilityPct: NumericRangeValue | null;
  /** Expected wind direction sector once the change has passed. */
  readonly windDirectionDeg: NumericRangeValue | null;
  /** Expected timing window, in simulated minutes from the scenario start. */
  readonly transitionWindow: NumericRangeValue | null;
  readonly confidence: ConfidenceLevel | null;
  /** Bounded, explicitly fictional operational recommendation. */
  readonly recommendationId: string | null;
}

export const EMPTY_FORECAST_DRAFT: ForecastDraft = {
  temperatureChangeC: null,
  precipitationProbabilityPct: null,
  windDirectionDeg: null,
  transitionWindow: null,
  confidence: null,
  recommendationId: null
};

export interface RecommendationOption {
  readonly id: string;
  readonly label: string;
  readonly direction: ForecastDirection;
}

/**
 * Bounded, deliberately fictional operational recommendations.
 *
 * These are planning stances, not real advisories: the region, stations and events are
 * invented. Each option carries the direction it implies so the game can check whether the
 * player's own forecast, confidence and recommendation tell a consistent story.
 */
export const RECOMMENDATION_OPTIONS: Record<MissionType, readonly RecommendationOption[]> = {
  "guided-cold-front": [
    {
      id: "cool-sharp",
      label: "Plan for a sudden cooler, windier, wetter change during the window.",
      direction: "cooler"
    },
    {
      id: "no-change",
      label: "Plan for no meaningful change during the window.",
      direction: "unsure"
    },
    {
      id: "warm-slow",
      label: "Plan for a slow warm-up with long spells of light rain.",
      direction: "warmer"
    }
  ],
  "independent-cold-front": [
    {
      id: "cool-sharp",
      label: "Plan for a sudden cooler, windier, wetter change during the window.",
      direction: "cooler"
    },
    {
      id: "no-change",
      label: "Plan for no meaningful change during the window.",
      direction: "unsure"
    },
    {
      id: "warm-slow",
      label: "Plan for a slow warm-up with long spells of light rain.",
      direction: "warmer"
    }
  ],
  "warm-front": [
    {
      id: "warm-gradual",
      label: "Plan for a gradual warm-up with long spells of light rain.",
      direction: "warmer"
    },
    {
      id: "cool-sharp",
      label: "Plan for a sudden cooler, windier, wetter change.",
      direction: "cooler"
    },
    {
      id: "no-change",
      label: "Plan for no meaningful change during the window.",
      direction: "unsure"
    }
  ],
  "uncertain-boundary": [
    {
      id: "hedged",
      label: "Plan for a change in the expected direction, but keep a time buffer for the uncertain timing.",
      direction: "unsure"
    },
    {
      id: "cool-sharp",
      label: "Plan for a precisely timed, sudden cold change.",
      direction: "cooler"
    },
    {
      id: "no-change",
      label: "Plan for no meaningful change during the window.",
      direction: "unsure"
    }
  ]
};

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ["low", "medium", "high"];

export const confidenceLabel: Record<ConfidenceLevel, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence"
};

export interface ForecastIssue {
  readonly field: "temperature" | "precipitation" | "wind" | "timing" | "confidence" | "recommendation";
  readonly severity: "blocking" | "advisory";
  readonly message: string;
}

export interface ForecastValidation {
  readonly ok: boolean;
  readonly issues: readonly ForecastIssue[];
}

const MODELLED_TEMPERATURE_LIMIT_C = 25;
const MODELLED_WIND_SPEED_LIMIT_DEG = 360;

function rangeIssue(
  field: ForecastIssue["field"],
  range: NumericRangeValue | null,
  bounds: { min: number; max: number; lowerInclusive?: boolean },
  unit: string
): ForecastIssue[] {
  if (!range) return [{ field, severity: "blocking", message: `Enter a ${field} range before committing.` }];
  const issues: ForecastIssue[] = [];
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) {
    return [{ field, severity: "blocking", message: `The ${field} range must be a number.` }];
  }
  if (range.min > range.max) {
    issues.push({
      field,
      severity: "blocking",
      message: `The ${field} range is inverted: the low end must not be larger than the high end.`
    });
  }
  if (range.min < bounds.min || range.max > bounds.max) {
    issues.push({
      field,
      severity: "blocking",
      message: `The ${field} range must stay between ${bounds.min} and ${bounds.max} ${unit}.`
    });
  }
  return issues;
}

/**
 * Validates a draft against scenario bounds. Validation is about plausibility and internal
 * consistency only: it never compares the draft with the scenario's expected answer.
 */
export function validateForecastDraft(
  draft: ForecastDraft,
  scenario: WeatherScenarioV1,
  window: ForecastWindow
): ForecastValidation {
  const issues: ForecastIssue[] = [
    ...rangeIssue(
      "temperature",
      draft.temperatureChangeC,
      { min: -MODELLED_TEMPERATURE_LIMIT_C, max: MODELLED_TEMPERATURE_LIMIT_C },
      "°C"
    ),
    ...rangeIssue("precipitation", draft.precipitationProbabilityPct, { min: 0, max: 100 }, "%"),
    ...rangeIssue(
      "wind",
      draft.windDirectionDeg,
      { min: 0, max: MODELLED_WIND_SPEED_LIMIT_DEG },
      "degrees"
    ),
    ...rangeIssue(
      "timing",
      draft.transitionWindow,
      { min: scenario.timeline.startMinute, max: scenario.timeline.maxMinute },
      "simulated minutes"
    )
  ];

  if (!draft.confidence) {
    issues.push({ field: "confidence", severity: "blocking", message: "State a confidence level before committing." });
  }
  if (!draft.recommendationId) {
    issues.push({
      field: "recommendation",
      severity: "blocking",
      message: "Choose an operational recommendation before committing."
    });
  }

  if (draft.transitionWindow) {
    const width = Math.abs(draft.transitionWindow.max - draft.transitionWindow.min);
    if (width > 150) {
      issues.push({
        field: "timing",
        severity: "advisory",
        message:
          `A ${Math.round(width)} min window is very broad. It will not be treated as wrong, but a narrower window ` +
          "shows a sharper forecast and makes the comparison more useful."
      });
    }
    if (draft.transitionWindow.min < window.startMinute || draft.transitionWindow.min > window.endMinute) {
      issues.push({
        field: "timing",
        severity: "advisory",
        message:
          `The published forecast window is ${formatMinuteRange(window.startMinute, window.endMinute)}. ` +
          "A window starting outside it is unusual, but you can still commit it and discuss it in the debrief."
      });
    }
  }

  if (draft.precipitationProbabilityPct) {
    const width = draft.precipitationProbabilityPct.max - draft.precipitationProbabilityPct.min;
    if (width > 60) {
      issues.push({
        field: "precipitation",
        severity: "advisory",
        message: "A probability range wider than 60 points is close to saying nothing at all."
      });
    }
  }

  return { ok: !issues.some((issue) => issue.severity === "blocking"), issues };
}

export function draftDirection(draft: ForecastDraft): ForecastDirection {
  if (!draft.temperatureChangeC) return "unsure";
  const midpoint = (draft.temperatureChangeC.min + draft.temperatureChangeC.max) / 2;
  if (midpoint < -1) return "cooler";
  if (midpoint > 1) return "warmer";
  return "unsure";
}

export function isRangeEntered(range: NumericRangeValue | null): range is NumericRangeValue {
  return range !== null;
}

export function recommendationOption(
  scenario: WeatherScenarioV1,
  recommendationId: string | null
): RecommendationOption | undefined {
  if (!recommendationId) return undefined;
  return RECOMMENDATION_OPTIONS[scenario.missionType].find((option) => option.id === recommendationId);
}
