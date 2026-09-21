# Acceptance and Evidence Matrix

This matrix maps the Epic gates to evidence expected before completion.

| Gate | Jira | Acceptance focus | Required evidence |
|---|---|---|---|
| Requirements lock | GAME-337 / WC-01 | Product/science/architecture/UX/technology/benchmark/release decisions frozen | canonical docs, baseline SHA, independent implementation-readiness review |
| Foundation | GAME-338 / WC-02 | Clean-clone static React/TS app, boundaries, CI, nested hosting | lockfile, CI, dependency-boundary checks, nested-base smoke |
| Host seam | GAME-339 / WC-HOST | truthful games-site coming-soon + exact preview path | games-site tests, preview fixture, allowlist/path tests |
| Simulation | GAME-340 / WC-03 | deterministic framework-free domain | unit/property/replay tests |
| Canonical science | GAME-341 / WC-04 | four reviewed Front Passage scenarios | source register, schema validation, golden traces, science review |
| Evidence tools | GAME-342 / WC-05 | map/station/trend evidence + semantic equivalents | component tests, keyboard/touch/semantic evidence |
| Design gate | GAME-343 / WC-DESIGN | production interaction/visual system resolved | Figma version, density study, motion/audio spec, comparator notes |
| Forecast loop | GAME-344 / WC-06 | forecast/confidence/verify/revise state machine | domain/integration tests incl. calibration |
| Weather renderer | GAME-345 / WC-07 | polished snapshot-driven SVG visualization | representative transition tests, reduced-motion evidence |
| Gameplay shell | GAME-346 / WC-08 | complete responsive accessible paths | Playwright, axe, keyboard/touch/zoom evidence |
| Guided mission | GAME-347 / WC-09 | fresh learner can complete without external instruction | human playtest + deterministic tutorial tests |
| Production polish | GAME-348 / WC-10 | production-fidelity visual/motion/audio/provenance | asset manifest, screenshots/video, perf evidence |
| Content depth | GAME-349 / WC-11 | independent/warm/uncertain missions balanced | final science review, target-age playtest |
| Automated qualification | GAME-350 / WC-12 | exact candidate passes automated gates | consolidated CI evidence package |
| Hosted candidate | GAME-351 / WC-13 | immutable exact build works in games-site | preview URL, source/release identity, hosted smoke |
| Human/comparator gate | GAME-352 / WC-14 | quality + science + accessibility + playtest | frozen rubric findings, independent review, remediation closure |
| Production | GAME-353 / WC-PROMOTE | exact accepted artifact promoted and rollback proven | public smoke, promotion SHA, rollback evidence |
| Closeout | GAME-354 / WC-15 | production/repo/Jira truth reconciled | final SHAs, release notes, limitations, all children dispositioned |

## Global blocker conditions

No issue may claim final acceptance with an unresolved:
- high-severity science error;
- P0/P1 product defect;
- essential inaccessible interaction;
- child privacy violation;
- unlicensed/unknown shipping asset;
- hidden runtime network dependency;
- broken nested games-site asset path;
- candidate/release identity mismatch.

## Human-only evidence

Automation cannot certify:
- fun/engagement;
- age appropriateness;
- clarity for a fresh learner;
- visual polish;
- usefulness of explanations;
- comparator parity.

Those require recorded human review/playtest evidence.
