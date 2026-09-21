export type ScenarioSchemaVersion = "1";

export interface NormalizedPoint {
  readonly x: number;
  readonly y: number;
}

export interface StationObservation {
  readonly temperatureC: number;
  readonly pressureHpa: number;
  readonly pressureTendencyHpaPer3h: number;
  readonly relativeHumidityPct: number;
  readonly windDirectionDeg: number;
  readonly windSpeedMps: number;
  readonly precipitationRateMmh: number;
}

export interface StationDefinition {
  readonly id: string;
  readonly name: string;
  readonly position: NormalizedPoint;
  readonly initial: StationObservation;
}

export interface AirMassDefinition {
  readonly id: string;
  readonly label: string;
  readonly initialCenter: NormalizedPoint;
  readonly movement: NormalizedPoint;
  readonly sourceRefIds: readonly string[];
}

export interface BoundaryDefinition {
  readonly id: string;
  readonly kind: "cold-front" | "warm-front" | "other-bounded-transition";
  readonly airMassAId: string;
  readonly airMassBId: string;
  readonly initialPath: readonly NormalizedPoint[];
  readonly movement: NormalizedPoint;
  readonly transitionWidth: number;
  readonly sourceRefIds: readonly string[];
}

export interface PrecipitationCellDefinition {
  readonly id: string;
  readonly initialCenter: NormalizedPoint;
  readonly movement: NormalizedPoint;
  readonly initialIntensityMmh: number;
  readonly intensityDeltaMmhPerStep: number;
  readonly sourceRefIds: readonly string[];
}

export type ObservationDimension = keyof StationObservation;

export interface ObservationNoiseRule {
  readonly amplitude: number;
  readonly key: string;
}

export interface StationObservationDelta {
  readonly temperatureC?: number;
  readonly pressureHpa?: number;
  readonly pressureTendencyHpaPer3h?: number;
  readonly relativeHumidityPct?: number;
  readonly windDirectionDeg?: number;
  readonly windSpeedMps?: number;
  readonly precipitationRateMmh?: number;
}

export interface StationEffectRule {
  readonly id: string;
  readonly stationId: string;
  readonly boundaryId?: string;
  readonly startMinute: number;
  readonly endMinute: number;
  readonly delta: StationObservationDelta;
  readonly noise?: Partial<Record<ObservationDimension, ObservationNoiseRule>>;
  readonly sourceRefIds: readonly string[];
}

export interface ForecastWindow {
  readonly id: string;
  readonly targetStationIds: readonly string[];
  readonly startMinute: number;
  readonly endMinute: number;
}

export interface TimelineDefinition {
  readonly startMinute: 0;
  readonly stepMinutes: number;
  readonly maxMinute: number;
  readonly checkpoints: readonly number[];
}

export interface KernelScenarioDefinition {
  readonly schemaVersion: ScenarioSchemaVersion;
  readonly contentVersion: string;
  readonly scenarioId: string;
  readonly seed: number;
  readonly timeline: TimelineDefinition;
  readonly stations: readonly StationDefinition[];
  readonly airMasses: readonly AirMassDefinition[];
  readonly boundaries: readonly BoundaryDefinition[];
  readonly precipitationCells: readonly PrecipitationCellDefinition[];
  readonly stationEffects: readonly StationEffectRule[];
  readonly forecastWindows: readonly ForecastWindow[];
}

export interface AirMassState {
  readonly id: string;
  readonly center: NormalizedPoint;
}

export interface BoundaryState {
  readonly id: string;
  readonly path: readonly NormalizedPoint[];
}

export interface PrecipitationCellState {
  readonly id: string;
  readonly center: NormalizedPoint;
  readonly intensityMmh: number;
}

export type ScenarioProgress =
  | { readonly status: "running" }
  | { readonly status: "complete"; readonly completedAtMinute: number };

export interface ScenarioState {
  readonly scenarioId: string;
  readonly schemaVersion: ScenarioSchemaVersion;
  readonly contentVersion: string;
  readonly seed: number;
  readonly minute: number;
  readonly stepIndex: number;
  readonly stations: Readonly<Record<string, StationObservation>>;
  readonly airMasses: readonly AirMassState[];
  readonly boundaries: readonly BoundaryState[];
  readonly precipitationCells: readonly PrecipitationCellState[];
  readonly progress: ScenarioProgress;
}

export interface StationObservationChange {
  readonly temperatureC: number;
  readonly pressureHpa: number;
  readonly pressureTendencyHpaPer3h: number;
  readonly relativeHumidityPct: number;
  readonly windDirectionDeg: number;
  readonly windSpeedMps: number;
  readonly precipitationRateMmh: number;
}

export interface StationChangeFact {
  readonly stationId: string;
  readonly fromMinute: number;
  readonly toMinute: number;
  readonly initial: StationObservation;
  readonly observed: StationObservation;
  /** Signed changes; windDirectionDeg is the shortest signed angular change in [-180, 180). */
  readonly delta: StationObservationChange;
}

export interface ScenarioOutcomeFacts {
  readonly scenarioId: string;
  readonly contentVersion: string;
  readonly minute: number;
  readonly stationChanges: readonly StationChangeFact[];
}
