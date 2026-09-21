# Weather Command

Weather Command is a browser-first middle-school Earth science game in which the player operates a regional forecast desk, reasons from atmospheric evidence, makes a time-bounded forecast with confidence, advances simulated time, and compares the forecast with what actually happens.

**Jira authority:** GAME-336  
**Implementation repository:** `setnessconsulting/game-weather-command`  
**Hosting:** `setnessconsulting/games-site`  
**Public slug:** `weather-command`

## Product loop

**Observe → identify patterns → forecast → state confidence → commit a bounded decision → advance time → verify → revise**

The game teaches weather reasoning through evidence and uncertainty. It is not a weather-trivia quiz, live forecast product, warning service, or numerical weather-prediction model.

## Canonical planning artifacts

- [Product requirements](docs/PRD.md)
- [Science and content model](docs/SCIENCE_AND_CONTENT.md)
- [Technical design](docs/TECHNICAL_DESIGN.md)
- [UX and accessibility contract](docs/UX_ACCESSIBILITY.md)
- [Technology decisions](docs/TECHNOLOGY_DECISIONS.md)
- [Comparator benchmark rubric](docs/BENCHMARK_RUBRIC.md)
- [Release and games-site contract](docs/RELEASE_CONTRACT.md)
- [Acceptance/evidence matrix](docs/ACCEPTANCE_MATRIX.md)

Production implementation must not silently override these contracts. Material changes require a Jira-backed decision and repository update.

## Architecture summary

- Pure TypeScript deterministic scenario/simulation domain is the sole authority for scientific state.
- React owns application composition and semantic interaction.
- Semantic SVG is the primary weather-map/chart renderer.
- D3 modules may be used narrowly for scales/shapes/transforms.
- Canvas is an optional presentation optimization only if profiling proves it necessary.
- Rendering, animation timing, frame rate, screen size, and wall-clock time never define science state.
- The learner runtime is zero-network after static assets load.
- The build must work at a nested immutable games-site asset base.

## Hosting contract

- Launcher: `/weather-command/`
- Play page: `/weather-command/play/`
- Assets: `/game-assets/weather-command/<version>/...`
- Preview selector: `WEATHER_COMMAND_PREVIEW_VERSION`
- Production remains `coming-soon` until the exact qualified artifact is explicitly promoted.

## Current implementation gate

GAME-337 / WC-01 owns the canonical requirements freeze. GAME-338 / WC-02 and GAME-339 / WC-HOST remain downstream until WC-01 is accepted.
