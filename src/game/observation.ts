import { stateAtMinute } from "@/domain";
import type {
  BoundaryDefinition,
  KernelScenarioDefinition,
  NormalizedPoint,
  ScenarioState,
  StationObservation
} from "@/domain";
import type { WeatherScenarioV1 } from "@/scenarios";

import {
  describeHorizontalMotion,
  formatDuration,
  formatPrecipitationRate,
  formatSignedTemperature,
  formatSimulatedTimestamp,
  roundTo
} from "./units";

/* -------------------------------------------------------------------------- */
/* Station series                                                             */
/* -------------------------------------------------------------------------- */

export interface StationSeriesPoint {
  readonly minute: number;
  readonly observation: StationObservation;
}

export interface StationSeries {
  readonly stationId: string;
  readonly stationName: string;
  readonly stepMinutes: number;
  readonly points: readonly StationSeriesPoint[];
}

export function buildStationSeries(
  kernel: KernelScenarioDefinition,
  stationId: string,
  throughMinute: number
): StationSeries {
  const station = kernel.stations.find((candidate) => candidate.id === stationId);
  if (!station) throw new Error(`Unknown station "${stationId}".`);

  const bounded = Math.max(kernel.timeline.startMinute, Math.min(throughMinute, kernel.timeline.maxMinute));
  const points: StationSeriesPoint[] = [];
  for (let minute = kernel.timeline.startMinute; minute <= bounded; minute += kernel.timeline.stepMinutes) {
    points.push({ minute, observation: stateAtMinute(kernel, minute).stations[stationId]! });
  }

  return {
    stationId,
    stationName: station.name,
    stepMinutes: kernel.timeline.stepMinutes,
    points
  };
}

export function buildAllStationSeries(
  kernel: KernelScenarioDefinition,
  throughMinute: number
): readonly StationSeries[] {
  return kernel.stations.map((station) => buildStationSeries(kernel, station.id, throughMinute));
}

export interface SeriesChange {
  readonly temperatureC: number;
  readonly pressureHpa: number;
  readonly pressureTendencyHpaPer3h: number;
  readonly relativeHumidityPct: number;
  readonly windDirectionDeg: number;
  readonly windSpeedMps: number;
  readonly precipitationRateMmh: number;
}

export function seriesChange(series: StationSeries): SeriesChange {
  const first = series.points[0];
  const last = series.points[series.points.length - 1];
  if (!first || !last) throw new Error(`Station series "${series.stationId}" has no observation points.`);

  const signedDirection = ((last.observation.windDirectionDeg - first.observation.windDirectionDeg + 540) % 360) - 180;

  return {
    temperatureC: roundTo(last.observation.temperatureC - first.observation.temperatureC, 1),
    pressureHpa: roundTo(last.observation.pressureHpa - first.observation.pressureHpa, 1),
    pressureTendencyHpaPer3h: roundTo(
      last.observation.pressureTendencyHpaPer3h - first.observation.pressureTendencyHpaPer3h,
      1
    ),
    relativeHumidityPct: roundTo(last.observation.relativeHumidityPct - first.observation.relativeHumidityPct, 1),
    windDirectionDeg: roundTo(signedDirection, 1),
    windSpeedMps: roundTo(last.observation.windSpeedMps - first.observation.windSpeedMps, 1),
    precipitationRateMmh: roundTo(last.observation.precipitationRateMmh - first.observation.precipitationRateMmh, 1)
  };
}

export interface TransitionWindow {
  readonly startMinute: number;
  readonly endMinute: number;
}

/**
 * Observed transition window, derived only from the station's own reported observations.
 *
 * Definition (also documented in docs/SCIENCE_MODEL.md):
 * the window spans every consecutive pair of observation steps whose temperature change
 * rate is at least half of that station's maximum rate over the scenario, taken as the
 * enclosing span of those intervals. A front passage is the fastest sustained change in a
 * station record, so this recovers the authored passage window from public evidence alone
 * without exposing any authoring metadata to the learner or to grading.
 *
 * Returns undefined when the record contains no meaningful temperature change.
 */
export function deriveObservedTransitionWindow(series: StationSeries): TransitionWindow | undefined {
  const { points, stepMinutes } = series;
  if (points.length < 2) return undefined;

  const total = Math.abs(points[points.length - 1]!.observation.temperatureC - points[0]!.observation.temperatureC);
  if (total < 0.5) return undefined;

  const rates = points.slice(1).map((point, index) =>
    Math.abs(point.observation.temperatureC - points[index]!.observation.temperatureC) / stepMinutes
  );
  const maxRate = Math.max(...rates);
  if (maxRate <= 0) return undefined;

  const threshold = maxRate / 2;
  let startMinute: number | undefined;
  let endMinute: number | undefined;

  rates.forEach((rate, index) => {
    if (rate < threshold) return;
    const from = points[index]!.minute;
    const to = points[index + 1]!.minute;
    if (startMinute === undefined) startMinute = from;
    endMinute = to;
  });

  if (startMinute === undefined || endMinute === undefined) return undefined;
  return { startMinute, endMinute };
}

export interface ObservedTransition extends TransitionWindow {
  readonly stationId: string;
  readonly stationName: string;
  readonly temperatureChangeC: number;
  readonly pressureChangeHpa: number;
  readonly humidityChangePct: number;
  readonly windShiftDeg: number;
  readonly finalWindDirectionDeg: number;
  readonly finalWindSpeedMps: number;
  readonly peakPrecipitationRateMmh: number;
  readonly precipitationOccurred: boolean;
  readonly summary: string;
}

/**
 * Full-scenario outcome for a station. This is grading truth: it is computed from the
 * canonical scenario and is never placed into session state before verification.
 */
export function observedTransition(
  kernel: KernelScenarioDefinition,
  stationId: string
): ObservedTransition | undefined {
  const series = buildStationSeries(kernel, stationId, kernel.timeline.maxMinute);
  const window = deriveObservedTransitionWindow(series);
  if (!window) return undefined;

  const atStart = series.points.find((point) => point.minute === window.startMinute)!;
  const atEnd = series.points.find((point) => point.minute === window.endMinute)!;
  const change = seriesChange(series);
  const peakPrecipitationRateMmh = roundTo(
    Math.max(...series.points.map((point) => point.observation.precipitationRateMmh)),
    2
  );

  return {
    stationId,
    stationName: series.stationName,
    startMinute: window.startMinute,
    endMinute: window.endMinute,
    temperatureChangeC: roundTo(atEnd.observation.temperatureC - atStart.observation.temperatureC, 1),
    pressureChangeHpa: roundTo(atEnd.observation.pressureHpa - atStart.observation.pressureHpa, 1),
    humidityChangePct: roundTo(atEnd.observation.relativeHumidityPct - atStart.observation.relativeHumidityPct, 1),
    windShiftDeg: roundTo(
      ((atEnd.observation.windDirectionDeg - atStart.observation.windDirectionDeg + 540) % 360) - 180,
      1
    ),
    finalWindDirectionDeg: roundTo(atEnd.observation.windDirectionDeg, 1),
    finalWindSpeedMps: roundTo(atEnd.observation.windSpeedMps, 1),
    peakPrecipitationRateMmh,
    precipitationOccurred: peakPrecipitationRateMmh > 0.2,
    summary:
      `${series.stationName} changed most between ${formatSimulatedTimestamp(window.startMinute)} and ` +
      `${formatSimulatedTimestamp(window.endMinute)}: temperature ${formatSignedTemperature(
        roundTo(atEnd.observation.temperatureC - atStart.observation.temperatureC, 1)
      )}, ${change.pressureHpa >= 0 ? "pressure rose" : "pressure fell"}, and the strongest precipitation reading was ${formatPrecipitationRate(
        peakPrecipitationRateMmh
      )}.`
  };
}

/* -------------------------------------------------------------------------- */
/* Regional summary                                                           */
/* -------------------------------------------------------------------------- */

export interface StationPositionLabel {
  readonly stationId: string;
  readonly stationName: string;
  readonly position: NormalizedPoint;
  readonly description: string;
}

export interface BoundaryProximity {
  readonly stationId: string;
  readonly stationName: string;
  readonly distanceNormalized: number;
  readonly etaMinutes?: number;
  readonly note: string;
}

export interface BoundarySummary {
  readonly boundaryId: string;
  readonly kind: BoundaryDefinition["kind"];
  readonly kindLabel: string;
  readonly airMassLabels: readonly string[];
  readonly orientation: string;
  readonly positionSummary: string;
  readonly motionSummary: string;
  readonly speedRegionWidthsPerHour: number;
  readonly proximity: readonly BoundaryProximity[];
}

export interface PrecipitationSummary {
  readonly cellId: string;
  readonly intensityMmh: number;
  readonly intensityTrend: string;
  readonly positionSummary: string;
  readonly motionSummary: string;
  readonly nearestStationDistanceNormalized: number;
}

export interface RegionalSummary {
  readonly minute: number;
  readonly timestamp: string;
  readonly boundaries: readonly BoundarySummary[];
  readonly airMasses: readonly {
    readonly airMassId: string;
    readonly label: string;
    readonly center: NormalizedPoint;
    readonly motionSummary: string;
  }[];
  readonly precipitationCells: readonly PrecipitationSummary[];
  readonly stationPositions: readonly StationPositionLabel[];
}

const boundaryKindLabels: Record<BoundaryDefinition["kind"], string> = {
  "cold-front": "Cold front",
  "warm-front": "Warm front",
  "other-bounded-transition": "Bounded transition"
};

const normalize = (value: number): number => roundTo(value, 3);

function describeStationPosition(position: NormalizedPoint): string {
  const horizontal = position.x < 0.34 ? "west" : position.x > 0.66 ? "east" : "central";
  const vertical = position.y < 0.34 ? "north" : position.y > 0.66 ? "south" : "middle";
  const horizontalLabel =
    horizontal === "central" ? (vertical === "middle" ? "centre of the region" : `${vertical} of centre`) : `${horizontal} side`;
  return `${horizontalLabel}, ${vertical === "middle" ? "mid-latitude band" : `${vertical}ern band`}`;
}

function describeOrientation(path: readonly NormalizedPoint[]): string {
  const xs = path.map((point) => point.x);
  const ys = path.map((point) => point.y);
  const xSpan = Math.max(...xs) - Math.min(...xs);
  const ySpan = Math.max(...ys) - Math.min(...ys);
  if (xSpan < ySpan) return "runs north-south";
  if (ySpan < xSpan) return "runs west-east";
  return "is diagonally aligned";
}

function mean(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function boundarySpeedPerHour(movement: NormalizedPoint, stepMinutes: number): number {
  return roundTo(Math.hypot(movement.x, movement.y) * (60 / stepMinutes), 3);
}

/**
 * Approximate arrival of a straight translating boundary at a station.
 * This is the extrapolation a learner is expected to reason with, not the
 * scenario's authored answer; it deliberately ignores curvature and speed changes.
 */
function boundaryEta(
  boundaryPosition: NormalizedPoint,
  movement: NormalizedPoint,
  stationPosition: NormalizedPoint,
  minute: number,
  stepMinutes: number
): { etaMinutes?: number; distanceNormalized: number; note: string } {
  const primary = Math.abs(movement.x) >= Math.abs(movement.y)
    ? { axis: "x" as const, velocity: movement.x }
    : { axis: "y" as const, velocity: movement.y };
  const boundaryCoordinate = primary.axis === "x" ? boundaryPosition.x : boundaryPosition.y;
  const stationCoordinate = primary.axis === "x" ? stationPosition.x : stationPosition.y;
  const remaining = stationCoordinate - boundaryCoordinate;

  if (primary.velocity === 0) {
    return {
      distanceNormalized: normalize(Math.abs(remaining)),
      note: "This boundary is not modelled as moving across the region, so arrival cannot be extrapolated."
    };
  }

  const regionWidthsAway = normalize(Math.abs(remaining));
  if (remaining / primary.velocity < 0) {
    return {
      distanceNormalized: regionWidthsAway,
      note: "The boundary is already past this station or moving away from it, so no arrival time is extrapolated."
    };
  }

  // Deliberately left off the observation-step grid: a snapped value would look like a
  // known arrival time rather than the rough extrapolation it is.
  const stepsToArrival = remaining / primary.velocity;
  const etaMinutes = Math.round(minute + stepsToArrival * stepMinutes);
  return {
    ...(Number.isFinite(etaMinutes) && etaMinutes <= minute + 24 * 60 ? { etaMinutes } : {}),
    distanceNormalized: regionWidthsAway,
    note:
      `About ${Math.round(regionWidthsAway * 100)} % of the region's width away, travelling at the current speed. ` +
      `Extrapolated arrival ${Number.isFinite(etaMinutes) ? formatSimulatedTimestamp(etaMinutes) : "unknown"} — ` +
      "real fronts change speed and direction, so treat this as rough."
  };
}

export function buildRegionalSummary(
  scenario: WeatherScenarioV1,
  kernel: KernelScenarioDefinition,
  state: ScenarioState
): RegionalSummary {
  const stepMinutes = kernel.timeline.stepMinutes;
  const stepIndex = state.stepIndex;

  const stationPositions: StationPositionLabel[] = scenario.stations.map((station) => ({
    stationId: station.id,
    stationName: station.name,
    position: station.position,
    description: describeStationPosition(station.position)
  }));

  const boundaries: BoundarySummary[] = scenario.boundaries.map((definition) => {
    const boundaryState = state.boundaries.find((candidate) => candidate.id === definition.id);
    const path = boundaryState ? boundaryState.path : definition.initialPath;
    const boundaryPosition: NormalizedPoint = {
      x: mean(path.map((point) => point.x)),
      y: mean(path.map((point) => point.y))
    };
    const airMassLabels = [definition.airMassAId, definition.airMassBId].map((id) => {
      const airMass = scenario.airMasses.find((candidate) => candidate.id === id);
      return airMass ? airMass.label : id;
    });

    const proximity: BoundaryProximity[] = scenario.stations.map((station) => {
      const result = boundaryEta(boundaryPosition, definition.movement, station.position, state.minute, stepMinutes);
      return {
        stationId: station.id,
        stationName: station.name,
        distanceNormalized: result.distanceNormalized,
        ...(result.etaMinutes !== undefined ? { etaMinutes: result.etaMinutes } : {}),
        note: result.note
      };
    });

    return {
      boundaryId: definition.id,
      kind: definition.kind,
      kindLabel: boundaryKindLabels[definition.kind],
      airMassLabels,
      orientation: describeOrientation(path),
      positionSummary:
        `${boundaryKindLabels[definition.kind]} between ${airMassLabels[0]} and ${airMassLabels[1]}, ` +
        `currently centred near ${roundTo(boundaryPosition.x, 2)} of the region's width and ${roundTo(
          boundaryPosition.y,
          2
        )} of its height; it ${describeOrientation(path)}.`,
      motionSummary:
        `Modelled as moving ${describeHorizontalMotion(definition.movement)} at roughly ` +
        `${boundarySpeedPerHour(definition.movement, stepMinutes)} region widths per hour ` +
        `(${roundTo((boundarySpeedPerHour(definition.movement, stepMinutes) * 0.25), 2)} widths every 15 min). ` +
        `Since the scenario started at ${formatSimulatedTimestamp(0)}, it has advanced ${stepIndex * stepMinutes} min.`,
      speedRegionWidthsPerHour: boundarySpeedPerHour(definition.movement, stepMinutes),
      proximity
    };
  });

  const precipitationCells: PrecipitationSummary[] = scenario.precipitationCells.map((definition) => {
    const cellState = state.precipitationCells.find((candidate) => candidate.id === definition.id);
    const center = cellState ? cellState.center : definition.initialCenter;
    const intensityMmh = cellState ? cellState.intensityMmh : definition.initialIntensityMmh;
    const projected = definition.initialIntensityMmh + definition.intensityDeltaMmhPerStep * (stepIndex + 1);
    const trend =
      definition.intensityDeltaMmhPerStep > 0
        ? "weakening is not expected; the band is modelled as slowly strengthening"
        : definition.intensityDeltaMmhPerStep === 0
          ? "holding steady"
          : "slowly weakening";
    const distances = scenario.stations.map((station) =>
      Math.hypot(station.position.x - center.x, station.position.y - center.y)
    );

    return {
      cellId: definition.id,
      intensityMmh: roundTo(intensityMmh, 2),
      intensityTrend: `${trend} (next step about ${formatPrecipitationRate(Math.max(0, projected))})`,
      positionSummary:
        `Precipitation band centred near ${roundTo(center.x, 2)} of the region's width and ${roundTo(
          center.y,
          2
        )} of its height.`,
      motionSummary: `Modelled as moving ${describeHorizontalMotion(definition.movement)}.`,
      nearestStationDistanceNormalized: normalize(Math.min(...distances))
    };
  });

  return {
    minute: state.minute,
    timestamp: formatSimulatedTimestamp(state.minute),
    boundaries,
    airMasses: scenario.airMasses.map((airMass) => {
      const airMassState = state.airMasses.find((candidate) => candidate.id === airMass.id);
      return {
        airMassId: airMass.id,
        label: airMass.label,
        center: airMassState ? airMassState.center : airMass.initialCenter,
        motionSummary: `Modelled as drifting ${describeHorizontalMotion(airMass.movement)}.`
      };
    }),
    precipitationCells,
    stationPositions
  };
}

/** Human-readable length of an observed transition window, used in debriefs. */
export const describeTransitionWindow = (window: TransitionWindow): string =>
  `${formatDuration(window.endMinute - window.startMinute)} long, from ${formatSimulatedTimestamp(
    window.startMinute
  )} to ${formatSimulatedTimestamp(window.endMinute)}`;

