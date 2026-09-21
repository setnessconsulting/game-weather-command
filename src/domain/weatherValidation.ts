import type {
  KernelScenarioDefinition,
  NormalizedPoint,
  StationObservation
} from "./weatherTypes";

export class DomainScenarioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainScenarioError";
  }
}

const finite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) throw new DomainScenarioError(`${label} must be finite.`);
};

const bounded = (value: number, min: number, max: number, label: string): void => {
  finite(value, label);
  if (value < min || value > max) {
    throw new DomainScenarioError(`${label} must be between ${min} and ${max}.`);
  }
};

const normalizedPoint = (point: NormalizedPoint, label: string): void => {
  bounded(point.x, 0, 1, `${label}.x`);
  bounded(point.y, 0, 1, `${label}.y`);
};

export function assertSaneObservation(observation: StationObservation, label: string): void {
  bounded(observation.temperatureC, -100, 70, `${label}.temperatureC`);
  bounded(observation.pressureHpa, 800, 1100, `${label}.pressureHpa`);
  bounded(
    observation.pressureTendencyHpaPer3h,
    -50,
    50,
    `${label}.pressureTendencyHpaPer3h`
  );
  bounded(observation.relativeHumidityPct, 0, 100, `${label}.relativeHumidityPct`);
  finite(observation.windDirectionDeg, `${label}.windDirectionDeg`);
  if (observation.windDirectionDeg < 0 || observation.windDirectionDeg >= 360) {
    throw new DomainScenarioError(`${label}.windDirectionDeg must be in [0, 360).`);
  }
  bounded(observation.windSpeedMps, 0, 150, `${label}.windSpeedMps`);
  bounded(observation.precipitationRateMmh, 0, 500, `${label}.precipitationRateMmh`);
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value.trim()) throw new DomainScenarioError(`${label} contains an empty identifier.`);
    if (seen.has(value)) {
      throw new DomainScenarioError(`${label} contains duplicate id "${value}".`);
    }
    seen.add(value);
  }
}

function assertSourceRefs(refs: readonly string[], label: string): void {
  if (refs.length === 0 || refs.some((ref) => !ref.trim())) {
    throw new DomainScenarioError(`${label} requires at least one non-empty source reference.`);
  }
}

export function assertValidKernelScenario(scenario: KernelScenarioDefinition): void {
  if (scenario.schemaVersion !== "1") {
    throw new DomainScenarioError(
      `Unsupported scenario schema version "${String(scenario.schemaVersion)}".`
    );
  }
  if (!scenario.scenarioId.trim()) throw new DomainScenarioError("scenarioId is required.");
  if (!scenario.contentVersion.trim()) throw new DomainScenarioError("contentVersion is required.");
  if (!Number.isSafeInteger(scenario.seed)) throw new DomainScenarioError("seed must be a safe integer.");

  const { timeline } = scenario;
  if (timeline.startMinute !== 0) throw new DomainScenarioError("timeline.startMinute must be 0.");
  if (!Number.isSafeInteger(timeline.stepMinutes) || timeline.stepMinutes <= 0) {
    throw new DomainScenarioError("timeline.stepMinutes must be a positive integer.");
  }
  if (
    !Number.isSafeInteger(timeline.maxMinute) ||
    timeline.maxMinute <= 0 ||
    timeline.maxMinute % timeline.stepMinutes !== 0
  ) {
    throw new DomainScenarioError("timeline.maxMinute must be a positive multiple of stepMinutes.");
  }
  for (const checkpoint of timeline.checkpoints) {
    if (
      !Number.isSafeInteger(checkpoint) ||
      checkpoint < 0 ||
      checkpoint > timeline.maxMinute ||
      checkpoint % timeline.stepMinutes !== 0
    ) {
      throw new DomainScenarioError("Every timeline checkpoint must be an in-range step boundary.");
    }
  }

  if (scenario.stations.length < 3) {
    throw new DomainScenarioError("A v1 scenario requires at least three stations.");
  }

  assertUnique(scenario.stations.map((station) => station.id), "stations");
  assertUnique(scenario.airMasses.map((airMass) => airMass.id), "airMasses");
  assertUnique(scenario.boundaries.map((boundary) => boundary.id), "boundaries");
  assertUnique(scenario.precipitationCells.map((cell) => cell.id), "precipitationCells");
  assertUnique(scenario.stationEffects.map((effect) => effect.id), "stationEffects");
  assertUnique(scenario.forecastWindows.map((window) => window.id), "forecastWindows");

  const stationIds = new Set(scenario.stations.map((station) => station.id));
  const airMassIds = new Set(scenario.airMasses.map((airMass) => airMass.id));
  const boundaryIds = new Set(scenario.boundaries.map((boundary) => boundary.id));

  for (const station of scenario.stations) {
    normalizedPoint(station.position, `station ${station.id}.position`);
    assertSaneObservation(station.initial, `station ${station.id}.initial`);
  }

  for (const airMass of scenario.airMasses) {
    normalizedPoint(airMass.initialCenter, `air mass ${airMass.id}.initialCenter`);
    finite(airMass.movement.x, `air mass ${airMass.id}.movement.x`);
    finite(airMass.movement.y, `air mass ${airMass.id}.movement.y`);
    assertSourceRefs(airMass.sourceRefIds, `Air mass ${airMass.id}`);
  }

  for (const boundary of scenario.boundaries) {
    if (!airMassIds.has(boundary.airMassAId) || !airMassIds.has(boundary.airMassBId)) {
      throw new DomainScenarioError(`Boundary ${boundary.id} references an unknown air mass.`);
    }
    if (boundary.airMassAId === boundary.airMassBId) {
      throw new DomainScenarioError(`Boundary ${boundary.id} must separate two air masses.`);
    }
    if (boundary.initialPath.length < 2) {
      throw new DomainScenarioError(`Boundary ${boundary.id} requires at least two path points.`);
    }
    boundary.initialPath.forEach((point, index) =>
      normalizedPoint(point, `boundary ${boundary.id}.initialPath[${index}]`)
    );
    if (!(boundary.transitionWidth > 0 && boundary.transitionWidth <= 1)) {
      throw new DomainScenarioError(`Boundary ${boundary.id}.transitionWidth must be in (0, 1].`);
    }
    finite(boundary.movement.x, `boundary ${boundary.id}.movement.x`);
    finite(boundary.movement.y, `boundary ${boundary.id}.movement.y`);
    assertSourceRefs(boundary.sourceRefIds, `Boundary ${boundary.id}`);
  }

  for (const cell of scenario.precipitationCells) {
    normalizedPoint(cell.initialCenter, `precipitation cell ${cell.id}.initialCenter`);
    bounded(
      cell.initialIntensityMmh,
      0,
      500,
      `precipitation cell ${cell.id}.initialIntensityMmh`
    );
    finite(
      cell.intensityDeltaMmhPerStep,
      `precipitation cell ${cell.id}.intensityDeltaMmhPerStep`
    );
    assertSourceRefs(cell.sourceRefIds, `Precipitation cell ${cell.id}`);
  }

  for (const effect of scenario.stationEffects) {
    if (!stationIds.has(effect.stationId)) {
      throw new DomainScenarioError(
        `Effect ${effect.id} references unknown station "${effect.stationId}".`
      );
    }
    if (effect.boundaryId && !boundaryIds.has(effect.boundaryId)) {
      throw new DomainScenarioError(
        `Effect ${effect.id} references unknown boundary "${effect.boundaryId}".`
      );
    }
    if (
      !Number.isSafeInteger(effect.startMinute) ||
      !Number.isSafeInteger(effect.endMinute) ||
      effect.startMinute < 0 ||
      effect.endMinute <= effect.startMinute ||
      effect.endMinute > timeline.maxMinute
    ) {
      throw new DomainScenarioError(`Effect ${effect.id} has an invalid time interval.`);
    }
    if (
      effect.startMinute % timeline.stepMinutes !== 0 ||
      effect.endMinute % timeline.stepMinutes !== 0
    ) {
      throw new DomainScenarioError(`Effect ${effect.id} must align to simulation steps.`);
    }
    if (Object.values(effect.delta).every((value) => value === undefined)) {
      throw new DomainScenarioError(`Effect ${effect.id} must change at least one observation.`);
    }
    assertSourceRefs(effect.sourceRefIds, `Effect ${effect.id}`);
    for (const [dimension, rule] of Object.entries(effect.noise ?? {})) {
      if (!rule) continue;
      if (!Number.isFinite(rule.amplitude) || rule.amplitude < 0) {
        throw new DomainScenarioError(
          `Effect ${effect.id} noise ${dimension} amplitude is invalid.`
        );
      }
      if (!rule.key.trim()) {
        throw new DomainScenarioError(
          `Effect ${effect.id} noise ${dimension} requires a stable key.`
        );
      }
    }
  }

  for (const window of scenario.forecastWindows) {
    if (
      !Number.isSafeInteger(window.startMinute) ||
      !Number.isSafeInteger(window.endMinute) ||
      window.startMinute < 0 ||
      window.endMinute <= window.startMinute ||
      window.endMinute > timeline.maxMinute
    ) {
      throw new DomainScenarioError(`Forecast window ${window.id} has an invalid time interval.`);
    }
    if (
      window.startMinute % timeline.stepMinutes !== 0 ||
      window.endMinute % timeline.stepMinutes !== 0
    ) {
      throw new DomainScenarioError(`Forecast window ${window.id} must align to simulation steps.`);
    }
    if (window.targetStationIds.length === 0) {
      throw new DomainScenarioError(`Forecast window ${window.id} requires at least one station.`);
    }
    assertUnique(window.targetStationIds, `forecast window ${window.id} targetStationIds`);
    for (const stationId of window.targetStationIds) {
      if (!stationIds.has(stationId)) {
        throw new DomainScenarioError(
          `Forecast window ${window.id} references unknown station "${stationId}".`
        );
      }
    }
  }
}
