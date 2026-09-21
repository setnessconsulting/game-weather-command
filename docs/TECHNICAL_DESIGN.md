# Technical Design

## Architectural goal

Separate **scientific truth**, **learner reasoning**, and **presentation** so the game remains deterministic, testable, accessible, and visually polished.

## Source boundaries

Expected source layout established in WC-02:

```text
src/
  domain/       # framework-free scientific + forecast contracts
  scenarios/    # versioned authored data + schemas
  app/          # React composition/orchestration
  viz/          # SVG/D3/optional Canvas presentation
  audio/        # presentation-only audio adapter
  styles/       # tokens and CSS Modules
  testing/      # fixtures/helpers (or tests/ at root)
```

### domain/
May not import React, DOM, SVG, D3, Canvas, audio, browser storage, or network APIs.

Owns:
- scenario state;
- deterministic time advancement;
- seeded PRNG;
- observation snapshots;
- forecast artifact schema;
- forecast verification;
- replay trace;
- domain invariants.

### scenarios/
Owns:
- authored scenario files;
- Zod validation;
- schema/content versioning;
- science metadata and source references.

Invalid or unsupported scenario data fails closed.

### app/
Owns:
- React component composition;
- mission flow;
- focus/navigation behavior;
- semantic forms/controls;
- view state derived from domain snapshots.

It cannot mutate scientific truth outside typed domain intents.

### viz/
Primary renderer: semantic SVG.

May use narrowly scoped D3 modules for:
- scales;
- path/shape generation;
- interpolation;
- contours/data transforms.

Canvas may be added only for a measured dense-layer performance/readability need. Any Canvas information required for gameplay must have an equivalent semantic representation.

### audio/
Browser-native Web Audio / HTML audio only for bounded feedback.

Audio:
- never communicates required information alone;
- never controls game state;
- is muteable;
- has reduced/silent fallback.

## State architecture

Avoid a global-state framework by default.

Use:
- pure domain transitions for authoritative mission/science state;
- React reducer/state for UI orchestration;
- derived selectors for presentation;
- serializable replay traces for verification/testing.

Redux/Zustand/XState require a Jira-backed ADR plus a demonstrated complexity/testing benefit.

## Rendering contract

Rendering receives immutable/readonly snapshots and presentation intents.

Rendering coordinates, animation timing, browser size, frame rate, SVG geometry, or wall-clock time never feed back into scientific state.

## Time advancement

Simulation advances only through explicit domain actions such as:
- advance one forecast interval;
- commit forecast;
- replay/reset scenario.

Animation interpolates between already-computed snapshots.

## Persistence

v1 default is session-local only.

No learner identity, remote save, analytics, or cloud profile is required.

Any browser persistence beyond the current session requires an explicit versioned contract and privacy review.

## Network/privacy

After static assets load, gameplay must not require network access.

Forbidden runtime dependencies include:
- live weather APIs;
- map tile APIs;
- analytics/telemetry SDKs;
- LLM APIs;
- account/auth backends.

## Static-host contract

Build output must work at a nested base:

`/game-assets/weather-command/<version>/`

No domain-root asset assumptions.

The app runs inside games-site's same-origin `StaticGameFrame`.

## Testing architecture

Required layers:
- domain unit/property tests;
- scenario schema tests;
- deterministic golden traces;
- component tests;
- accessibility automation;
- Playwright browser/E2E;
- nested-host build tests;
- zero-network/privacy checks;
- dependency-boundary checks;
- release-manifest validation.

## Performance philosophy

Prefer semantic DOM/SVG until measurement proves a bottleneck.

Do not introduce Canvas/WebGL or a game engine preemptively.

WC-01 budget targets:
- responsive interaction without avoidable main-thread stalls;
- stable animation on the reference device set;
- bounded initial JS payload;
- no unbounded timers/listeners;
- no hidden background network work.

WC-02 must turn these into measurable CI budgets with actual bundle and browser data.
