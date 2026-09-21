# Weather Command — Science Model

Status: canonical WC-01 science contract

## Authority

Weather Command is a pedagogical atmospheric model. It must be scientifically coherent for NGSS MS-ESS2-5 while remaining explainable to grades 6–8. It is not a numerical weather prediction model and does not claim operational forecast accuracy.

Primary references:

- NGSS MS-ESS2-5: https://www.nextgenscience.org/topic-arrangement/msweather-and-climate
- NWS weather education: https://www.weather.gov/education
- NWS air masses/fronts: https://www.weather.gov/jkl/education
- NWS educational resources: https://www.weather.gov/learning

The canonical model follows the NGSS emphasis on high-to-low pressure flow, changing temperature/pressure/humidity/precipitation/wind at a fixed location, sudden changes when air masses interact, and probabilistic prediction.

## Scientific state

The deterministic scenario kernel owns authoritative state. Minimum v1 state:

### Scenario time

- integer simulation step;
- step duration in scenario hours;
- no dependency on real clock time.

### Air masses

Each modeled air mass has:

- stable identifier;
- category/description;
- representative temperature tendency;
- representative moisture tendency;
- spatial extent or boundary geometry;
- bounded movement vector;
- source citation and simplification note.

The learner does not need to memorize classification codes to succeed.

### Pressure field

The model represents enough pressure information to support:

- relatively high vs low pressure;
- pressure tendency at stations;
- wind response consistent with the authored scenario;
- front movement reasoning.

v1 does not simulate full atmospheric fluid dynamics.

### Front / boundary

A front is the modeled boundary between differing air masses.

Scenario rules may include:

- boundary position;
- movement direction/speed;
- transition width;
- affected stations;
- expected temperature/moisture/wind/pressure tendencies;
- precipitation likelihood/range.

### Stations

At least three synchronized locations expose time-stamped observations:

- temperature;
- pressure;
- pressure tendency;
- relative humidity or age-appropriate moisture proxy;
- wind direction;
- wind speed;
- precipitation state/amount or probability where appropriate.

### Precipitation field

A simplified radar-style field may be derived from scenario truth. It is evidence, not independent truth. If rendered densely, presentation may use Canvas, but the underlying precipitation data remains semantic domain state.

## Front motion and station truth must agree

Station observations and front/precipitation geometry are authored separately. That separation is
useful - it keeps the presentation layer from owning science - but it lets an authored scenario place a
front far away from a station that is recording a frontal change, which would teach the wrong causal
lesson from the game's own evidence.

Binding constraint: for every station a boundary-linked effect names, the authored front motion must
place the boundary at that station inside the authored change window, and `transitionWidth` must equal
the distance the front travels across that window. The scenario validation layer enforces this and
fails closed. See `docs/SCENARIO_SCHEMA.md`.

## Determinism

Binding invariant:

**same scenario version + same seed + same action sequence = same authoritative trace**

Randomness may only represent bounded authored variation/noise. It must use a seeded PRNG inside the domain layer.

Rendering frame rate, animation duration, DOM state, SVG coordinates, device width, audio timing, and wall-clock time may not alter science state.

## Scenario schema

Each authored scenario must identify:

- `scenarioId`;
- `schemaVersion`;
- `contentVersion`;
- deterministic seed policy;
- learning objectives;
- initial state;
- station definitions;
- air-mass/boundary definitions;
- transition rules;
- allowed simulation steps;
- forecast windows;
- uncertainty/accepted ranges;
- evidence identifiers;
- debrief relationships;
- sources;
- simplifications;
- known model boundaries;
- golden expected trace.

Scenario files are untrusted authored data at runtime boundaries and must be validated before use.

## Forecast verification

Verification must not compare the learner with one hidden scalar answer.

### Evidence quality

Did the learner inspect/cite evidence that is relevant to the forecast?

### Causal consistency

Does the forecast reasoning agree with the evidence and modeled atmospheric relationships?

### Error / timing

How far is the predicted transition/range from the deterministic outcome?

### Confidence calibration

Was confidence proportionate to evidence ambiguity and eventual error?

A forecast can be scientifically defensible without exactly matching one canonical value.

## First production scenario requirements

### Guided Cold Front Shift

Expected relationships include:

- falling pressure or an authored pre-frontal pressure tendency;
- warmer/moister conditions ahead of the boundary;
- front approach;
- precipitation potential near passage;
- wind shift;
- cooler and typically drier conditions after passage;
- pressure tendency change after passage.

Values must be authored and independently reviewed rather than copied from a single real event.

### Independent Cold Front Variant

Uses the same rule family with different initial state and timing. It must not be a cosmetic reskin of the tutorial.

### Warm Front / Gradual Change

Requires distinguishable gradual evidence progression. It should not imply that every warm front produces identical precipitation or temperature change.

### Uncertain Boundary

Contains evidence that supports a range of defensible outcomes. Ambiguity is authored and bounded; truth is not randomized after forecast commitment.

## Source-register rule

Every canonical scientific relationship in shipping scenario content must carry:

- source URL/reference;
- statement of the relationship used;
- how the model simplifies it;
- whether it is learner-facing;
- reviewer status.

## Explicit omissions

Unless a future Jira decision adds scope, v1 omits:

- convection-resolving dynamics;
- cloud microphysics;
- upper-air sounding interpretation;
- severe-warning criteria;
- tropical cyclone dynamics;
- live observations;
- numerical model ensembles;
- global circulation simulation;
- safety guidance.

Omission is preferable to fake precision.

## Science review gate

WC-04 cannot close until an independent reviewer can reconstruct why each station variable changes across every golden trace and no unresolved high-severity science finding remains.
