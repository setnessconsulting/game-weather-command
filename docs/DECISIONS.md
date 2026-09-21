# Weather Command — Decisions

Status: owner/planning decisions through WC-01

## D-01 — Canonical repository

Decision: `setnessconsulting/game-weather-command`.

Starting main SHA:
`673b1f2ccb3239dfe3e3e7eb7501cec8bb30267d`

Preserve owner-created history. No destructive reset.

## D-02 — Hosting

Decision: hosted through `setnessconsulting/games-site`.

Canonical slug:
`weather-command`

Routes:
- `/weather-command/`
- `/weather-command/play/`

Assets:
`/game-assets/weather-command/<version>/...`

Preview variable:
`WEATHER_COMMAND_PREVIEW_VERSION`

Production remains coming-soon until explicit promotion.

## D-03 — Runtime architecture

Decision: React + semantic SVG application around a pure TypeScript deterministic science kernel.

Do not use Phaser by default.

Reason: gameplay is primarily evidence inspection, mapping, trends, forecast entry, time progression, and verification. A separate game-engine rendering/input architecture would increase accessibility and state complexity without owning the science.

## D-04 — TypeScript version

Decision: start on TypeScript 7.0.2.

Reason: fresh 2026-09-21 package evidence shows 7.0.2 stable. Earlier Jira planning referenced 6.x, but 6.x is the migration line toward the native 7.x compiler. Starting a new repo on 6.x would create immediate upgrade debt.

## D-05 — Runtime network

Decision: zero-network learner gameplay except same-origin immutable static asset loading.

No live weather service in v1.

## D-06 — Forecast scoring

Decision: no single opaque correctness score.

Separate:
- evidence quality;
- causal consistency;
- timing/error;
- confidence calibration.

## D-07 — v1 content

Decision: Front Passage mission family:
1. Guided Cold Front Shift;
2. Independent Cold Front Variant;
3. Warm Front / Gradual Change;
4. Uncertain Boundary.

Do not expand into severe-warning training or general sandbox scope.

## D-08 — Comparators

Frozen quality comparators:
- Smithsonian Weather Lab;
- NWS/NSSL HotSeat workflow;
- Smithsonian Disaster Detector;
- Mini Metro.

Each comparator owns a different quality dimension. No copying.

## D-09 — LevelBest

Decision: out of scope for this Epic.

The standalone games-site release must not depend on LevelBest integration.

## D-10 — Custom host protocol

Decision: no postMessage/custom host protocol for v1 unless a concrete later requirement proves one is necessary.
