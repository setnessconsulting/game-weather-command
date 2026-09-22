import { stateAtMinute } from "@/domain";
import type { ForecastWindow, KernelScenarioDefinition, StationObservation } from "@/domain";
import type { WeatherScenarioV1 } from "@/scenarios";

import { describeObservationFacts } from "./evidence";
import { observedTransition, type ObservedTransition } from "./observation";
import {
  recommendationOption,
  type ConfidenceLevel,
  type ForecastDirection,
  type ForecastDraft,
  type NumericRangeValue
} from "./forecast";
import {
  formatDuration,
  formatMinuteRange,
  formatPrecipitationRate,
  formatSignedTemperature,
  formatSimulatedTimestamp,
  roundTo
} from "./units";

export type SupportLevel = "supported" | "partially-supported" | "unsupported";

export interface TimingAssessment {
  readonly predicted: NumericRangeValue;
  readonly observed: NumericRangeValue;
  readonly overlapMinutes: number;
  readonly level: SupportLevel;
  readonly detail: string;
}

export interface RangeAssessment {
  readonly dimension: "temperature" | "precipitation" | "wind";
  readonly label: string;
  readonly predicted: NumericRangeValue;
  readonly observedValue: number;
  readonly observedLabel: string;
  readonly level: SupportLevel;
  readonly detail: string;
}

export interface EvidenceQualityAssessment {
  readonly selected: readonly string[];
  readonly relevant: readonly string[];
  readonly usedRelevant: readonly string[];
  readonly unusedRelevant: readonly string[];
  readonly coverageRatio: number;
  readonly level: SupportLevel;
  readonly detail: string;
}

export interface CausalReasoningAssessment {
  readonly forecastDirection: ForecastDirection;
  readonly observedDirection: ForecastDirection;
  readonly directionMatches: boolean;
  readonly recommendationId: string | null;
  readonly recommendationDirection: ForecastDirection | null;
  readonly recommendationMatchesForecast: boolean;
  readonly causalEvidenceSelected: boolean;
  readonly level: SupportLevel;
  readonly notes: readonly string[];
}

export type CalibrationLevel = "well-calibrated" | "overconfident" | "underconfident";

export interface CalibrationAssessment {
  readonly stated: ConfidenceLevel;
  readonly defensible: readonly ConfidenceLevel[];
  readonly level: CalibrationLevel;
  readonly detail: string;
}

export interface ObservedFact {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
}

export interface VerificationReport {
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly stationId: string;
  readonly stationName: string;
  readonly committedAtMinute: number;
  readonly verificationMinute: number;
  /**
   * forecast: committed before the target station began to change.
   * nowcast:  committed while the change was already under way at the target station.
   * hindcast: committed after the published forecast window had already closed.
   */
  readonly mode: "forecast" | "nowcast" | "hindcast";
  readonly modeDetail: string;
  readonly reference: {
    readonly forecastWindow: { readonly startMinute: number; readonly endMinute: number };
    readonly authoredAcceptedRange: {
      readonly transitionArrivalMinute: NumericRangeValue;
      readonly temperatureChangeC: NumericRangeValue;
      readonly precipitationProbabilityPct: NumericRangeValue;
      readonly windDirectionSectorsDeg: readonly NumericRangeValue[];
      readonly defensibleConfidence: readonly ConfidenceLevel[];
    };
  };
  readonly observed: ObservedTransition;
  readonly observedFacts: readonly ObservedFact[];
  readonly timing: TimingAssessment;
  readonly ranges: readonly RangeAssessment[];
  readonly precipitationOutcome: {
    readonly occurred: boolean;
    readonly peakRateMmh: number;
    readonly verificationBasis: string;
  };
  readonly evidenceQuality: EvidenceQualityAssessment;
  readonly causalReasoning: CausalReasoningAssessment;
  readonly calibration: CalibrationAssessment;
  readonly modelBoundaries: readonly { readonly id: string; readonly description: string }[];
  readonly sourceRefs: readonly { readonly id: string; readonly url: string; readonly relationship: string }[];
  readonly headline: string;
}

export interface VerificationInput {
  readonly scenario: WeatherScenarioV1;
  readonly kernel: KernelScenarioDefinition;
  readonly window: ForecastWindow;
  readonly stationId: string;
  readonly forecast: ForecastDraft;
  readonly selectedEvidenceIds: readonly string[];
  readonly committedAtMinute: number;
  readonly verificationMinute: number;
}

const CAUSAL_LEARNING_TAGS: readonly string[] = [
  "front-motion",
  "timing",
  "sequence",
  "gradual-change",
  "noise"
];

function sectorContains(sector: NumericRangeValue, degrees: number): boolean {
  const value = ((degrees % 360) + 360) % 360;
  if (sector.min <= sector.max) return value >= sector.min && value <= sector.max;
  return value >= sector.min || value <= sector.max;
}

function sectorDistance(sector: NumericRangeValue, degrees: number): number {
  if (sectorContains(sector, degrees)) return 0;
  return Math.min(
    ...([sector.min, sector.max] as const).map((edge) => Math.abs(((edge - degrees + 540) % 360) - 180))
  );
}

function directionFromTemperature(changeC: number): ForecastDirection {
  if (changeC < -1) return "cooler";
  if (changeC > 1) return "warmer";
  return "unsure";
}

function rangeMidpoint(range: NumericRangeValue): number {
  return (range.min + range.max) / 2;
}

function assessTiming(
  predicted: NumericRangeValue,
  transition: ObservedTransition,
  stepMinutes: number
): TimingAssessment {
  const observed = { min: transition.startMinute, max: transition.endMinute };
  const overlapMinutes = Math.max(
    0,
    Math.min(predicted.max, observed.max) - Math.max(predicted.min, observed.min)
  );
  const gap = overlapMinutes > 0 ? 0 : Math.max(observed.min - predicted.max, predicted.min - observed.max);
  const width = Math.abs(predicted.max - predicted.min);

  const level: SupportLevel =
    overlapMinutes > 0 ? "supported" : gap <= stepMinutes ? "partially-supported" : "unsupported";
  const precisionNote =
    width > 150 ? " The window was also very broad, which makes it harder to act on even where it overlaps." : "";

  const detail =
    overlapMinutes > 0
      ? `Your window ${formatMinuteRange(predicted.min, predicted.max)} overlaps the observed change at ${formatMinuteRange(
          observed.min,
          observed.max
        )} by ${formatDuration(overlapMinutes)}.${precisionNote}`
      : `Your window ${formatMinuteRange(predicted.min, predicted.max)} misses the observed change at ${formatMinuteRange(
          observed.min,
          observed.max
        )} by ${formatDuration(gap)}.${precisionNote}`;

  return { predicted, observed, overlapMinutes, level, detail };
}

function assessTemperature(predicted: NumericRangeValue, transition: ObservedTransition): RangeAssessment {
  const observedValue = transition.temperatureChangeC;
  const contains = observedValue >= predicted.min && observedValue <= predicted.max;
  const distance = contains
    ? 0
    : Math.min(Math.abs(observedValue - predicted.min), Math.abs(observedValue - predicted.max));
  const level: SupportLevel = contains ? "supported" : distance <= 1 ? "partially-supported" : "unsupported";

  return {
    dimension: "temperature",
    label: "Temperature change",
    predicted,
    observedValue,
    observedLabel: formatSignedTemperature(observedValue),
    level,
    detail: contains
      ? `Your range ${formatSignedTemperature(predicted.min)} to ${formatSignedTemperature(
          predicted.max
        )} contains the measured change of ${formatSignedTemperature(observedValue)} at ${transition.stationName}.`
      : `The measured change was ${formatSignedTemperature(
          observedValue
        )}, which falls outside your range by about ${roundTo(distance, 1).toFixed(1)} °C.`
  };
}

function assessWind(predicted: NumericRangeValue, transition: ObservedTransition): RangeAssessment {
  const observedValue = transition.finalWindDirectionDeg;
  const contains = sectorContains(predicted, observedValue);
  const distance = sectorDistance(predicted, observedValue);
  const level: SupportLevel = contains ? "supported" : distance <= 15 ? "partially-supported" : "unsupported";

  return {
    dimension: "wind",
    label: "Wind direction",
    predicted,
    observedValue,
    observedLabel: `${Math.round(observedValue)}°`,
    level,
    detail: contains
      ? `Your sector ${Math.round(predicted.min)}°–${Math.round(
          predicted.max
        )}° contains the direction measured once the change had passed (${Math.round(observedValue)}°).`
      : `The wind settled at ${Math.round(observedValue)}°, about ${Math.round(
          distance
        )}° outside your sector ${Math.round(predicted.min)}°–${Math.round(predicted.max)}°.`
  };
}

function assessPrecipitationProbability(
  predicted: NumericRangeValue,
  reference: NumericRangeValue,
  transition: ObservedTransition
): RangeAssessment {
  const overlap = Math.max(0, Math.min(predicted.max, reference.max) - Math.max(predicted.min, reference.min));
  const predictedWidth = Math.max(1, predicted.max - predicted.min);
  const fullyInside = predicted.min >= reference.min && predicted.max <= reference.max;
  const level: SupportLevel = fullyInside
    ? "supported"
    : overlap / predictedWidth >= 0.5
      ? "partially-supported"
      : "unsupported";

  return {
    dimension: "precipitation",
    label: "Precipitation probability",
    predicted,
    observedValue: transition.peakPrecipitationRateMmh,
    observedLabel: formatPrecipitationRate(transition.peakPrecipitationRateMmh),
    level,
    detail:
      "A probability cannot be confirmed or refuted by a single simulated day, so this is checked against the " +
      `scenario's authored defensible probability range (${Math.round(reference.min)}–${Math.round(reference.max)} %). ` +
      (fullyInside
        ? "Your range sits inside it."
        : overlap > 0
          ? "Your range overlaps it but reaches beyond it."
          : "Your range does not overlap it at all.") +
      ` For reference, the station recorded ${formatPrecipitationRate(transition.peakPrecipitationRateMmh)} at its heaviest.`
  };
}

function assessEvidenceQuality(
  selected: readonly string[],
  relevant: readonly string[]
): EvidenceQualityAssessment {
  const usedRelevant = relevant.filter((id) => selected.includes(id));
  const unusedRelevant = relevant.filter((id) => !selected.includes(id));
  const coverageRatio = relevant.length === 0 ? 0 : usedRelevant.length / relevant.length;
  const level: SupportLevel =
    coverageRatio >= 0.67 ? "supported" : coverageRatio > 0 ? "partially-supported" : "unsupported";

  const detail =
    relevant.length === 0
      ? "This mission does not flag any evidence as required, so evidence coverage was not assessed."
      : usedRelevant.length === 0
        ? "None of the evidence this mission's debrief relies on was attached to the forecast. Attaching evidence is how a forecast becomes checkable, so this is the main thing to change next time."
        : `You attached ${usedRelevant.length} of the ${relevant.length} evidence sets this mission's debrief relies on.` +
          (unusedRelevant.length > 0 ? ` Not attached: ${unusedRelevant.join(", ")}.` : " That is full coverage.");

  return {
    selected,
    relevant,
    usedRelevant,
    unusedRelevant,
    coverageRatio: roundTo(coverageRatio, 2),
    level,
    detail
  };
}

function assessCausalReasoning(
  scenario: WeatherScenarioV1,
  forecast: ForecastDraft,
  selected: readonly string[],
  transition: ObservedTransition
): CausalReasoningAssessment {
  const predictedMidpoint = forecast.temperatureChangeC ? rangeMidpoint(forecast.temperatureChangeC) : 0;
  const forecastDirection = directionFromTemperature(predictedMidpoint);
  const observedDirection = directionFromTemperature(transition.temperatureChangeC);
  const directionMatches = forecastDirection === observedDirection;
  const option = recommendationOption(scenario, forecast.recommendationId);
  const recommendationDirection: ForecastDirection | null = option ? option.direction : null;
  const recommendationMatchesForecast =
    recommendationDirection === null ? false : recommendationDirection === forecastDirection;

  const causalEvidenceSelected = scenario.evidence.some(
    (evidence) => selected.includes(evidence.id) && evidence.learningTags.some((tag) => CAUSAL_LEARNING_TAGS.includes(tag))
  );

  const notes: string[] = [];
  if (!directionMatches) {
    notes.push(
      `Your forecast implied ${
        forecastDirection === "unsure" ? "no clear direction" : `a ${forecastDirection} change`
      }, while ${transition.stationName} measured ${formatSignedTemperature(
        transition.temperatureChangeC
      )} across the transition.`
    );
  }
  if (!recommendationMatchesForecast) {
    notes.push(
      recommendationDirection === null
        ? "No recommendation was recorded, so forecast and recommendation consistency could not be checked."
        : recommendationDirection === "unsure"
          ? "Your recommendation hedged while your forecast stated a clear direction. Both can be defensible, but together they send a mixed message."
          : `Your recommendation implied a ${recommendationDirection} plan while your forecast implied ${forecastDirection}.`
    );
  }
  if (!causalEvidenceSelected) {
    notes.push(
      "No attached evidence described how the system was moving or changing over time, so the reasoning behind the direction cannot be inspected from the forecast alone."
    );
  }

  const satisfied = [directionMatches, recommendationMatchesForecast, causalEvidenceSelected].filter(Boolean).length;
  const level: SupportLevel = satisfied === 3 ? "supported" : satisfied === 2 ? "partially-supported" : "unsupported";

  return {
    forecastDirection,
    observedDirection,
    directionMatches,
    recommendationId: forecast.recommendationId,
    recommendationDirection,
    recommendationMatchesForecast,
    causalEvidenceSelected,
    level,
    notes
  };
}

function assessCalibration(
  stated: ConfidenceLevel | null,
  defensible: readonly ConfidenceLevel[]
): CalibrationAssessment {
  const order: readonly ConfidenceLevel[] = ["low", "medium", "high"];
  const effective: ConfidenceLevel = stated ?? "low";
  const statedIndex = order.indexOf(effective);
  const defensibleIndexes = defensible.map((level) => order.indexOf(level));
  const maxDefensible = defensibleIndexes.length > 0 ? Math.max(...defensibleIndexes) : 2;
  const minDefensible = defensibleIndexes.length > 0 ? Math.min(...defensibleIndexes) : 0;

  const level: CalibrationLevel =
    statedIndex > maxDefensible ? "overconfident" : statedIndex < minDefensible ? "underconfident" : "well-calibrated";

  const detail =
    level === "well-calibrated"
      ? `Stating ${effective} confidence fits what this scenario's evidence supports (${defensible.join(
          " or "
        )}). Calibration is about matching confidence to evidence, not about being right.`
      : level === "overconfident"
        ? `You stated ${effective} confidence, but this scenario's evidence supports ${defensible.join(
            " or "
          )}. Stating more confidence than the evidence carries is the most common calibration error in forecasting.`
        : `You stated ${effective} confidence, while this scenario's evidence supports ${defensible.join(
            " or "
          )}. Caution is never penalised here, but hedging when the evidence is strong hides a conclusion you had earned.`;

  return { stated: effective, defensible, level, detail };
}

function observedFactsAt(
  kernel: KernelScenarioDefinition,
  stationId: string,
  verificationMinute: number
): readonly ObservedFact[] {
  const bounded = Math.min(verificationMinute, kernel.timeline.maxMinute);
  const observation: StationObservation = stateAtMinute(kernel, bounded).stations[stationId]!;
  return [
    ...describeObservationFacts(observation),
    {
      label: "Reading used for verification",
      value: formatSimulatedTimestamp(bounded),
      note: "Verification compares the committed forecast with the canonical simulated record at this simulated time."
    }
  ];
}

export function verifyForecast(input: VerificationInput): VerificationReport {
  const {
    scenario,
    kernel,
    window,
    stationId,
    forecast,
    selectedEvidenceIds,
    committedAtMinute,
    verificationMinute
  } = input;

  const transition = observedTransition(kernel, stationId);
  if (!transition) {
    throw new Error(
      `Station "${stationId}" has no detectable transition, so this scenario cannot verify a forecast against it.`
    );
  }

  const accepted = scenario.acceptedRanges.find(
    (range) => range.forecastWindowId === window.id && range.targetStationId === stationId
  );
  if (!accepted) {
    throw new Error(`No authored accepted range exists for window "${window.id}" at station "${stationId}".`);
  }

  const timing = assessTiming(forecast.transitionWindow ?? { min: 0, max: 0 }, transition, kernel.timeline.stepMinutes);

  const ranges: RangeAssessment[] = [
    ...(forecast.temperatureChangeC ? [assessTemperature(forecast.temperatureChangeC, transition)] : []),
    ...(forecast.windDirectionDeg ? [assessWind(forecast.windDirectionDeg, transition)] : []),
    ...(forecast.precipitationProbabilityPct
      ? [
          assessPrecipitationProbability(
            forecast.precipitationProbabilityPct,
            accepted.precipitationProbabilityPct,
            transition
          )
        ]
      : [])
  ];

  const relevantEvidence = [...new Set(scenario.debrief.flatMap((relationship) => relationship.evidenceIds))];
  const evidenceQuality = assessEvidenceQuality(selectedEvidenceIds, relevantEvidence);
  const causalReasoning = assessCausalReasoning(scenario, forecast, selectedEvidenceIds, transition);
  const calibration = assessCalibration(forecast.confidence, accepted.defensibleConfidence);

  const strongDimensions = [
    timing.level === "supported" ? "timing" : undefined,
    ...ranges.filter((range) => range.level === "supported").map((range) => range.dimension),
    evidenceQuality.level === "supported" ? "evidence coverage" : undefined
  ].filter((value): value is string => Boolean(value));

  const weakDimensions = [
    timing.level === "unsupported" ? "timing" : undefined,
    ...ranges.filter((range) => range.level === "unsupported").map((range) => range.dimension),
    causalReasoning.level === "unsupported" ? "reasoning consistency" : undefined,
    evidenceQuality.level === "unsupported" ? "evidence coverage" : undefined
  ].filter((value): value is string => Boolean(value));

  const mode: VerificationReport["mode"] =
    committedAtMinute >= window.endMinute
      ? "hindcast"
      : committedAtMinute >= transition.startMinute
        ? "nowcast"
        : "forecast";

  const modeDetail =
    mode === "forecast"
      ? `You committed at ${formatSimulatedTimestamp(
          committedAtMinute
        )}, before ${transition.stationName} began to change. That is a genuine prediction.`
      : mode === "nowcast"
        ? `You committed at ${formatSimulatedTimestamp(
            committedAtMinute
          )}, which was already inside the observed change at ${transition.stationName} (${formatSimulatedTimestamp(
            transition.startMinute
          )} to ${formatSimulatedTimestamp(
            transition.endMinute
          )}). This is recorded as a nowcast: you described a change that had already started rather than predicting one. Committing earlier is what makes a forecast testable.`
        : `You committed at ${formatSimulatedTimestamp(
            committedAtMinute
          )}, after the published forecast window closed at ${formatSimulatedTimestamp(
            window.endMinute
          )}. This is recorded as a hindcast.`;

  const outcomeHeadline =
    strongDimensions.length > 0 && weakDimensions.length > 0
      ? `Supported: ${strongDimensions.join(", ")}. Least supported: ${weakDimensions.join(", ")}.`
      : strongDimensions.length > 0
        ? `Every assessed dimension was supported: ${strongDimensions.join(", ")}.`
        : weakDimensions.length > 0
          ? `The least supported parts of this forecast were ${weakDimensions.join(
              ", "
            )}. Nothing here is final — revise the forecast and compare again.`
          : "This forecast landed inside what the scenario supports on every assessed dimension.";

  const headline = mode === "forecast" ? outcomeHeadline : `${modeDetail} ${outcomeHeadline}`;

  return {
    scenarioId: scenario.scenarioId,
    contentVersion: scenario.contentVersion,
    stationId,
    stationName: transition.stationName,
    committedAtMinute,
    verificationMinute,
    mode,
    modeDetail,
    reference: {
      forecastWindow: { startMinute: window.startMinute, endMinute: window.endMinute },
      authoredAcceptedRange: {
        transitionArrivalMinute: accepted.transitionArrivalMinute,
        temperatureChangeC: accepted.temperatureChangeC,
        precipitationProbabilityPct: accepted.precipitationProbabilityPct,
        windDirectionSectorsDeg: accepted.windDirectionSectorsDeg,
        defensibleConfidence: accepted.defensibleConfidence
      }
    },
    observed: transition,
    observedFacts: observedFactsAt(kernel, stationId, verificationMinute),
    timing,
    ranges,
    precipitationOutcome: {
      occurred: transition.precipitationOccurred,
      peakRateMmh: transition.peakPrecipitationRateMmh,
      verificationBasis:
        "Precipitation is assessed against the scenario's authored defensible probability range together with the measured peak rate; one simulated day cannot confirm a probability."
    },
    evidenceQuality,
    causalReasoning,
    calibration,
    modelBoundaries: scenario.simplifications.filter((simplification) => simplification.learnerFacing),
    sourceRefs: scenario.sources.filter((source) =>
      scenario.debrief.some((relationship) => relationship.sourceRefIds.includes(source.id))
    ),
    headline
  };
}
