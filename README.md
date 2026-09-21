# Weather Command

Weather Command is a browser-first middle-school Earth science forecasting game for grades 6–8.

The player operates a regional forecast desk:

**Observe → identify patterns → forecast → state confidence → advance time → verify → revise.**

## Authority

- Jira Epic: GAME-336
- Canonical repository: `setnessconsulting/game-weather-command`
- Hosting: `setnessconsulting/games-site`
- Public slug: `weather-command`
- Production remains `coming-soon` until the release gate explicitly promotes a qualified immutable build.

## Canonical planning documents

- [Product requirements](docs/PRD.md)
- [Science model](docs/SCIENCE_MODEL.md)
- [Technical design](docs/TECHNICAL_DESIGN.md)
- [Technology decisions](docs/TECHNOLOGY_DECISIONS.md)
- [UX/user flow](docs/UX_USER_FLOW.md)
- [Accessibility contract](docs/ACCESSIBILITY.md)
- [Comparator benchmark rubric](docs/BENCHMARK_RUBRIC.md)
- [Release/hosting contract](docs/RELEASE_CONTRACT.md)
- [Acceptance evidence matrix](docs/ACCEPTANCE_MATRIX.md)

## Implementation order

WC-01 freezes the requirements and architecture. WC-02 then bootstraps the executable web stack while WC-HOST establishes the games-site preview seam in parallel. Production gameplay must not bypass the science, accessibility, comparator, immutable-release, and human-playtest gates documented in GAME-336.
