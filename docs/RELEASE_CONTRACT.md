# Release and Games-Site Contract

## Repository ownership

`setnessconsulting/game-weather-command` owns:
- game source;
- tests;
- scenarios/science data;
- build;
- release manifest;
- immutable artifact identity.

`setnessconsulting/games-site` owns:
- public catalog;
- launcher/play shell;
- exact release selection;
- same-origin private-R2 delivery;
- production promotion;
- rollback.

## Canonical identity

- slug: `weather-command`
- launcher: `/weather-command/`
- play route: `/weather-command/play/`
- asset URL: `/game-assets/weather-command/<version>/...`
- R2 prefix: `weather-command/<version>/...`
- preview selector: `WEATHER_COMMAND_PREVIEW_VERSION`

## Static-web artifact

The production build must:
- be self-contained;
- use relative/nested-base-safe asset references;
- load inside games-site `StaticGameFrame`;
- make no domain-root asset assumptions;
- make no gameplay network calls after its own static assets are loaded.

## Preview behavior

Before production promotion:
- games-site catalog remains `coming-soon`;
- a non-production preview may select exactly one Weather Command version;
- only that selected version may be served by the asset function;
- arbitrary versions/path traversal remain rejected;
- preview configuration must not silently become the production release pointer.

## Immutable candidate

WC-13 creates a candidate from an exact source SHA.

Required evidence:
- source SHA;
- dependency lock identity;
- scenario/content version;
- build/release id;
- R2 object/version identity;
- games-site preview SHA/deployment;
- hosted smoke result.

An immutable artifact is never overwritten. A changed candidate gets a new version.

## Promotion

WC-PROMOTE:
- selects the exact already-qualified artifact;
- does not rebuild the game;
- updates only games-site selection/metadata needed for production;
- performs live smoke verification;
- exercises rollback to the previous known-good games-site state;
- restores the approved Weather Command selection if still accepted.

## No custom host protocol

v1 does not require a postMessage protocol.

The outer games-site shell owns:
- navigation outside the iframe;
- catalog and launcher;
- promotion state.

Weather Command owns its internal mission/session UI.

Any future cross-frame protocol requires a separate typed/versioned contract and Jira decision.
