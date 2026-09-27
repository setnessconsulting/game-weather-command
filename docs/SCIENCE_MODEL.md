# Weather Command — Science Model

Status: canonical WC-01 science contract

## Authority

Weather Command is a pedagogical atmospheric model. It must be scientifically coherent for NGSS MS-ESS2-5 while remaining explainable to grades 6–8. It is not a numerical weather prediction model and does not claim operational forecast accuracy.

Primary references:

- NGSS MS-ESS2-5: https://www.nextgenscience.org/pe/ms-ess2-5-earths-systems
- NWS air masses/fronts ("Basic Discussion on Pressure"): https://www.weather.gov/lmk/basic-fronts
- NOAA/NESDIS weather-map education: https://www.nesdis.noaa.gov/about/k-12-education/weather-forecasting/how-read-weather-map

The canonical source register in `src/scenarios/scienceSources.ts` is the authoritative per-relationship
mapping; these URLs are the primary references it resolves to.

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

In the canonical Front Passage content the direction of derivation is binding: **station precipitation
is computed from the authored band geometry**, never authored per station. Each band carries an
authored `footprintRadius`; a station reports precipitation exactly while a band centre is inside
that radius, scaled by current intensity with a linear falloff. The map layer and the station record
are therefore two renderings of one source of truth and cannot disagree about when it is raining.

## Front motion and station truth must agree

Station observations and front/precipitation geometry are authored separately. That separation is
useful - it keeps the presentation layer from owning science - but it lets an authored scenario place a
front far away from a station that is recording a frontal change, which would teach the wrong causal
lesson from the game's own evidence.

Binding constraints, enforced fail-closed by the scenario validation layer (see
`docs/SCENARIO_SCHEMA.md`):

1. For every station a boundary-linked effect names, the authored front motion must place the
   boundary at that station inside the authored change window. The station's observation ramp spans
   the same duration as the front's traverse of the transition zone, and the crossing falls inside
   the ramp window (the implementation guarantees equal duration plus an in-window crossing, not
   interval equality).
2. `transitionWidth` must equal the distance the front travels across that window.
3. Precipitation bands must move with a modeled front, and station precipitation is band-derived
   (above), so the radar layer and the station record cannot disagree.
4. Pressure tendency is computed from the produced pressure trajectory - the change over the
   preceding 3 h, clamped at the scenario start - so the tendency column cannot disagree with the
   pressure chart beside it. Authored tendency values are rejected fail-closed.

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

### Observed transition window

The **observed transition window** is the grading truth for timing. It is derived only from the
target station's own reported observations — never from authoring metadata or map geometry.

Definition (implemented by `deriveTransitionWindow`/`deriveStationTransitionWindow` in the domain
layer; the game layer's `deriveObservedTransitionWindow` is a series-based wrapper over it):

1. For every consecutive pair of observation steps, compute the absolute temperature-change rate
   (°C per scenario minute).
2. Find that station's maximum rate over the full scenario.
3. The window is the enclosing span of every consecutive pair whose rate is at least **half of that
   maximum** (the half-maximum threshold).
4. If the station's total temperature change is negligible (< 0.5 °C) or no rate meets the
   threshold, there is no detectable transition and the scenario cannot verify a timing forecast.

A front passage is the fastest sustained temperature change in a station record. This recovery rule
reproduces the authored passage window from public evidence alone, so learners and the verifier
share the same observable definition.

The learner's forecast `transitionWindow` is graded by overlap against this observed window (not
against a single scalar arrival minute). See also `transitionArrivalMinute` in
`docs/SCENARIO_SCHEMA.md` (F10).

### Forecast / nowcast / hindcast commit classification

Every committed forecast is classified by *when* it was committed relative to the observed
transition and the published forecast window:

| Mode | When the learner commits | Pedagogical meaning |
| --- | --- | --- |
| **forecast** | before the observed transition starts | a genuine prediction of a change that has not yet begun |
| **nowcast** | at or after the observed transition start, but before the published window ends | describing a change already under way rather than predicting one |
| **hindcast** | at or after the published forecast window's `endMinute` | recording after the window closed; still graded, never a dead end |

Classification is recorded on the verification report (`mode` / `modeDetail`) and in session status
copy. It does not replace evidence-quality, causal, timing-overlap, or calibration scoring.

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
