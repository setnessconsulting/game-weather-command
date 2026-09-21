# Weather Command — games-site Release Contract

Status: binding WC-01 host/release contract

## Ownership

`setnessconsulting/game-weather-command` owns:
- source;
- tests;
- scenario/science content;
- production build;
- release manifest;
- immutable artifact identity.

`setnessconsulting/games-site` owns:
- public catalog;
- launcher/play route;
- outer navigation/shell;
- selected preview/production release;
- same-origin private-R2 asset delivery;
- production promotion;
- rollback.

## Canonical identity

- game slug: `weather-command`
- launcher: `/weather-command/`
- play: `/weather-command/play/`
- asset prefix: `/game-assets/weather-command/<version>/...`
- preview environment variable: `WEATHER_COMMAND_PREVIEW_VERSION`
- release kind: `static-web`
- games-site renderer: existing `StaticGameFrame`

## Pre-promotion production state

Production remains `coming-soon` until WC-PROMOTE.

A non-production preview may become playable only for the exact version selected through `WEATHER_COMMAND_PREVIEW_VERSION`.

Preview selection must never silently mutate the checked-in production release pointer.

## Build contract

The game repository produces a static artifact containing:
- `index.html`;
- hashed static assets;
- release manifest;
- all scenario data required for the release;
- no server dependency.

The build must use a relative/version-compatible asset base so it works below:

`/game-assets/weather-command/<version>/`

No asset may assume domain-root deployment unless it is intentionally a games-site outer-shell URL and documented.

## Release manifest

Minimum fields:
- game slug;
- release version;
- source SHA;
- build timestamp;
- scenario/content version;
- dependency-lock identity;
- entrypoint;
- artifact-file hashes or equivalent integrity inventory;
- provenance manifest version.

## Immutable artifact rule

Published versioned objects are never overwritten.

If code/content changes:
- create a new release version;
- upload a new immutable prefix;
- requalify the new candidate.

## Preview qualification

WC-13:
1. builds exact source SHA;
2. creates immutable release identity;
3. uploads the candidate to the private R2 path;
4. configures non-production `WEATHER_COMMAND_PREVIEW_VERSION`;
5. verifies `/weather-command/`;
6. verifies `/weather-command/play/`;
7. verifies nested assets;
8. verifies iframe title/focus behavior;
9. verifies reload/direct navigation;
10. records game SHA, version, games-site SHA/deployment and preview URL.

Production remains coming-soon.

## Production promotion

WC-PROMOTE changes only games-site selected release/metadata.

It does not:
- rebuild the game;
- mutate the immutable candidate;
- copy source into games-site.

Live smoke verifies:
- launcher;
- mission start;
- evidence workspace;
- forecast commit;
- time advance;
- verification;
- debrief.

## Rollback

Production promotion is not accepted until rollback is exercised:
1. record current known-good pointer;
2. promote approved Weather Command release;
3. verify;
4. roll back to prior known-good games-site state;
5. verify;
6. restore Weather Command if release remains approved;
7. record evidence.

## Host protocol

No custom `postMessage` API is required for v1.

The iframe owns game/session controls. games-site owns outer navigation.

Adding a host message protocol requires a new explicit requirement and contract tests.

## Security

The asset Function must:
- allow only selected preview/production releases;
- reject arbitrary versions;
- reject path traversal;
- preserve immutable caching;
- serve only expected game paths.

## Closeout evidence

Jira must contain:
- game source SHA;
- release version;
- scenario/content version;
- games-site promotion SHA;
- deployment identity;
- public URL;
- rollback evidence;
- known limitations.
