# Science and Content Contract

## Scientific authority

Weather Command is a **pedagogical causal model**, not a real forecast service or numerical weather prediction system.

Primary curriculum target: **NGSS MS-ESS2-5**.

Core science relationships required for v1:
- air tends to move from relatively higher toward relatively lower pressure;
- interacting air masses can cause abrupt or gradual weather changes;
- temperature, pressure, moisture, wind, and precipitation evolve together in interpretable patterns;
- frontal passage can produce recognizable but not perfectly identical observations;
- forecast uncertainty is real and must be represented honestly.

## Source hierarchy

Authoring should prefer:
1. NGSS performance expectation and evidence statements;
2. NOAA/NWS educational/operational references;
3. other authoritative meteorological education sources where a relationship is not adequately covered above.

Each authored scenario must record:
- source(s);
- scientific relationship represented;
- simplification;
- excluded complexity;
- learner-facing explanation;
- accepted forecast ranges;
- deterministic golden trace.

## Model boundaries

v1 deliberately omits:
- numerical fluid dynamics;
- global circulation modeling;
- convective severe-weather warning algorithms;
- real-time radar/model ingestion;
- microphysical cloud simulation;
- real geography that could imply a live safety forecast.

Scenario geography should be fictional or sufficiently abstracted that learners cannot mistake the output for current local weather.

## Determinism

Same:
- scenario version;
- seed;
- initial state;
- player action sequence

must produce the same observation and verification trace.

Any observational variation/noise is deterministic and seeded.

## Canonical scenario schema

Each scenario must define at minimum:
- scenario id/version;
- title and learning objective;
- start time on a fictional timeline;
- observing stations;
- initial atmospheric state;
- air-mass/front representation;
- deterministic transition parameters;
- observation snapshots or rules;
- available evidence layers;
- forecast target locations/windows;
- accepted forecast ranges;
- uncertainty model;
- optional operational decision;
- debrief facts;
- sources;
- simplifications;
- expected golden trace.

## Forecast verification

Verification must compare learner predictions with the deterministic scenario outcome.

A forecast may be:
- strongly supported;
- broadly reasonable;
- partially supported;
- poorly supported;
- poorly calibrated in confidence.

The system must explain why. It must not merely show red/green correctness.

## Science review gate

WC-04 cannot be accepted until an independent reviewer can:
- reconstruct why each canonical observation changes;
- trace each required mechanic to the science contract;
- verify accepted forecast ranges;
- identify model limitations;
- replay every canonical golden trace.
