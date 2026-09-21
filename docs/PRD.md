# Weather Command Product Requirements

## Outcome

Ship a polished, accessible, deterministic browser game for grades 6–8 that makes weather forecasting itself the gameplay.

The player must learn to synthesize atmospheric evidence, make a forecast under uncertainty, commit to a prediction, observe consequences, and revise.

## Primary learner outcome

A successful player can explain, using game evidence, how interacting air masses and pressure/moisture/wind trends can change local weather and why a forecast can be reasonable without being perfectly certain.

Primary curriculum target: **NGSS MS-ESS2-5**.

## Core loop

1. Receive a fictional regional forecast assignment.
2. Inspect current observations and recent trends.
3. Identify relevant evidence.
4. Infer likely air-mass/front movement and associated changes.
5. Forecast a bounded future window.
6. State confidence.
7. Make a fictional operational recommendation where the mission calls for one.
8. Advance simulated time.
9. Compare predicted vs observed conditions.
10. Identify supporting/refuting evidence.
11. Revise or conclude.

## v1 mission family: Front Passage

### Guided Cold Front Shift
Introduces station observations, pressure/temperature/moisture/wind trends, frontal timing, forecast entry, confidence, and verification.

### Independent Cold Front Variant
Changes timing, moisture, and initial trends while preserving the same scientific rules.

### Warm Front / Gradual Change
Requires recognizing a slower transition and different evidence pattern rather than memorizing a symbol.

### Uncertain Boundary
Provides bounded noisy/ambiguous evidence and requires calibrated confidence instead of false certainty.

## Required evidence surfaces

At least three fictional observing locations must provide enough information to reason from:
- temperature;
- pressure and pressure tendency;
- humidity and/or learner-appropriate dew-point representation;
- wind direction/speed;
- precipitation;
- time stamps;
- recent trend history.

Scenarios may also expose:
- simplified radar-style precipitation;
- front/air-mass motion clues;
- cloud/satellite-style support if justified.

Every essential visual fact must have an equivalent semantic/text/table representation.

## Forecast artifact

A forecast includes, where relevant:
- temperature trend/range;
- precipitation probability/range;
- wind shift/change;
- transition timing window;
- confidence;
- evidence used.

## Feedback model

Feedback must keep these dimensions separable:
- evidence quality;
- causal consistency;
- forecast/timing error;
- confidence calibration.

There is no single hidden "correct answer" flag. Multiple forecasts may be scientifically reasonable inside accepted scenario ranges.

## Session targets

- first guided mission: about 10–15 minutes;
- repeat/independent mission: about 6–10 minutes;
- no required punitive timer;
- replay/revision is allowed without penalty theatrics.

## Product quality principles

- It must feel like a game, not an electronic worksheet.
- Advancing time must feel consequential.
- Predicted vs observed conditions must be legible immediately.
- Uncertainty is a scientific skill, not failure.
- Information density must remain calm and navigable.
- Motion and sound reinforce state change but never hide required evidence.
- Tutorial support fades as the learner demonstrates competence.

## Non-goals

v1 is not:
- live weather;
- a public-safety or warning product;
- tornado/hurricane warning training;
- a research-grade weather model;
- global climate simulation;
- a cloud/front memorization quiz;
- multiplayer;
- an account/progression platform;
- a generative-AI tutor;
- a LevelBest-coupled runtime;
- a general game engine.

## Product release gates

Public promotion requires:
- source-based science review with no unresolved high-severity finding;
- deterministic replay/golden traces;
- successful guided and independent mission playtests;
- evidence that a learner can explain one causal relationship and one uncertainty;
- keyboard, touch, screen-reader-oriented, reduced-motion, zoom/reflow evidence;
- no known P0/P1 defect;
- performance budget compliance;
- comparator review;
- originality/provenance review;
- independent review tied to the exact candidate SHA;
- immutable hosted-preview qualification;
- proven production rollback.
