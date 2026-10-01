# Completion Contract — game-weather-command

**Standard:** Portfolio Completion Standard v1
**Date:** 2026-09-28

## Intended outcome

A browser-first middle-school Earth science game about evidence-based weather
forecasting. Product loop: observe, identify patterns, forecast, state
confidence, advance simulated time, compare predicted vs observed conditions,
revise. Targets NGSS MS-ESS2-5.

## Jobs to be done

Deliver the full playable game (WC-01 through WC-15). WC-01 through WC-04, plus
WC-13 and WC-PROMOTE, are done. The vertical slice WC-06 through WC-09 and the
qualification path WC-12 have automated evidence; WC-DESIGN (WC-05's sibling
gate), WC-10, WC-11 and the human review work WC-14/WC-15 remain open.

## Required functionality

The playable guided and independent Front Passage missions are implemented
end to end: evidence catalogue, animated semantic SVG weather map and trend
charts, forecast/confidence/recommendation editor, verification against the
record, debrief, and replay. Scenario data is deterministic and schema-validated.

## Automated verification

```
npm run verify        # typecheck, lint, tests + coverage, architecture, build, privacy
npm run test:e2e      # chromium, firefox, webkit, touch device; axe; keyboard; reflow
npm run test:host     # nested asset base
npm run qualify       # the full evidence package, bound to one exact clean SHA
```

## External/runtime checks

games-site — slug `weather-command`, launcher `/weather-command/`, play
route `/weather-command/play/`, assets
`/game-assets/weather-command/<version>/...`. Production stays `coming-soon`
until qualified immutable release is promoted.

## Stability evidence

`npm run qualify` writes a bounded evidence package per exact clean source SHA
and refuses to run on a dirty tree. Coverage thresholds now gate all of `src`,
not just the pure kernel. See `docs/QUALIFICATION.md` for which budgets are
enforced and which are documented only.

## Acceptable limitations

v1 excludes live weather APIs, severe-warning authority, learner accounts,
remote telemetry, AI/LLM calls, multiplayer, LevelBest coupling,
general-purpose game engine.

Known open items, tracked in Jira rather than hidden here: independent human
science sign-off of the canonical scenarios (GAME-341), target-age human
playtest (GAME-347, GAME-349), Figma production design authority (GAME-343),
final visual/motion/audio fidelity (GAME-348), independent missions and
seeded variants (GAME-349), and the human comparator/release gate (GAME-352).

## Post-completion operating mode

Active development toward the qualified release candidate. This contract
describes the repository state, not a released product.