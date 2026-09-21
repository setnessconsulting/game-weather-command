# Weather Command — Privacy and Persistence

Status: binding WC-01 contract

## Default posture

Weather Command is local-first and zero-network for learner gameplay.

The default production runtime does not require:
- an account;
- learner identity;
- remote database;
- analytics SDK;
- ad/marketing tracker;
- live weather provider;
- AI/LLM service;
- remote free-text storage.

## Allowed network behavior

During gameplay, network access is limited to same-origin static asset delivery required to load the immutable game artifact from games-site.

No runtime request is allowed to:
- weather APIs;
- map-tile providers;
- telemetry collectors;
- remote persistence;
- social services;
- AI providers.

WC-02 should implement a privacy/network-surface guard in CI.

## Local persistence

Allowed by default:
- mute preference;
- reduced-motion override if the game exposes one independent of OS preference;
- other non-identifying display preferences.

Optional mission resume state may be added only if implementation shows clear learner value.

If mission resume is added:
- schema must be versioned;
- state must be bounded;
- state must contain no identity;
- state must contain no remotely submitted free text;
- corrupted/incompatible state must fail safely to a fresh mission.

## Free text

v1 does not require free-text explanations.

Evidence reasoning should use structured evidence identifiers and bounded choices. This improves:
- privacy;
- accessibility;
- deterministic verification;
- replayability.

## Session traces

Replay/test traces may exist in memory or local development fixtures.

Production must not remotely transmit traces.

If local resume uses a trace:
- keep only data required to reconstruct bounded mission state;
- document retention/clearing behavior;
- provide a reset path.

## Child-safety product rules

No:
- ads;
- loot boxes;
- monetized chance;
- public chat;
- social feed;
- leaderboard;
- streak pressure;
- FOMO countdowns;
- manipulative notifications;
- external purchase flow.

## Simulated-weather disclosure

The UI must clearly distinguish:
- simulated scenario conditions;
- real weather/safety guidance.

No mission output may be framed as a real forecast for the learner’s location.

## Logging

Production console logging must not expose:
- hidden future scenario answers before commit;
- learner-entered data;
- internal debug traces that materially spoil scenarios.

Development logging must be removable or disabled in production.

## Release evidence

Before promotion, verify:
- no unexpected runtime origins;
- no analytics/telemetry dependency;
- no remote persistence;
- privacy guard passes;
- games-site iframe permissions remain bounded;
- exact artifact identity is recorded.
