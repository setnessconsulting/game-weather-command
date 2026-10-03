# Temporary Node 24 shadow case source — 2026-10-02

This documentation-only change reserves an exact pull-request head for the
second behavior case in the central Jenkins shadow matrix. It records no
Jenkins result and is intended to close unmerged after provider readback.

- Repository: `setnessconsulting/game-weather-command`
- Catalog profile: `game-weather-command-node24-static`
- Implementation: `node24-game-weather-command-static-v1`
- Existing qualification count: 1 of 4
- Existing success case: PR #11 at `5a4e04478d56d75d88ed01d491c76a5756616ad3`, Jenkins build #72, exact-head check `110981216205`
- Static command plan: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run check:architecture`, `npm run build`, and `npm run check:privacy`
- Intended next case: a deliberate verification-command failure on this exact PR head, published as a visible Jenkins failure with no passing receipt. `npm run check:architecture` is the proposed command boundary for the failure observation.

The PR-triggered Actions workflow remains authoritative and continues to run
both `verify` and `browser`. Its workflow permissions are `contents: read`; the
Cloudflare release workflow is manual-only and outside this case. The Actions
result on this head is not Jenkins qualification evidence. No implementation
source, test input, or credential is changed by this note.
