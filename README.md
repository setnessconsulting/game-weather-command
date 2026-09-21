# Weather Command

Weather Command is a browser-first middle-school Earth science game about evidence-based weather forecasting.

**Jira:** GAME-336  
**Canonical source:** `setnessconsulting/game-weather-command`  
**Host:** `setnessconsulting/games-site`  
**Status:** WC-01 requirements/architecture implementation

## Product loop

**Observe → identify patterns → forecast → state confidence → advance simulated time → compare predicted vs observed conditions → revise.**

The game targets NGSS MS-ESS2-5 and treats weather prediction as probabilistic evidence-based reasoning rather than a weather-symbol quiz.

## Architecture

Weather Command is designed as:

- a framework-free deterministic TypeScript science/domain kernel;
- a React 19.3 static application shell;
- semantic SVG weather maps/charts with narrowly added D3 helpers only when needed;
- Zod-validated authored scenarios;
- browser-native motion/audio presentation;
- Playwright/Vitest/axe-core qualification;
- an immutable static-web build hosted through games-site/private R2.

Scientific state never depends on rendering frame rate, SVG coordinates, animation timing, or wall-clock time.

## games-site contract

- slug: `weather-command`
- launcher: `/weather-command/`
- play route: `/weather-command/play/`
- assets: `/game-assets/weather-command/<version>/...`
- preview selector: `WEATHER_COMMAND_PREVIEW_VERSION`
- production stays `coming-soon` until an exact qualified immutable release is promoted.

## Canonical requirements

- [Product requirements](docs/PRD.md)
- [Science model](docs/SCIENCE_MODEL.md)
- [Scenario schema](docs/SCENARIO_SCHEMA.md)
- [Technical design](docs/TECHNICAL_DESIGN.md)
- [Technology decisions](docs/TECHNOLOGY_DECISIONS.md)
- [UX and user flow](docs/UX_USER_FLOW.md)
- [Accessibility contract](docs/ACCESSIBILITY.md)
- [Comparator benchmark rubric](docs/BENCHMARK_RUBRIC.md)
- [Performance and device budgets](docs/PERFORMANCE_AND_DEVICE_BUDGETS.md)
- [Privacy and persistence](docs/PRIVACY_AND_PERSISTENCE.md)
- [Asset/audio provenance](docs/ASSET_PROVENANCE.md)
- [games-site release contract](docs/RELEASE_CONTRACT.md)
- [Acceptance/evidence matrix](docs/ACCEPTANCE_EVIDENCE_MATRIX.md)
- [Decisions](docs/DECISIONS.md)

## Implementation order

WC-01 freezes the contracts above. After acceptance:

1. WC-02 — executable React/TypeScript/SVG foundation and CI.
2. WC-HOST — games-site coming-soon/preview seam (may run in parallel with WC-02).
3. WC-03/WC-04 — deterministic kernel and science-reviewed scenarios.
4. WC-05/WC-DESIGN/WC-06 — evidence tools, production design, forecast reasoning loop.
5. WC-07–WC-11 — renderer, shell, tutorial, production polish and mission depth.
6. WC-12–WC-15 — exact-candidate automated qualification, human/comparator qualification, production promotion and closeout.

See GAME-336 for the full dependency graph.

## Scope boundaries

v1 deliberately excludes live weather APIs, severe-warning authority, learner accounts, remote telemetry, AI/LLM calls, multiplayer, LevelBest coupling, and a general-purpose game engine.


## Development

WC-02 establishes the executable foundation. Production weather simulation and canonical missions remain out of scope until WC-03/WC-04.

```bash
npm ci
npm run dev
npm run verify
npm run test:e2e
npm run test:host
```

The production build uses a relative asset base so the exact artifact can run beneath
`/game-assets/weather-command/<version>/` inside games-site.

Architecture guards keep `src/domain/` free of React, DOM, browser storage, network access,
wall-clock time, animation timing, and ambient randomness. The learner runtime is limited to
React, React DOM, and Zod until a later Jira gate explicitly approves another runtime dependency.
