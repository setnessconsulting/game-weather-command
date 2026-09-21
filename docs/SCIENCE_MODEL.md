# Weather Command — Science Model Contract

## Authority
The science model is a pedagogical deterministic model for NGSS-aligned reasoning. It is not a claim of operational forecast accuracy.

Every authored rule must record:
- scientific source;
- modeled relationship;
- simplification;
- model boundary;
- learner-facing explanation.

Preferred authorities include NOAA/NWS educational and operational references and NGSS.

## Deterministic model
A pure TypeScript domain package is the sole authority for:
- scenario time;
- air-mass/front state;
- station observations;
- precipitation-field state;
- seeded bounded observational variation;
- forecast-verification truth;
- replay trace.

Rendering, animation timing, frame rate, device size, DOM/SVG state, and wall clock cannot affect scientific outcomes.

Same scenario version + seed + player actions must produce the same trace.

## v1 variables
The model may expose only variables that materially support the learning objectives:
- temperature;
- pressure;
- pressure tendency;
- relative humidity and/or learner-appropriate dew-point representation;
- wind direction;
- wind speed;
- precipitation;
- front/air-mass position and bounded movement.

## Required causal relationships
The authored model must support, within explicit simplifications:
- pressure differences and wind tendencies;
- movement/interactions of air masses;
- cold-front passage with bounded abrupt changes;
- warm-front passage with comparatively gradual change;
- moisture influence on precipitation likelihood;
- uncertainty caused by incomplete/noisy evidence, without randomizing the underlying truth.

## Uncertainty
Uncertainty is a first-class science concept.

A scenario can define:
- accepted forecast ranges;
- multiple defensible probability bands;
- evidence confidence;
- observational noise.

Uncertainty must never be implemented as arbitrary random correctness.

## Golden traces
Every canonical scenario requires:
- initial state fixture;
- explicit seed;
- time-step sequence;
- expected station observations;
- expected front/precipitation transitions;
- accepted forecast ranges;
- debrief facts.

Golden traces are reviewed science evidence and automated regression fixtures.
