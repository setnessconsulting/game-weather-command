# Weather Command — Acceptance and Evidence Matrix

Status: WC-01 implementation map

This matrix defines the minimum evidence expected before each downstream story can be considered complete. Story descriptions in Jira remain authority for full scope.

| Jira | Outcome | Required evidence |
|---|---|---|
| GAME-337 / WC-01 | canonical contracts | docs committed; technology + comparator freeze; exact SHA; independent readiness review |
| GAME-338 / WC-02 | executable foundation | clean-clone install/typecheck/lint/test/build; boundary/privacy checks; nested-base smoke; CI green |
| GAME-339 / WC-HOST | games-site seam | coming-soon catalog; routes; `StaticGameFrame`; preview variable; R2 allowlist tests; production unchanged |
| GAME-340 / WC-03 | deterministic kernel | unit/property tests; seeded replay; no browser/render imports; malformed-state handling |
| GAME-341 / WC-04 | canonical scenarios | source register; four v1 scenario families; golden traces; independent science review |
| GAME-342 / WC-05 | evidence tools | map/stations/trends share same snapshots; semantic equivalents; keyboard/touch tests |
| GAME-343 / WC-DESIGN | production design | Figma file/version; desktop/tablet/phone; density study; motion/audio specs; comparator notes |
| GAME-344 / WC-06 | forecast/revision loop | state-machine tests; confidence calibration; multiple defensible ranges; deterministic replay |
| GAME-345 / WC-07 | production renderer | representative scenarios rendered; reduced motion; non-color encodings; performance evidence |
| GAME-346 / WC-08 | accessible shell | complete pointer/keyboard/touch mission; axe checks; 360 px; 200% zoom; focus behavior |
| GAME-347 / WC-09 | guided mission | tutorial/hint/recovery tests; no dead end; human first-use evidence |
| GAME-348 / WC-10 | production fidelity | final assets; provenance; motion/audio tuning; mobile polish; no placeholders |
| GAME-349 / WC-11 | production mission set | independent missions; seeded variants; balance; final science review; target-age evidence |
| GAME-350 / WC-12 | qualification suite | exact-candidate unit/E2E/a11y/performance/privacy/build package |
| GAME-351 / WC-13 | immutable preview | exact source SHA → immutable R2 release; games-site preview; nested-host verification |
| GAME-352 / WC-14 | human/comparator gate | frozen rubric; independent review; science review; target-age playtest; a11y/device review; remediation closed |
| GAME-353 / WC-PROMOTE | production release | exact approved artifact selected; live smoke; rollback exercise; restored final state |
| GAME-354 / WC-15 | closeout | production truth reconciled; exact SHAs/versions; docs current; no blocking issue remains |

## Cross-story rules

### Exact identity

Whenever evidence refers to a candidate/release, record the source SHA and release version.

### Stale evidence

A code/content change invalidates any prior evidence affected by that change.

### Human evidence

Automated tests or AI review may not fabricate:
- target-age usability approval;
- fun/engagement approval;
- science-expert approval;
- screen-reader human experience.

### Release blockers

Unresolved P0/P1 defects, high-severity science errors, inaccessible required interactions, privacy/network violations, unproven immutable identity, or broken rollback block release.
