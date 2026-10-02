# Weather Command — Qualification Path (WC-12)

One command produces a bounded release-evidence package for the exact candidate SHA:

```bash
npm run qualify
```

The pipeline binds its evidence to the exact source SHA (`git rev-parse HEAD` at run time) and
writes `qualification/<short-sha>/` containing:

* `qualification.json` — machine-readable step results, durations, and overall pass/fail;
* `bundle-report.json` — compressed transfer sizes vs the WC-01 budget;
* `release-manifest.json` — artifact manifest whose `commit` field is checked against the
  qualification's exact source SHA;
* the Playwright HTML reports copied in from `playwright-report/` and `playwright-report-host/`.

**The pipeline refuses to run on a dirty working tree.** A package is a claim about one exact
commit; if tracked files are modified, `git rev-parse HEAD` describes code that is not what was
tested. There is deliberately no override. Commit or stash, then qualify.

The pipeline fails (non-zero exit) if any step fails. Every step also has a documented local
command, and CI runs the same commands on the same lockfile.

## Steps

`npm run qualify` runs six steps:

| # | Step | Local command | Covers |
| --- | --- | --- | --- |
| 1 | verify | `npm run verify` | typecheck, lint, unit/component/integration tests + coverage, architecture purity, production build, privacy guard |
| 2 | bundle report | `node scripts/bundle-report.mjs` | compressed HTML+CSS+JS transfer vs the 350 KiB WC-01 budget |
| 3 | browser E2E | `npm run test:e2e:run` | Chromium, Firefox, WebKit and a touch device; axe-core on every phase reached; console-error and unhandled-rejection assertions; zero cross-origin network assertion; keyboard-only path; 360 px; 200% and 400% reflow; reduced-motion behaviour; autoplay teardown |
| 4 | nested-host E2E | `npm run test:host:run` | production build under the games-site versioned asset base (chromium) |
| 5 | release manifest | `npm run release:manifest` | writes the release manifest from the built artifact with the qualification's source SHA, versioned provenance inventory, and output-file provenance fields |
| 6 | release check | `npm run release:check` | release manifest identity, source-inventory checksum, file hashes, and provenance mappings against the built artifact |
| 7 | manifest SHA binding | manifest `commit` must equal the qualification's full source SHA | proves the release identity describes the same source commit |

Steps 3 and 4 require a build first; `npm run test:e2e` and `npm run test:host` include it,
`test:e2e:run` and `test:host:run` do not.

## Supporting gates inside step 1

| Gate | Command/test |
| --- | --- |
| Deterministic golden traces (every station, every step, all four missions) | `tests/scenarios/goldenObservationMatrix.test.ts`; re-lock with `npm run test:golden:regenerate` |
| Deterministic replay | `tests/scenarios/canonicalReplay.test.ts` |
| Scenario schema/content validation + fail-closed authored-data rules | `tests/scenarios/schema.test.ts`, `tests/domain/scenarioCoherence.test.ts`, `tests/scenarios/frontPassageScenarios.test.ts` |
| Forecast-state invariants, verification dimensions, revision, calibration | `tests/game/verification.test.ts`, `tests/game/session.test.ts`, `tests/game/forecast.test.ts` |
| Authored ranges never reach the interface before commitment (WC-04 finding F7) | `tests/app/forecastDisclosure.test.tsx` |
| Map and chart semantics, non-colour encodings, table equivalents, reduced motion | `tests/viz/WeatherMap.test.tsx`, `tests/viz/TrendChart.test.tsx` |
| Guidance levels, reduced-motion wiring, focus, no-surviving-timer | `tests/app/accessibility.test.tsx` |
| Guided progression, wrong-action recovery, no dead ends | `tests/game/tutorial.test.ts` |
| Timing budgets (≤16 ms median / ≤50 ms p95 per time step and per verification) | `tests/domain/timingBudget.test.ts` |
| Privacy surface / zero gameplay-network | `npm run check:privacy` + the E2E request listener |
| Keyboard / touch / reduced motion / reflow | `tests/e2e/smoke.spec.ts` |

### Coverage scope

`npm run test:coverage` instruments all of `src/**` except `main.tsx` and the type-only module,
with thresholds of 90% lines/statements, 85% branches, 90% functions. The React shell, the SVG
renderer, the session layer and the entry-adjacent modules are inside the gate, not just the pure
kernel. A regression in any of them fails `npm run verify`.

## Operational notes

* The Playwright webServer binds port 4173 with `--strictPort`. If a previous `vite preview`
  process is still alive on that port, the E2E step fails fast — stop the stale preview and
  re-run. This is a bounded failure, not a flake.
* The zero-network E2E assertion derives its allowed origin from the Playwright project config,
  not from a hardcoded host, so changing `WC_E2E_PORT` does not invert it.
* Browser binaries for Chromium, Firefox and WebKit must be installed
  (`npx playwright install chromium firefox webkit`); the config qualifies all three plus a
  `touch-chromium` project using a `Pixel 7` device descriptor.
* `retries: 1` is set. The retry exists for browser-teardown protocol errors — Firefox on Windows
  intermittently fails in `browserContext.close` when four projects tear down at once, after the
  test body has already passed. A retried test is reported as flaky, not as a clean first-time
  pass, so a real regression still fails.
* `qualification/<sha>/` is a build artifact and is **not** committed. It is uploaded as a CI
  artifact by the verification and release-candidate workflows.

## Reading a result

`qualification.json` has `result: "pass"` only when every step passed for that exact SHA, and
`result: "fail"` with `failedSteps: ["clean-tree"]` when the tree was dirty. Any other failure
names the failed step(s). Evidence is bounded: it records the steps, durations and sizes for the
candidate SHA — it does not certify human review outcomes (target-age playtest, science sign-off,
comparator review, human screen-reader experience), which remain human evidence recorded
separately. See `docs/ACCEPTANCE_EVIDENCE_MATRIX.md`.

## Known limits of automated qualification

These are **not** covered by `npm run qualify` and must not be inferred from a pass:

| Not automated | Why | Where it is recorded |
| --- | --- | --- |
| Target-age first-use playtest, "a fresh player completes the guided mission unaided" | Human evidence; an automated check may not stand in for it | GAME-347, GAME-349, GAME-352 |
| Independent human science sign-off of the canonical scenarios | Human evidence; two AI review passes are recorded but are explicitly not the sign-off | GAME-341, `docs/FRONT_PASSAGE_SCIENCE_REVIEW.md` |
| Comparator / originality rubric | Human review of feel, clarity and age-appropriateness | GAME-352 |
| Screen-reader experience with a real screen reader | Human evidence; axe-core catches only a subset | GAME-352 |
| Renderer frame-rate and long-task budgets | jsdom and headless runs cannot measure them; only bundle transfer, kernel time step and verification latency are measured | `docs/PERFORMANCE_AND_DEVICE_BUDGETS.md` |
| Verification result as a map overlay | Verified and debrief phases use the dimension-by-dimension comparison panel; the map stays on observations and is not rendered as a separate forecast/outcome layer | GAME-345, `docs/ACCESSIBILITY.md` |
| Clean-clone install from the published remote | Documented procedure, not an automated step | below |

## Clean-clone check

```bash
git clone https://github.com/setnessconsulting/game-weather-command.git
cd game-weather-command
npm ci
npm run qualify
```
