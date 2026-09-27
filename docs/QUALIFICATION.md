# Weather Command — Qualification Path (WC-12)

One command produces a bounded release-evidence package for the exact candidate SHA:

```bash
npm run qualify
```

The pipeline binds its evidence to the exact source SHA (`git rev-parse HEAD` at run time) and
writes `qualification/<short-sha>/` containing:

* `qualification.json` — machine-readable step results, durations, and overall pass/fail;
* `bundle-report.json` — compressed transfer sizes vs the WC-01 budget;
* Playwright HTML reports and traces (from `test:e2e` / `test:host`).

The pipeline fails (non-zero exit) if any step fails. There is deliberately no CI-only path: every
step has a documented local command and the whole suite runs from a clean clone.

## Steps

| # | Step | Local command | Covers |
| --- | --- | --- | --- |
| 1 | verify | `npm run verify` | typecheck, lint, unit/component/integration tests + coverage, architecture purity, production build, privacy guard |
| 2 | bundle report | `node scripts/bundle-report.mjs` | compressed HTML+CSS+JS transfer vs the 350 KiB WC-01 budget |
| 3 | browser E2E | `npm run test:e2e` | Chromium, Firefox, WebKit critical paths; axe-core accessibility; console-error and unhandled-rejection assertions; zero cross-origin network assertion; 360px + reduced-motion; 200% zoom reflow |
| 4 | nested-host E2E | `npm run test:host` | production build under the games-site versioned asset base |
| 5 | release manifest | `npm run release:check` | release manifest identity/provenance validation against the built artifact |

Supporting gates inside step 1:

| Gate | Command/test |
| --- | --- |
| Deterministic golden traces (every station, every step, all four missions) | `tests/scenarios/goldenObservationMatrix.test.ts`; re-lock with `npm run test:golden:regenerate` |
| Deterministic replay | `tests/scenarios/canonicalReplay.test.ts` |
| Scenario schema/content validation + fail-closed authored-data rules | `tests/scenarios/schema.test.ts`, `tests/domain/scenarioCoherence.test.ts`, `tests/scenarios/frontPassageScenarios.test.ts` |
| Forecast-state invariants, verification dimensions, revision | `tests/game/verification.test.ts`, `tests/game/session.test.ts` |
| Timing budgets (≤16 ms median / ≤50 ms p95 per time step and per verification) | `tests/domain/timingBudget.test.ts` |
| Privacy surface / zero gameplay-network | `npm run check:privacy` + the E2E request listener |
| Keyboard/touch/reduced-motion | `tests/e2e/smoke.spec.ts` (axe-clean keyboard start; 360px + reduced motion) |

## Operational notes

* The Playwright webServer binds port 4173 with `--strictPort`. If a previous `vite preview`
  process is still alive on that port, the E2E step fails fast — stop the stale preview and
  re-run. This is a bounded failure, not a flake.
* Browser binaries for Chromium, Firefox and WebKit must be installed (`npx playwright install`);
  the config qualifies all three.
* The evidence package directory (`qualification/<sha>/`) is a build artifact; commit
  `qualification.json` deliberately if the SHA-bound evidence should be versioned, otherwise
  keep it out of source control like `dist/`.

## Reading a result

`qualification.json` has `result: "pass"` only when every step passed for that exact SHA. Any
failure names the failed step(s). Evidence is bounded: it records the steps, durations and sizes
for the candidate SHA — it does not certify human review outcomes (playtest, science sign-off,
comparator review), which remain WC-14 gates recorded separately.

## Clean-clone check

```bash
git clone https://github.com/setnessconsulting/game-weather-command.git
cd game-weather-command
npm ci
npm run qualify
```
