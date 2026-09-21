import { deterministicSignedNoise } from "./deterministicNoise";
import {
  assertSaneObservation,
  assertValidKernelScenario,
  DomainScenarioError
} from "./weatherValidation";
import type {
  ForecastWindow,
  KernelScenarioDefinition,
  NormalizedPoint,
  ObservationDimension,
  ScenarioOutcomeFacts,
  ScenarioState,
  StationObservation,
  StationObservationDelta
} from "./weatherTypes";

const DOMAIN_DECIMAL_PLACES = 12;
const DOMAIN_SCALE = 10 ** DOMAIN_DECIMAL_PLACES;

const observationDimensions: readonly ObservationDimension[] = [
  "temperatureC",
  "pressureHpa",
  "pressureTendencyHpaPer3h",
  "relativeHumidityPct",
  "windDirectionDeg",
  "windSpeedMps",
  "precipitationRateMmh"
];

const canonicalNumber = (value: number): number =>
  Math.round(value * DOMAIN_SCALE) / DOMAIN_SCALE;

const normalizeDirection = (degrees: number): number =>
  canonicalNumber(((degrees % 360) + 360) % 360);

const translate = (
  point: NormalizedPoint,
  movement: NormalizedPoint,
  steps: number
): NormalizedPoint => ({
  x: canonicalNumber(point.x + movement.x * steps),
  y: canonicalNumber(point.y + movement.y * steps)
});

function progressAt(minute: number, startMinute: number, endMinute: number): number {
  if (minute <= startMinute) return 0;
  if (minute >= endMinute) return 1;
  return (minute - startMinute) / (endMinute - startMinute);
}

function applyDelta(
  base: StationObservation,
  delta: StationObservationDelta,
  progress: number
): StationObservation {
  const value = <K extends ObservationDimension>(dimension: K): number =>
    canonicalNumber(base[dimension] + (delta[dimension] ?? 0) * progress);

  return {
    temperatureC: value("temperatureC"),
    pressureHpa: value("pressureHpa"),
    pressureTendencyHpaPer3h: value("pressureTendencyHpaPer3h"),
    relativeHumidityPct: value("relativeHumidityPct"),
    windDirectionDeg: normalizeDirection(value("windDirectionDeg")),
    windSpeedMps: value("windSpeedMps"),
    precipitationRateMmh: value("precipitationRateMmh")
  };
}

function observationAt(
  scenario: KernelScenarioDefinition,
  stationId: string,
  minute: number
): StationObservation {
  const station = scenario.stations.find((candidate) => candidate.id === stationId);
  if (!station) throw new DomainScenarioError(`Unknown station "${stationId}".`);

  let observation = station.initial;
  const effects = scenario.stationEffects.filter((effect) => effect.stationId === stationId);

  for (const effect of effects) {
    const progress = progressAt(minute, effect.startMinute, effect.endMinute);
    observation = applyDelta(observation, effect.delta, progress);

    if (progress > 0 && effect.noise) {
      const noisy = { ...observation };
      for (const dimension of observationDimensions) {
        const rule = effect.noise[dimension];
        if (!rule) continue;
        const key = [
          scenario.scenarioId,
          scenario.contentVersion,
          stationId,
          effect.id,
          dimension,
          rule.key,
          minute
        ].join(":");
        noisy[dimension] = canonicalNumber(
          noisy[dimension] + deterministicSignedNoise(scenario.seed, key, rule.amplitude)
        );
      }
      observation = {
        ...noisy,
        windDirectionDeg: normalizeDirection(noisy.windDirectionDeg)
      };
    }
  }

  assertSaneObservation(observation, `station ${stationId} at minute ${minute}`);
  return observation;
}

export function stateAtMinute(
  scenario: KernelScenarioDefinition,
  minute: number
): ScenarioState {
  assertValidKernelScenario(scenario);
  const { timeline } = scenario;

  if (
    !Number.isSafeInteger(minute) ||
    minute < 0 ||
    minute > timeline.maxMinute ||
    minute % timeline.stepMinutes !== 0
  ) {
    throw new DomainScenarioError("Requested minute must be an in-range simulation step.");
  }

  const stepIndex = minute / timeline.stepMinutes;
  const stations: Record<string, StationObservation> = Object.fromEntries(
    scenario.stations.map((station) => [station.id, observationAt(scenario, station.id, minute)])
  );

  const progress =
    minute === timeline.maxMinute
      ? ({ status: "complete", completedAtMinute: minute } as const)
      : ({ status: "running" } as const);

  return {
    scenarioId: scenario.scenarioId,
    schemaVersion: scenario.schemaVersion,
    contentVersion: scenario.contentVersion,
    seed: scenario.seed,
    minute,
    stepIndex,
    stations,
    airMasses: scenario.airMasses.map((airMass) => ({
      id: airMass.id,
      center: translate(airMass.initialCenter, airMass.movement, stepIndex)
    })),
    boundaries: scenario.boundaries.map((boundary) => ({
      id: boundary.id,
      path: boundary.initialPath.map((point) =>
        translate(point, boundary.movement, stepIndex)
      )
    })),
    precipitationCells: scenario.precipitationCells.map((cell) => ({
      id: cell.id,
      center: translate(cell.initialCenter, cell.movement, stepIndex),
      intensityMmh: canonicalNumber(
        Math.max(0, cell.initialIntensityMmh + cell.intensityDeltaMmhPerStep * stepIndex)
      )
    })),
    progress
  };
}

export function initializeScenario(scenario: KernelScenarioDefinition): ScenarioState {
  return stateAtMinute(scenario, scenario.timeline.startMinute);
}

export function advanceScenario(
  scenario: KernelScenarioDefinition,
  state: ScenarioState,
  steps = 1
): ScenarioState {
  if (
    state.scenarioId !== scenario.scenarioId ||
    state.schemaVersion !== scenario.schemaVersion ||
    state.contentVersion !== scenario.contentVersion ||
    state.seed !== scenario.seed
  ) {
    throw new DomainScenarioError(
      "State does not belong to the supplied scenario identity/version/seed."
    );
  }
  if (!Number.isSafeInteger(steps) || steps <= 0) {
    throw new DomainScenarioError("advanceScenario steps must be a positive integer.");
  }

  const minute = Math.min(
    scenario.timeline.maxMinute,
    state.minute + scenario.timeline.stepMinutes * steps
  );
  return stateAtMinute(scenario, minute);
}

export function getAvailableForecastWindows(
  scenario: KernelScenarioDefinition,
  state: ScenarioState
): readonly ForecastWindow[] {
  return scenario.forecastWindows.filter(
    (window) => state.minute >= window.startMinute && state.minute < window.endMinute
  );
}

function subtractObservation(
  observed: StationObservation,
  initial: StationObservation
): StationObservation {
  return {
    temperatureC: canonicalNumber(observed.temperatureC - initial.temperatureC),
    pressureHpa: canonicalNumber(observed.pressureHpa - initial.pressureHpa),
    pressureTendencyHpaPer3h: canonicalNumber(
      observed.pressureTendencyHpaPer3h - initial.pressureTendencyHpaPer3h
    ),
    relativeHumidityPct: canonicalNumber(
      observed.relativeHumidityPct - initial.relativeHumidityPct
    ),
    windDirectionDeg: normalizeDirection(observed.windDirectionDeg - initial.windDirectionDeg),
    windSpeedMps: canonicalNumber(observed.windSpeedMps - initial.windSpeedMps),
    precipitationRateMmh: canonicalNumber(
      observed.precipitationRateMmh - initial.precipitationRateMmh
    )
  };
}

export function getScenarioOutcomeFacts(
  scenario: KernelScenarioDefinition,
  state: ScenarioState
): ScenarioOutcomeFacts {
  if (
    state.scenarioId !== scenario.scenarioId ||
    state.schemaVersion !== scenario.schemaVersion ||
    state.contentVersion !== scenario.contentVersion ||
    state.seed !== scenario.seed
  ) {
    throw new DomainScenarioError(
      "Outcome facts require state from the supplied scenario identity/version/seed."
    );
  }

  return {
    scenarioId: scenario.scenarioId,
    contentVersion: scenario.contentVersion,
    minute: state.minute,
    stationChanges: scenario.stations.map((station) => {
      const observed = state.stations[station.id];
      if (!observed) throw new DomainScenarioError(`State is missing station "${station.id}".`);
      return {
        stationId: station.id,
        fromMinute: 0,
        toMinute: state.minute,
        initial: station.initial,
        observed,
        delta: subtractObservation(observed, station.initial)
      };
    })
  };
}
