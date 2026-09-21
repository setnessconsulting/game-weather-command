# Weather Command — Product Requirements

## Product outcome
Weather Command is a browser-first middle-school Earth science game for grades 6–8. The player operates a regional forecast desk and must use atmospheric evidence to make, verify, and revise forecasts.

Core loop:

**Observe → identify patterns → explain likely air-mass/front motion → forecast → state confidence → make a bounded operational recommendation → advance time → compare prediction with outcome → revise.**

The game must feel like a polished systems game, not a worksheet or hidden multiple-choice quiz.

## Curriculum target
Primary target: NGSS **MS-ESS2-5**. Secondary explanatory context may draw from MS-ESS2-6 without turning v1 into a climate simulator.

Required learner reasoning includes:
- air masses and fronts;
- pressure and pressure tendency;
- temperature;
- moisture/humidity;
- precipitation;
- wind direction/speed;
- time-bounded change;
- uncertainty and probabilistic forecasting.

## First production mission family
1. Guided Cold Front Shift.
2. Independent Cold Front Variant.
3. Warm Front / Gradual Change.
4. Uncertain Boundary Variant.

The uncertain scenario must support more than one scientifically defensible forecast range. It must evaluate evidence quality and confidence calibration rather than compare against one hidden exact answer.

## Player forecast artifact
Each forecast must support:
- target location and time window;
- temperature trend/range;
- precipitation probability/range;
- wind shift/change;
- transition timing window;
- confidence;
- selected evidence;
- optional bounded fictional operational recommendation.

Feedback remains explainable across:
1. evidence quality;
2. causal consistency;
3. forecast/timing error;
4. confidence calibration.

## Product quality
Release quality is judged separately across:
- science/causal integrity;
- forecast reasoning depth;
- game-loop engagement/replay;
- onboarding/recovery;
- information hierarchy;
- visual polish;
- motion/game feel;
- audio/interaction feedback;
- mobile/responsive quality;
- accessibility;
- performance.

Meeting NGSS alone is not sufficient for release.

## Session goals
- first mission: roughly 10–15 minutes;
- repeat variants: roughly 6–10 minutes;
- no punitive time pressure;
- replay/revision encouraged;
- clear pause/restart/replay paths.

## Non-goals
v1 is not:
- live weather;
- a warning or public-safety service;
- a numerical weather prediction model;
- a tornado/hurricane simulator;
- a climate simulator;
- a multiplayer game;
- an account/progression platform;
- a generative-AI tutor;
- a LevelBest-coupled app.

## Privacy
Learner runtime is zero-network for gameplay except same-origin static asset delivery. No account, telemetry, ads, third-party map tiles, live weather APIs, or LLM calls.

## Hosting
Canonical repo: `setnessconsulting/game-weather-command`.

Hosting repo: `setnessconsulting/games-site`.

Canonical slug: `weather-command`.

Routes:
- `/weather-command/`
- `/weather-command/play/`

Immutable assets:
- `/game-assets/weather-command/<version>/...`

Preview selector:
- `WEATHER_COMMAND_PREVIEW_VERSION`
