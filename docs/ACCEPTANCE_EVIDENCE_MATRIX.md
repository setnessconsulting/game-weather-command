# Weather Command — Acceptance and Evidence Matrix

Status: WC-01 implementation map

This matrix defines the minimum evidence expected before each downstream story can be considered complete. Story descriptions in Jira remain authority for full scope.

| Jira | Outcome | Required evidence | State as of this slice |
|---|---|---|---|
| GAME-337 / WC-01 | canonical contracts | docs committed; technology + comparator freeze; exact SHA; independent readiness review | Done |
| GAME-338 / WC-02 | executable foundation | clean-clone install/typecheck/lint/test/build; boundary/privacy checks; nested-base smoke; CI green | Done |
| GAME-339 / WC-HOST | games-site seam | coming-soon catalog; routes; `StaticGameFrame`; preview variable; R2 allowlist tests; production unchanged | Done |
| GAME-340 / WC-03 | deterministic kernel | unit/property tests; seeded replay; no browser/render imports; malformed-state handling | Done |
| GAME-341 / WC-04 | canonical scenarios | source register; four v1 scenario families; golden traces; **independent human science review** | Automated side complete. Human sign-off outstanding, so the issue stays in Review |
| GAME-342 / WC-05 | evidence tools | map/stations/trends share same snapshots; semantic equivalents; keyboard/touch tests | Automated evidence complete; target-age usability outstanding |
| GAME-343 / WC-DESIGN | production design | Figma file/version; desktop/tablet/phone; density study; motion/audio specs; comparator notes | AI-authored responsive vector board and decision handoff created; cloud Figma file/key/version and independent review still outstanding |
| GAME-344 / WC-06 | forecast/revision loop | state-machine tests; confidence calibration; multiple defensible ranges; deterministic replay | Automated evidence complete, including the F7 non-disclosure obligation |
| GAME-345 / WC-07 | production renderer | representative scenarios rendered; reduced motion; non-color encodings; performance evidence | Station pressure/tendency callouts and explicit draft/committed observation-only map states implemented. Frame-rate and long-task budgets remain unmeasured; human design review remains outstanding |
| GAME-346 / WC-08 | accessible shell | complete pointer/keyboard/touch mission; axe checks; 360 px; 200% zoom; focus behavior | Automated evidence complete across four browser projects. Real screen-reader experience is WC-14 human evidence |
| GAME-347 / WC-09 | guided mission | tutorial/hint/recovery tests; no dead end; human first-use evidence | Automated evidence complete, including wrong-action recovery and step reachability. Human first-use playtest outstanding |
| GAME-348 / WC-10 | production fidelity | final assets; provenance; motion/audio tuning; mobile polish; no placeholders | Machine-readable provenance inventory is bound into the release manifest; independent design/originality review, motion/audio and device polish remain open |
| GAME-349 / WC-11 | production mission set | independent missions; seeded variants; balance; final science review; target-age evidence | Versioned independent cold-front, gradual warm-front, and uncertain-boundary missions are implemented with deterministic seeds and golden observations. No extra seed is added unless it creates a meaningful, coherent evidence or timing difference. Human calibration/balance review, final science sign-off, and target-age independent-completion playtest remain open |
| GAME-350 / WC-12 | qualification suite | exact-candidate unit/E2E/a11y/performance/privacy/build package | One command produces the package for an exact clean SHA and binds each emitted file to the versioned provenance inventory. Renderer performance budgets and clean-clone automation remain open |
| GAME-351 / WC-13 | immutable preview | exact source SHA → immutable R2 release; games-site preview; nested-host verification | Jira says Done (updated 2026-09-27); exact versioned artifact and preview-host readback are not in the evidence recorded here; see `docs/RELEASE_RECONCILIATION.md` |
| GAME-352 / WC-14 | human/comparator gate | frozen rubric; independent review; science review; target-age playtest; a11y/device review; remediation closed | Not started |
| GAME-353 / WC-PROMOTE | production release | exact approved artifact selected; live smoke; rollback exercise; restored final state | Jira says Done (updated 2026-09-21), but the production launcher says “Not playable yet” and the play route says “Coming soon”; promotion remains unverified |
| GAME-354 / WC-15 | closeout | production truth reconciled; exact SHAs/versions; docs current; no blocking issue remains | Not started |

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
