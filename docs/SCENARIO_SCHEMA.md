# Weather Command — Scenario Schema Contract

Status: binding WC-01 authored-content contract

This document defines the v1 shape that WC-03/WC-04 must implement. The eventual Zod schema may refine field names, but it must preserve these semantics without introducing hidden scientific authority in presentation code.

## Versioning

Every scenario has:

- `schemaVersion` — structural contract version;
- `contentVersion` — science/content revision;
- `scenarioId` — stable identifier;
- `seedPolicy` — deterministic seed or permitted seed family.

Unsupported schema versions fail closed.

## Units

Canonical domain units:

- temperature: degrees Celsius;
- pressure: hPa;
- relative humidity: percent [0, 100];
- wind speed: m/s;
- wind direction: degrees clockwise from north [0, 360);
- precipitation rate, when modeled quantitatively: mm/h;
- scenario time: integer minutes from scenario start;
- map coordinates: normalized scenario coordinates, not screen pixels.

UI may display localized/learner-friendly units, but conversion is presentation logic. Domain truth remains canonical.

## Top-level shape

Illustrative TypeScript contract:

```ts
interface WeatherScenarioV1 {
  schemaVersion: "1";
  contentVersion: string;
  scenarioId: string;
  title: string;
  missionType:
    | "guided-cold-front"
    | "independent-cold-front"
    | "warm-front"
    | "uncertain-boundary";
  learningObjectives: string[];
  seedPolicy: SeedPolicy;
  timeline: TimelineDefinition;
  stations: StationDefinition[];
  airMasses: AirMassDefinition[];
  boundaries: BoundaryDefinition[];
  precipitation?: PrecipitationDefinition;
  forecastWindows: ForecastWindow[];
  evidence: EvidenceDefinition[];
  acceptedRanges: AcceptedRangeDefinition[];
  debrief: DebriefDefinition;
  sources: ScienceSource[];
  simplifications: ModelBoundary[];
}
```

## Timeline

```ts
interface TimelineDefinition {
  startMinute: 0;
  stepMinutes: number;
  maxMinute: number;
  checkpoints: number[];
}
```

Rules:
- all values are integers;
- `stepMinutes > 0`;
- max/checkpoints are divisible by step size;
- no wall-clock timestamp controls transitions.

## Stations

```ts
interface StationDefinition {
  id: string;
  name: string;
  position: { x: number; y: number };
  initial: StationObservation;
}

interface StationObservation {
  temperatureC: number;
  pressureHpa: number;
  pressureTendencyHpaPer3h: number;
  relativeHumidityPct: number;
  windDirectionDeg: number;
  windSpeedMps: number;
  precipitationRateMmh?: number;
}
```

Scenario transition rules determine later observations. Authors do not hand-edit contradictory visual-only values.

## Air masses

```ts
interface AirMassDefinition {
  id: string;
  label: string;
  temperatureClass: "cold" | "cool" | "warm";
  moistureClass: "dry" | "moist";
  movement: {
    dxPerStep: number;
    dyPerStep: number;
  };
  sourceRefIds: string[];
}
```

Classification codes such as cP/mT may be included as optional educational metadata, never required for success.

## Boundaries/fronts

```ts
interface BoundaryDefinition {
  id: string;
  kind: "cold-front" | "warm-front" | "other-bounded-transition";
  airMassAId: string;
  airMassBId: string;
  initialPath: NormalizedPoint[];
  movement: {
    dxPerStep: number;
    dyPerStep: number;
  };
  transitionWidth: number;
  stationEffects: StationEffectRule[];
}
```

A boundary rule must be explainable and source-backed.

## Precipitation

Precipitation may be modeled as:
- authored cells/regions;
- a deterministic field derived from boundary/moisture rules;
- a small set of semantic intensity bands.

The data model is independent of whether SVG or Canvas renders it.

## Forecast windows

```ts
interface ForecastWindow {
  id: string;
  targetStationIds: string[];
  startMinute: number;
  endMinute: number;
  requiredDimensions: Array<
    | "temperature"
    | "precipitation"
    | "wind"
    | "transition-timing"
    | "confidence"
  >;
}
```

## Evidence

Evidence is addressable by stable ID so the learner can cite it without free text.

```ts
interface EvidenceDefinition {
  id: string;
  type: "station" | "trend" | "map" | "precipitation" | "boundary";
  availableAtMinute: number;
  targetIds: string[];
  learningTags: string[];
}
```

The UI must not encode "correct evidence" as a learner-visible flag.

## Accepted forecast ranges

Accepted ranges are used for explainable verification, not a hidden winner flag.

Examples:
- transition arrival minute range;
- temperature-change range;
- precipitation probability band;
- wind-direction sector;
- confidence calibration expectation.

The verifier must preserve raw error/difference facts for debrief.

## Uncertain Boundary rule

The uncertain mission may define overlapping defensible forecast ranges.

It must not:
- randomly choose truth after forecast commit;
- mark one precise value as secretly correct;
- reward low confidence regardless of evidence.

## Debrief

Debrief definitions link:
- evidence IDs;
- modeled relationships;
- observable outcome facts;
- learner-facing explanation fragments.

The debrief renderer composes from domain facts; it does not invent post-hoc scientific explanations.

## Science sources

```ts
interface ScienceSource {
  id: string;
  url: string;
  relationship: string;
  usage: string;
  reviewed: boolean;
}
```

## Model boundaries

```ts
interface ModelBoundary {
  id: string;
  description: string;
  learnerFacing: boolean;
}
```

## Validation invariants

At minimum:
- IDs unique within scenario;
- all references resolve;
- station positions normalized and bounded;
- physical-value ranges sane;
- timeline values valid;
- forecast windows fit timeline;
- every effect/source relationship has a source or explicit pedagogical simplification;
- uncertain accepted ranges are internally coherent;
- golden trace can run from initial state to completion.

## Golden trace identity

Golden-trace fixtures are keyed by:
- scenario ID;
- schema version;
- content version;
- seed;
- action sequence.

Changing canonical science content requires a content-version change and trace re-review.
