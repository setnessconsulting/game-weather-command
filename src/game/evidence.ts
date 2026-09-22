import { stateAtMinute } from "@/domain";
import type { KernelScenarioDefinition, ScenarioState, StationObservation } from "@/domain";
import type { WeatherScenarioV1 } from "@/scenarios";

import {
  buildRegionalSummary,
  buildStationSeries,
  deriveObservedTransitionWindow,
  seriesChange,
  type RegionalSummary,
  type StationSeries
} from "./observation";
import {
  formatDuration,
  formatHumidity,
  formatPrecipitationRate,
  formatPressure,
  formatPressureTendency,
  formatSignedDegrees,
  formatSignedHumidity,
  formatSignedPressure,
  formatSignedTemperature,
  formatSignedWindSpeed,
  formatSimulatedTimestamp,
  formatTemperature,
  formatWind,
  roundTo
} from "./units";

export type EvidenceKind = "station" | "trend" | "map" | "precipitation" | "boundary";

export interface EvidenceFact {
  readonly label: string;
  readonly value: string;
  readonly note?: string;
}

export interface EvidenceItem {
  readonly id: string;
  readonly kind: EvidenceKind;
  readonly title: string;
  readonly learningTags: readonly string[];
  readonly availableAtMinute: number;
  readonly timestamp: string;
  readonly targetIds: readonly string[];
  /** Semantic text equivalent of the visual representation of this evidence. */
  readonly summary: string;
  readonly facts: readonly EvidenceFact[];
}

export interface EvidenceCatalog {
  readonly minute: number;
  readonly timestamp: string;
  readonly nextUnlockMinute?: number;
  readonly unlocked: readonly EvidenceItem[];
  readonly locked: readonly {
    readonly id: string;
    readonly kind: EvidenceKind;
    readonly title: string;
    readonly availableAtMinute: number;
  }[];
}

const kindTitles: Record<EvidenceKind, string> = {
  station: "Station readings",
  trend: "Station trends",
  map: "Regional context",
  precipitation: "Precipitation band",
  boundary: "Front position and motion"
};

export function describeObservationFacts(observation: StationObservation): readonly EvidenceFact[] {
  return [
    { label: "Temperature", value: formatTemperature(observation.temperatureC) },
    { label: "Pressure", value: formatPressure(observation.pressureHpa) },
    {
      label: "Pressure tendency",
      value: formatPressureTendency(observation.pressureTendencyHpaPer3h),
      note: "Tendency describes the recent trend reported by the station, not the level."
    },
    { label: "Humidity", value: formatHumidity(observation.relativeHumidityPct) },
    {
      label: "Wind",
      value: formatWind(observation.windDirectionDeg, observation.windSpeedMps),
      note: "Direction is the direction the wind blows from."
    },
    { label: "Precipitation now", value: formatPrecipitationRate(observation.precipitationRateMmh) }
  ];
}

function stationFacts(
  scenario: WeatherScenarioV1,
  kernel: KernelScenarioDefinition,
  state: ScenarioState,
  stationIds: readonly string[]
): readonly EvidenceFact[] {
  const facts: EvidenceFact[] = [];
  for (const stationId of stationIds) {
    const station = scenario.stations.find((candidate) => candidate.id === stationId);
    if (!station) continue;
    const current = state.stations[stationId];
    if (!current) continue;

    facts.push({ label: `${station.name} — reported at ${formatSimulatedTimestamp(state.minute)}`, value: "current readings" });
    for (const fact of describeObservationFacts(current)) {
      facts.push({ label: `${station.name} · ${fact.label}`, value: fact.value, ...(fact.note ? { note: fact.note } : {}) });
    }
    if (state.minute > 0) {
      const series = buildStationSeries(kernel, stationId, state.minute);
      const change = seriesChange(series);
      facts.push({
        label: `${station.name} · change since ${formatSimulatedTimestamp(0)}`,
        value: `${formatSignedTemperature(change.temperatureC)}, ${formatSignedPressure(
          change.pressureHpa
        )}, ${formatSignedHumidity(change.relativeHumidityPct)}, wind ${formatSignedDegrees(
          change.windDirectionDeg
        )}, ${formatSignedWindSpeed(change.windSpeedMps)}`,
        note: "Change is compared with the first reading of the mission."
      });
    }
  }
  return facts;
}

function describeSeriesTrend(series: StationSeries): { headline: string; facts: readonly EvidenceFact[] } {
  const change = seriesChange(series);
  const window = deriveObservedTransitionWindow(series);
  const facts: EvidenceFact[] = [];
  const readings = series.points.length;

  facts.push({
    label: `${series.stationName} · readings used`,
    value: `${readings} readings, one every ${series.stepMinutes} min`,
    note: "A trend needs more than one reading; advance the simulated clock to extend it."
  });
  facts.push({
    label: `${series.stationName} · temperature trend`,
    value: `${formatSignedTemperature(change.temperatureC)} over ${formatDuration(
      series.points.length > 1 ? series.points[series.points.length - 1]!.minute - series.points[0]!.minute : 0
    )}`
  });
  facts.push({
    label: `${series.stationName} · pressure trend`,
    value: `${formatSignedPressure(change.pressureHpa)} over the same period, tendency now ${formatPressureTendency(
      series.points[series.points.length - 1]!.observation.pressureTendencyHpaPer3h
    )}`
  });
  facts.push({
    label: `${series.stationName} · wind trend`,
    value: `${formatSignedDegrees(change.windDirectionDeg)}, ${formatSignedWindSpeed(change.windSpeedMps)}`
  });
  facts.push({
    label: `${series.stationName} · fastest change so far`,
    value: window
      ? `${formatSimulatedTimestamp(window.startMinute)} to ${formatSimulatedTimestamp(window.endMinute)}`
      : "no sustained temperature change detected yet",
    note: "This is the fastest sustained change in the station record so far, which is where a front has most likely arrived."
  });

  const headline =
    window === undefined
      ? `${series.stationName}: ${formatSignedTemperature(change.temperatureC)} since the first reading, with no sustained change yet.`
      : `${series.stationName}: the fastest change so far was between ${formatSimulatedTimestamp(
          window.startMinute
        )} and ${formatSimulatedTimestamp(window.endMinute)} (${formatSignedTemperature(change.temperatureC)} overall).`;

  return { headline, facts };
}

function boundaryFacts(summary: RegionalSummary, boundaryIds: readonly string[]): readonly EvidenceFact[] {
  const facts: EvidenceFact[] = [];
  for (const boundaryId of boundaryIds) {
    const boundary = summary.boundaries.find((candidate) => candidate.boundaryId === boundaryId);
    if (!boundary) continue;
    facts.push({ label: `${boundary.kindLabel} · position`, value: boundary.positionSummary });
    facts.push({ label: `${boundary.kindLabel} · motion`, value: boundary.motionSummary });
    for (const proximity of boundary.proximity) {
      facts.push({
        label: `${boundary.kindLabel} → ${proximity.stationName}`,
        value:
          proximity.etaMinutes !== undefined
            ? `extrapolated arrival ${formatSimulatedTimestamp(proximity.etaMinutes)}`
            : "no arrival extrapolated",
        note: proximity.note
      });
    }
  }
  return facts;
}

function precipitationFacts(summary: RegionalSummary, cellIds: readonly string[]): readonly EvidenceFact[] {
  const facts: EvidenceFact[] = [];
  for (const cellId of cellIds) {
    const cell = summary.precipitationCells.find((candidate) => candidate.cellId === cellId);
    if (!cell) continue;
    facts.push({
      label: "Intensity",
      value: formatPrecipitationRate(cell.intensityMmh),
      note: cell.intensityTrend
    });
    facts.push({ label: "Position", value: cell.positionSummary });
    facts.push({ label: "Motion", value: cell.motionSummary });
    facts.push({
      label: "Closest station",
      value: `${Math.round(cell.nearestStationDistanceNormalized * 100)} % of the region's diagonal away`
    });
  }
  return facts;
}

function mapFacts(summary: RegionalSummary): readonly EvidenceFact[] {
  const facts: EvidenceFact[] = [];
  for (const station of summary.stationPositions) {
    facts.push({ label: `${station.stationName} · location`, value: station.description });
  }
  for (const airMass of summary.airMasses) {
    facts.push({ label: `Air mass · ${airMass.label}`, value: airMass.motionSummary });
  }
  for (const boundary of summary.boundaries) {
    facts.push({ label: `${boundary.kindLabel} · overview`, value: `${boundary.positionSummary} ${boundary.motionSummary}` });
  }
  for (const cell of summary.precipitationCells) {
    facts.push({ label: "Precipitation band · overview", value: `${cell.positionSummary} ${cell.motionSummary}` });
  }
  return facts;
}

function summaryFor(
  kind: EvidenceKind,
  scenario: WeatherScenarioV1,
  state: ScenarioState,
  targetIds: readonly string[],
  regional: RegionalSummary
): string {
  const stationNames = (ids: readonly string[]): string =>
    ids
      .map((id) => scenario.stations.find((station) => station.id === id)?.name ?? id)
      .join(", ");

  switch (kind) {
    case "station":
      return `Current instrument readings at ${stationNames(targetIds)}, valid at ${regional.timestamp}.`;
    case "trend":
      return `How each of ${stationNames(targetIds)} has changed since the first reading, including the fastest change detected so far.`;
    case "boundary":
      return `Where the front sits and where it is heading, plus a rough extrapolated arrival for each station.`;
    case "precipitation":
      return `Extent, intensity and motion of the precipitation band associated with this system at ${regional.timestamp}.`;
    case "map":
      return `Whole-region snapshot at ${regional.timestamp}: station locations, air masses, boundaries and precipitation bands.`;
    default:
      return `Evidence at ${regional.timestamp}.`;
  }
}

/**
 * Builds the evidence catalog visible at a simulated minute.
 * Only evidence whose `availableAtMinute` has been reached is exposed; nothing about the
 * scenario's authored answer or accepted ranges is included here.
 */
export function buildEvidenceCatalog(
  scenario: WeatherScenarioV1,
  kernel: KernelScenarioDefinition,
  state: ScenarioState
): EvidenceCatalog {
  const regional = buildRegionalSummary(scenario, kernel, state);

  const unlocked: EvidenceItem[] = [];
  const locked: {
    id: string;
    kind: EvidenceKind;
    title: string;
    availableAtMinute: number;
  }[] = [];

  for (const definition of scenario.evidence) {
    if (definition.availableAtMinute > state.minute) {
      locked.push({
        id: definition.id,
        kind: definition.type,
        title: `${kindTitles[definition.type]} — ${definition.targetIds.join(", ")}`,
        availableAtMinute: definition.availableAtMinute
      });
      continue;
    }

    const facts: readonly EvidenceFact[] =
      definition.type === "station" || definition.type === "trend"
        ? definition.type === "station"
          ? stationFacts(scenario, kernel, state, definition.targetIds)
          : definition.targetIds.flatMap((stationId) => {
              const station = scenario.stations.find((candidate) => candidate.id === stationId);
              if (!station) return [];
              return describeSeriesTrend(buildStationSeries(kernel, stationId, state.minute)).facts;
            })
        : definition.type === "boundary"
          ? boundaryFacts(regional, definition.targetIds)
          : definition.type === "precipitation"
            ? precipitationFacts(regional, definition.targetIds)
            : mapFacts(regional);

    let summary = summaryFor(definition.type, scenario, state, definition.targetIds, regional);
    if (definition.type === "trend") {
      summary = definition.targetIds
        .flatMap((stationId) => {
          const station = scenario.stations.find((candidate) => candidate.id === stationId);
          if (!station) return [];
          return [describeSeriesTrend(buildStationSeries(kernel, stationId, state.minute)).headline];
        })
        .join(" ");
    }

    unlocked.push({
      id: definition.id,
      kind: definition.type,
      title:
        definition.type === "station"
          ? `${kindTitles.station} — ${definition.targetIds
              .map((id) => scenario.stations.find((station) => station.id === id)?.name ?? id)
              .join(", ")}`
          : definition.type === "boundary"
            ? `${kindTitles.boundary} — ${definition.targetIds
                .map((id) => scenario.boundaries.find((boundary) => boundary.id === id)?.kind ?? id)
                .join(", ")}`
            : kindTitles[definition.type],
      learningTags: definition.learningTags,
      availableAtMinute: definition.availableAtMinute,
      timestamp: formatSimulatedTimestamp(definition.availableAtMinute),
      targetIds: definition.targetIds,
      summary,
      facts
    });
  }

  const nextUnlockMinute = locked.reduce<number | undefined>(
    (earliest, item) =>
      item.availableAtMinute % kernel.timeline.stepMinutes !== 0
        ? earliest
        : earliest === undefined
          ? item.availableAtMinute
          : Math.min(earliest, item.availableAtMinute),
    undefined
  );

  return {
    minute: state.minute,
    timestamp: formatSimulatedTimestamp(state.minute),
    ...(nextUnlockMinute !== undefined ? { nextUnlockMinute } : {}),
    unlocked,
    locked
  };
}

/**
 * Snapshot of a station at a minute, used by verification and debrief surfaces.
 * Kept here so presentation never reaches into the kernel directly.
 */
export function observationAt(
  kernel: KernelScenarioDefinition,
  minute: number,
  stationId: string
): StationObservation {
  return stateAtMinute(kernel, minute).stations[stationId]!;
}

export const roundEvidenceValue = roundTo;
