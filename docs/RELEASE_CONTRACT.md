# Weather Command — Release and Hosting Contract

## Repository ownership
`setnessconsulting/game-weather-command` owns:
- gameplay source;
- tests;
- science/scenario data;
- build;
- release manifest;
- immutable artifact identity.

`setnessconsulting/games-site` owns:
- catalog;
- launcher/play routes;
- StaticGameFrame;
- selected preview/production release;
- R2 delivery;
- promotion;
- rollback.

## Slug and routes
Slug: `weather-command`

Launcher:
`/weather-command/`

Play:
`/weather-command/play/`

Assets:
`/game-assets/weather-command/<version>/...`

Preview environment variable:
`WEATHER_COMMAND_PREVIEW_VERSION`

## Candidate lifecycle
1. Build from exact source SHA.
2. Generate release manifest/version identity.
3. Publish immutable files under `weather-command/<version>/`.
4. Never overwrite an immutable published version.
5. Preview selects exactly that version.
6. Games-site serves only selected/approved versions.
7. WC-14 qualifies exact candidate.
8. Production promotion changes games-site selection only.
9. Live readback verifies exact release.
10. Rollback is exercised.

## Static-web requirements
- relative/versioned asset base;
- no domain-root assumptions;
- no runtime API dependency;
- clean iframe operation;
- no parent-window navigation;
- no custom postMessage protocol unless later approved.

## Production safety
Production remains `coming-soon` until WC-PROMOTE.
Preview override must never silently become production selection.
