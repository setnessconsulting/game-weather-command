import { z } from "zod";

import {
  assertScenarioCoherence,
  assertValidKernelScenario,
  type KernelScenarioDefinition,
  type StationEffectRule,
} from "@/domain";

const normalizedCoordinate = z.number().min(0).max(1);
const nonEmptyId = z.string().trim().min(1);
const sourceRefIdsSchema = z.array(nonEmptyId).min(1);

export const foundationStationSchema = z.object({
  id: nonEmptyId,
  name: z.string().min(1),
  position: z.object({ x: normalizedCoordinate, y: normalizedCoordinate }),
});

export const foundationScenarioSchema = z.object({
  schemaVersion: z.literal("1"),
  contentVersion: z.string().min(1),
  scenarioId: z.string().min(1),
  title: z.string().min(1),
  seed: z.number().int(),
  stations: z.array(foundationStationSchema).min(3),
});

export type FoundationScenario = z.infer<typeof foundationScenarioSchema>;

export function parseFoundationScenario(input: unknown): FoundationScenario {
  return foundationScenarioSchema.parse(input);
}

const normalizedPointSchema = z.object({
  x: normalizedCoordinate,
  y: normalizedCoordinate,
});

const stationObservationSchema = z.object({
  temperatureC: z.number().min(-100).max(70),
  pressureHpa: z.number().min(800).max(1100),
  pressureTendencyHpaPer3h: z.number().min(-50).max(50),
  relativeHumidityPct: z.number().min(0).max(100),
  windDirectionDeg: z.number().min(0).lt(360),
  windSpeedMps: z.number().min(0).max(150),
  precipitationRateMmh: z.number().min(0).max(500),
});

const stationDefinitionSchema = z.object({
  id: nonEmptyId,
  name: z.string().trim().min(1),
  position: normalizedPointSchema,
  initial: stationObservationSchema,
});

const airMassDefinitionSchema = z.object({
  id: nonEmptyId,
  label: z.string().trim().min(1),
  initialCenter: normalizedPointSchema,
  movement: z.object({ x: z.number().finite(), y: z.number().finite() }),
  sourceRefIds: sourceRefIdsSchema,
});

const boundaryDefinitionSchema = z.object({
  id: nonEmptyId,
  kind: z.enum(["cold-front", "warm-front", "other-bounded-transition"]),
  airMassAId: nonEmptyId,
  airMassBId: nonEmptyId,
  initialPath: z.array(normalizedPointSchema).min(2),
  movement: z.object({ x: z.number().finite(), y: z.number().finite() }),
  transitionWidth: z.number().gt(0).max(1),
  sourceRefIds: sourceRefIdsSchema,
});

const precipitationCellDefinitionSchema = z.object({
  id: nonEmptyId,
  initialCenter: normalizedPointSchema,
  movement: z.object({ x: z.number().finite(), y: z.number().finite() }),
  initialIntensityMmh: z.number().min(0).max(500),
  intensityDeltaMmhPerStep: z.number().finite(),
  sourceRefIds: sourceRefIdsSchema,
});

const stationObservationDeltaSchema = z.object({
  temperatureC: z.number().optional(),
  pressureHpa: z.number().optional(),
  pressureTendencyHpaPer3h: z.number().optional(),
  relativeHumidityPct: z.number().optional(),
  windDirectionDeg: z.number().optional(),
  windSpeedMps: z.number().optional(),
  precipitationRateMmh: z.number().optional(),
}).refine(
  (value) => Object.values(value).some((dimension) => dimension !== undefined),
  "station effect must change at least one observation",
);

const noiseRuleSchema = z.object({
  amplitude: z.number().min(0),
  key: nonEmptyId,
});

const stationEffectSchema = z.object({
  id: nonEmptyId,
  stationId: nonEmptyId,
  boundaryId: nonEmptyId.optional(),
  startMinute: z.number().int().min(0),
  endMinute: z.number().int().positive(),
  delta: stationObservationDeltaSchema,
  noise: z.object({
    temperatureC: noiseRuleSchema.optional(),
    pressureHpa: noiseRuleSchema.optional(),
    pressureTendencyHpaPer3h: noiseRuleSchema.optional(),
    relativeHumidityPct: noiseRuleSchema.optional(),
    windDirectionDeg: noiseRuleSchema.optional(),
    windSpeedMps: noiseRuleSchema.optional(),
    precipitationRateMmh: noiseRuleSchema.optional(),
  }).optional(),
  sourceRefIds: sourceRefIdsSchema,
});

const forecastWindowSchema = z.object({
  id: nonEmptyId,
  targetStationIds: z.array(nonEmptyId).min(1),
  startMinute: z.number().int().min(0),
  endMinute: z.number().int().positive(),
});

export const scienceSourceSchema = z.object({
  id: nonEmptyId,
  url: z.string().url(),
  relationship: z.string().trim().min(1),
  usage: z.string().trim().min(1),
  reviewed: z.boolean(),
});

export const evidenceDefinitionSchema = z.object({
  id: nonEmptyId,
  type: z.enum(["station", "trend", "map", "precipitation", "boundary"]),
  availableAtMinute: z.number().int().min(0),
  targetIds: z.array(nonEmptyId).min(1),
  learningTags: z.array(nonEmptyId).min(1),
});

const numericRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
}).refine((range) => range.min <= range.max, "range min must be <= max");

const percentageRangeSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
}).refine((range) => range.min <= range.max, "percentage range min must be <= max");

export const acceptedRangeSchema = z.object({
  id: nonEmptyId,
  forecastWindowId: nonEmptyId,
  targetStationId: nonEmptyId,
  transitionArrivalMinute: numericRangeSchema,
  temperatureChangeC: numericRangeSchema,
  precipitationProbabilityPct: percentageRangeSchema,
  windDirectionSectorsDeg: z.array(z.object({
    min: z.number().min(0).lt(360),
    max: z.number().gt(0).max(360),
  }).refine((sector) => sector.min < sector.max, "wind sector min must be < max")).min(1),
  defensibleConfidence: z.array(z.enum(["low", "medium", "high"])).min(1),
});

export const debriefRelationshipSchema = z.object({
  id: nonEmptyId,
  evidenceIds: z.array(nonEmptyId).min(1),
  outcomeDimensions: z.array(z.enum([
    "temperature",
    "pressure",
    "moisture",
    "wind",
    "precipitation",
    "timing",
    "uncertainty",
  ])).min(1),
  explanation: z.string().trim().min(1),
  sourceRefIds: sourceRefIdsSchema,
});

export const modelBoundarySchema = z.object({
  id: nonEmptyId,
  description: z.string().trim().min(1),
  learnerFacing: z.boolean(),
});

export const weatherScenarioV1Schema = z.object({
  schemaVersion: z.literal("1"),
  contentVersion: nonEmptyId,
  scenarioId: nonEmptyId,
  title: z.string().trim().min(1),
  missionType: z.enum([
    "guided-cold-front",
    "independent-cold-front",
    "warm-front",
    "uncertain-boundary",
  ]),
  objective: z.string().trim().min(1),
  learningObjectives: z.array(z.string().trim().min(1)).min(1),
  seed: z.number().int(),
  scienceReviewStatus: z.enum(["pending-independent", "independent-reviewed"]),
  timeline: z.object({
    startMinute: z.literal(0),
    stepMinutes: z.number().int().positive(),
    maxMinute: z.number().int().positive(),
    checkpoints: z.array(z.number().int().min(0)),
  }),
  stations: z.array(stationDefinitionSchema).min(3),
  airMasses: z.array(airMassDefinitionSchema).min(2),
  boundaries: z.array(boundaryDefinitionSchema).min(1),
  precipitationCells: z.array(precipitationCellDefinitionSchema),
  stationEffects: z.array(stationEffectSchema).min(1),
  forecastWindows: z.array(forecastWindowSchema).min(1),
  evidence: z.array(evidenceDefinitionSchema).min(1),
  acceptedRanges: z.array(acceptedRangeSchema).min(1),
  debrief: z.array(debriefRelationshipSchema).min(1),
  sources: z.array(scienceSourceSchema).min(1),
  simplifications: z.array(modelBoundarySchema).min(1),
});

export type WeatherScenarioV1 = z.infer<typeof weatherScenarioV1Schema>;

function assertUniqueIds(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must contain unique IDs.`);
  }
}

function compactDefined<T extends Record<string, unknown>>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

export function toKernelScenario(scenario: WeatherScenarioV1): KernelScenarioDefinition {
  const stationEffects: StationEffectRule[] = scenario.stationEffects.map((effect) => ({
    id: effect.id,
    stationId: effect.stationId,
    startMinute: effect.startMinute,
    endMinute: effect.endMinute,
    delta: compactDefined(effect.delta) as StationEffectRule["delta"],
    sourceRefIds: effect.sourceRefIds,
    ...(effect.boundaryId !== undefined ? { boundaryId: effect.boundaryId } : {}),
    ...(effect.noise !== undefined
      ? {
          noise: compactDefined(effect.noise) as NonNullable<StationEffectRule["noise"]>,
        }
      : {}),
  }));

  return {
    schemaVersion: scenario.schemaVersion,
    contentVersion: scenario.contentVersion,
    scenarioId: scenario.scenarioId,
    seed: scenario.seed,
    timeline: scenario.timeline,
    stations: scenario.stations,
    airMasses: scenario.airMasses,
    boundaries: scenario.boundaries,
    precipitationCells: scenario.precipitationCells,
    stationEffects,
    forecastWindows: scenario.forecastWindows,
  };
}

export function parseWeatherScenario(input: unknown): WeatherScenarioV1 {
  const scenario = weatherScenarioV1Schema.parse(input);

  assertUniqueIds(scenario.sources.map((source) => source.id), "sources");
  assertUniqueIds(scenario.evidence.map((evidence) => evidence.id), "evidence");
  assertUniqueIds(scenario.acceptedRanges.map((range) => range.id), "acceptedRanges");
  assertUniqueIds(scenario.debrief.map((relationship) => relationship.id), "debrief");

  const sourceIds = new Set(scenario.sources.map((source) => source.id));
  const evidenceIds = new Set(scenario.evidence.map((evidence) => evidence.id));
  const stationIds = new Set(scenario.stations.map((station) => station.id));
  const boundaryIds = new Set(scenario.boundaries.map((boundary) => boundary.id));
  const precipitationCellIds = new Set(scenario.precipitationCells.map((cell) => cell.id));
  const forecastWindows = new Map(scenario.forecastWindows.map((window) => [window.id, window]));

  const sourceRefGroups = [
    ...scenario.airMasses.map((item) => item.sourceRefIds),
    ...scenario.boundaries.map((item) => item.sourceRefIds),
    ...scenario.precipitationCells.map((item) => item.sourceRefIds),
    ...scenario.stationEffects.map((item) => item.sourceRefIds),
    ...scenario.debrief.map((item) => item.sourceRefIds),
  ];
  for (const refs of sourceRefGroups) {
    for (const ref of refs) {
      if (!sourceIds.has(ref)) throw new Error(`Unknown science source reference "${ref}".`);
    }
  }

  for (const evidence of scenario.evidence) {
    if (
      evidence.availableAtMinute > scenario.timeline.maxMinute ||
      evidence.availableAtMinute % scenario.timeline.stepMinutes !== 0
    ) {
      throw new Error(`Evidence ${evidence.id} must be available on an in-range simulation step.`);
    }
    const targetSet =
      evidence.type === "boundary"
        ? boundaryIds
        : evidence.type === "precipitation"
          ? precipitationCellIds
          : evidence.type === "station" || evidence.type === "trend"
            ? stationIds
            : new Set([...stationIds, ...boundaryIds, ...precipitationCellIds]);
    for (const targetId of evidence.targetIds) {
      if (!targetSet.has(targetId)) {
        throw new Error(`Evidence ${evidence.id} references unknown target "${targetId}".`);
      }
    }
  }

  for (const range of scenario.acceptedRanges) {
    const forecastWindow = forecastWindows.get(range.forecastWindowId);
    if (!forecastWindow) {
      throw new Error(`Accepted range ${range.id} references an unknown forecast window.`);
    }
    if (!stationIds.has(range.targetStationId)) {
      throw new Error(`Accepted range ${range.id} references an unknown station.`);
    }
    if (!forecastWindow.targetStationIds.includes(range.targetStationId)) {
      throw new Error(`Accepted range ${range.id} targets a station outside its forecast window.`);
    }
    if (
      range.transitionArrivalMinute.min < forecastWindow.startMinute ||
      range.transitionArrivalMinute.max > forecastWindow.endMinute
    ) {
      throw new Error(`Accepted range ${range.id} timing must fit its forecast window.`);
    }
  }

  for (const relationship of scenario.debrief) {
    for (const evidenceId of relationship.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) {
        throw new Error(`Debrief ${relationship.id} references unknown evidence "${evidenceId}".`);
      }
    }
  }

  const kernelScenario = toKernelScenario(scenario);
  assertValidKernelScenario(kernelScenario);
  // Front motion and station change windows are authored independently; fail closed
  // rather than shipping a map that disagrees with the station truth.
  assertScenarioCoherence(kernelScenario);
  return scenario;
}
