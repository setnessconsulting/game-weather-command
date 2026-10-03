# Weather Command — Release Reconciliation

Status: **production promotion unverified; route intentionally unavailable**
Read back: 2026-10-02

## Jira status readback

Read-only issue reads on 2026-10-02 returned:

- GAME-351, immutable preview: **Done**, last updated 2026-09-27.
- GAME-353, production promotion and rollback: **Done**, last updated 2026-09-21.
- GAME-354, final release reconciliation: **Backlog**, last updated 2026-09-21.

The first two Done statuses are not backed by the exact source-to-artifact and live-route evidence captured below. The production readback contradicts interpreting GAME-353 as a currently playable release. Jira remains unchanged pending owner-authorized issue reconciliation after the evidence is complete.

## Candidate and qualification

- Candidate PR: [#12](https://github.com/setnessconsulting/game-weather-command/pull/12)
- Exact qualified PR head: `64961114ff3fda86917b97359e06b725e5bf8c72`
- Merge commit on `main`: `4475d72717c7d0fe2ef8b9f9513776a7735e78a2`
- The candidate and merge commit have the same Git tree, `6ef9c24a15f402c6adecac046102ebd7e653e7ff`; the merge commit has a different identity from the qualified candidate SHA.
- Local `qualification/64961114/qualification.json` records `result: "pass"` for verify, bundle report, browser E2E, nested-host E2E, release manifest, release check, and manifest-to-source-SHA binding.
- GitHub Actions run [37051720806](https://github.com/setnessconsulting/game-weather-command/actions/runs/37051720806) reports both `verify` and `browser` passing on the exact PR head. Its downloadable `wc-browser-evidence-*` artifact is browser evidence, not a published game build.

These records qualify the candidate source. They do not prove that an immutable artifact was uploaded, selected for production, or rolled back.

## Current production readback

On 2026-10-02, the live [Weather Command launcher](https://games.setnessconsulting.com/weather-command/) displayed “Not playable yet.” The live [play route](https://games.setnessconsulting.com/weather-command/play/) displayed “Coming soon” and said that no qualified build was available.

The readback does not establish a production deployment or rollback. The exact R2 object/version, its source-SHA manifest, the production pointer, production smoke record, and rollback exercise remain **unverified** in this evidence set.

## Release decision

Keep Weather Command unavailable in production. Reconcile the immutable object and manifest to an approved source SHA, verify the versioned preview and host behavior, then require the named human gates and rollback evidence before any promotion. A source change after qualification requires a new candidate and candidate-bound evidence.

## Remaining evidence owners

- GAME-341: independent human science sign-off for the four canonical scenarios.
- GAME-343: reconcile the recorded native Figma file/version against the source SVG and the as-built record, then record the approved frame names; independent review remains open.
- GAME-342 and GAME-347: target-age usability and first-use guided-mission evidence.
- GAME-345 and GAME-350: renderer frame-rate and long-task measurements on representative physical devices; headless browser checks do not satisfy this gate.
- GAME-348: final visual polish, asset provenance, and motion/audio/mobile review.
- GAME-349: independent-mission variants, balance/calibration, final science review, and target-age evidence.
- GAME-352: comparator/originality, human screen-reader, device, science, and playtest review against the final candidate.
- GAME-353: exact artifact selection, production smoke, and proven rollback.
- GAME-354: reconcile the issue and release records after all preceding evidence is complete.
