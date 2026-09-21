# Weather Command — Product Requirements

Status: canonical WC-01 product contract  
Jira authority: GAME-336 / GAME-337  
Implementation authority: `setnessconsulting/game-weather-command`  
Host: `setnessconsulting/games-site`  
Target learner: grades 6–8

## Product outcome

Weather Command is a browser-first Earth science game in which the learner operates a regional forecast desk. The game teaches evidence-based weather prediction by making the learner inspect changing atmospheric evidence, commit a forecast, state uncertainty, advance simulated time, compare prediction with outcome, and revise.

The core loop is:

**Observe → identify patterns → explain likely air-mass/front motion → forecast → state confidence → make a bounded operational recommendation → advance time → verify → revise.**

The product must feel like a polished systems game, not a worksheet with animations.

## Curriculum target

Primary performance expectation: NGSS MS-ESS2-5.

The game must give the learner evidence sufficient to reason about:

- air masses moving from relatively high toward relatively low pressure;
- changing temperature, pressure, humidity/moisture, precipitation, and wind;
- sudden changes when different air masses interact;
- forecasts expressed within probabilistic ranges;
- weather maps, station observations, diagrams, trends, and visualizations as evidence.

The learner is not assessed on memorizing cloud-type names or weather-map symbol names.

Primary standards reference:
- https://www.nextgenscience.org/topic-arrangement/msweather-and-climate

## v1 mission family: Front Passage

### Mission 1 — Guided Cold Front Shift

Purpose: onboarding and causal reasoning.

The learner:
1. receives a forecast-desk briefing;
2. inspects at least three stations;
3. compares pressure, temperature, moisture, wind, and precipitation trends;
4. identifies evidence that a boundary is approaching;
5. forecasts the transition timing, temperature trend, precipitation probability/range, and wind change;
6. states confidence;
7. optionally makes a fictional, non-safety-critical operational recommendation;
8. advances scenario time;
9. compares predicted and observed conditions;
10. explains one supported and one unsupported part of the forecast;
11. revises or replays.

### Mission 2 — Independent Cold Front Variant

Uses the same scientific model but different initial conditions, front speed, moisture, timing, and station evidence. Tutorial scaffolding is reduced.

### Mission 3 — Warm Front / Gradual Change

Requires the learner to distinguish a slower transition and reason from changing observations without relying on front-symbol memorization.

### Mission 4 — Uncertain Boundary

Evidence is intentionally ambiguous within scientifically defensible bounds. Multiple forecasts can be reasonable. The learning objective is calibrated uncertainty rather than guessing one hidden number.

## Required evidence surfaces

The scenario model may expose:

- surface station observations;
- temperature and pressure trends;
- pressure tendency;
- relative humidity and/or dew-point representation appropriate to the learner;
- wind direction and speed;
- precipitation observations;
- simplified radar-style precipitation field;
- front/air-mass position and motion clues;
- synchronized timestamps;
- optional cloud/satellite-style visual support only when it strengthens the learning objective.

Every essential visual fact must have an equivalent semantic/text/table representation.

## Forecast artifact

A forecast contains:

- target location and time window;
- temperature trend or range;
- precipitation probability/range;
- wind shift/direction change;
- approximate timing window for the main transition;
- confidence level;
- cited in-game evidence;
- optional bounded operational recommendation.

Feedback is multi-dimensional:

1. evidence quality;
2. causal consistency;
3. forecast/timing error;
4. confidence calibration.

The game must never collapse the learner’s reasoning into one opaque right/wrong score.

## Experience principles

- A fresh learner understands the role and objective without an external instructor.
- Evidence discovery is satisfying and legible.
- Advancing time feels consequential.
- Forecast verification is visually clear.
- Uncertainty is treated as scientific competence.
- Wrong or weak forecasts produce useful evidence, not shame.
- Replay and revision are normal parts of the loop.
- Tutorial help fades rather than following the learner forever.
- Mobile layouts are intentionally designed, not desktop layouts squeezed smaller.
- Production presentation must feel coherent and authored.

## Session targets

- Guided first mission: approximately 10–15 minutes.
- Repeat/independent mission: approximately 6–10 minutes.
- No punitive countdown is required.
- Pause, inspect, restart, and replay are always available.

## Privacy and safety

v1 is local-first:

- no learner identity;
- no account;
- no ads;
- no marketing trackers;
- no remote gameplay telemetry;
- no upload of free-text reasoning;
- no live weather API;
- no LLM calls;
- no real safety-warning or public forecast role;
- no leaderboard, streak pressure, loot-box mechanic, FOMO, or dark engagement pattern.

Scenario output must always be identified as simulated.

## Release-quality bar

Public promotion requires:

- no unresolved high-severity science finding;
- deterministic golden traces;
- clean critical-path browser console;
- no P0/P1 defects;
- complete keyboard/touch/semantic alternatives;
- 360 px usability and 200% zoom/reflow;
- reduced-motion completeness;
- performance-budget compliance;
- asset/license/provenance closure;
- frozen comparator rubric review;
- target-age human playtest;
- independent review against the exact release SHA;
- immutable hosted qualification through games-site;
- exercised rollback.

## Non-goals

v1 is not:

- a live weather application;
- a severe-weather warning simulator;
- a numerical weather prediction system;
- a hurricane/tornado warning trainer;
- a global climate simulator;
- a quiz about cloud names or map symbols;
- a multiplayer game;
- an account/progression platform;
- a generative-AI tutor;
- a general-purpose game engine;
- a LevelBest-coupled implementation.

## Success evidence

A successful release lets a fresh learner:

1. identify relevant atmospheric evidence;
2. make a bounded forecast without guessing a hidden answer;
3. state reasonable uncertainty;
4. observe the system change;
5. explain at least one cause/effect relationship from evidence;
6. identify why part of a forecast was stronger or weaker;
7. revise the forecast;
8. distinguish the simulation from real-world weather guidance.
