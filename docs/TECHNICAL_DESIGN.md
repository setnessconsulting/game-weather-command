# Weather Command — Technical Design

Status: canonical WC-01 architecture contract

## Architectural principle

Weather Command is a deterministic science/domain application with a game-quality presentation layer.

The simulation owns truth. React owns application composition. SVG/D3/optional Canvas own presentation. games-site owns hosting selection and outer navigation.

No rendering layer may become scientific authority.

## Repository boundaries

Planned source layout:

```text
src/
  domain/       # pure TypeScript scientific + forecast contracts
  scenarios/    # authored scenario data, Zod validation, versioning
  app/          # React application orchestration
  viz/          # semantic SVG, D3 helpers, optional Canvas adapter
  audio/        # presentation-only audio adapter
  styles/       # design tokens and global foundations
  testing/      # shared deterministic fixtures/helpers
tests/
docs/
scripts/
.github/workflows/
```

### Allowed dependency direction

```text
scenarios -> domain
app       -> domain, scenarios, viz, audio
viz       -> domain
audio     -> domain event facts only when useful
testing   -> all testable boundaries
domain    -> no React/DOM/D3/audio/browser dependency
```

Automated architecture checks must enforce the boundary.

## Domain packages

The domain layer owns:

- scenario clock;
- seeded PRNG;
- air-mass/boundary state;
- station observation state;
- precipitation evidence state;
- deterministic transitions;
- forecast contract;
- verification;
- confidence calibration;
- replay trace;
- scenario completion facts.

All public domain state must be serializable.

## Scenario package

Authored scenario JSON/TS data is validated through versioned Zod schemas.

Invalid or unsupported content fails closed with a developer-visible error in development and a bounded learner-facing recovery state in production.

Scenario validation is not optional because authored data is part of the scientific product.

## React application

React owns:

- screen/view composition;
- focus management;
- mission/navigation state;
- accessible controls;
- calling pure domain transitions;
- rendering authoritative snapshots;
- persistence adapter when allowed;
- user preferences such as motion/audio.

The app does not perform hidden atmospheric calculations.

## Visualization

### Primary renderer: semantic SVG

Use semantic SVG for:

- region map;
- station markers;
- fronts/boundaries;
- pressure cues;
- wind cues;
- forecast overlays;
- chart axes/lines;
- predicted-vs-observed comparison.

D3 is used only for low-level scales/shapes/interpolation/contours/data transforms where it provides measurable value. D3 must not own the DOM lifecycle or application state.

### Optional Canvas

Canvas is allowed only for a measured dense-layer need, such as a precipitation field that cannot meet the performance budget through SVG.

If Canvas is used:

- authoritative data remains in `domain/`;
- keyboard interaction does not depend on pixels;
- equivalent semantic/text/table evidence is present;
- no essential information exists only on Canvas.

### Rejected baseline

No Phaser, PixiJS, Three.js, WebGL engine, or Unity runtime in v1.

## Mission state machine

Use pure TypeScript transitions and discriminated unions rather than introducing a general state-machine library by preference.

Representative states:

```text
briefing
observing
draftingForecast
forecastCommitted
advancingTime
verification
revision
debrief
complete
```

Transitions must be explicitly testable and replay-safe.

## Rendering timeline

Simulation time only changes through explicit domain actions such as `advanceScenario()`.

Animations interpolate between snapshot A and snapshot B. If animation is disabled or skipped, state B is identical.

## Persistence

Default v1 behavior is session-local and local-first.

Persist only:
- user preference flags (e.g. reduced motion override/mute) where useful;
- optional bounded mission resume state if WC-01 acceptance proves it improves UX.

Do not persist identity, free-text reasoning, or remote telemetry.

Persisted schemas must be versioned and fail safely.

## games-site integration

Canonical host contract:

- repository: `setnessconsulting/games-site`;
- slug: `weather-command`;
- launcher: `/weather-command/`;
- play route: `/weather-command/play/`;
- assets: `/game-assets/weather-command/<version>/...`;
- preview selector: `WEATHER_COMMAND_PREVIEW_VERSION`;
- outer renderer: existing `StaticGameFrame`.

Weather Command outputs one self-contained static-web build whose asset references work beneath a nested versioned base path.

No postMessage API is required for v1.

## Security/privacy surface

Runtime must not call:

- weather APIs;
- analytics APIs;
- advertising APIs;
- remote storage;
- map-tile providers;
- AI/LLM endpoints.

A CI privacy check should fail when unapproved runtime network APIs/origins are added.

## Accessibility architecture

Essential data is available through DOM/SVG semantics independent of visual layers.

Focus and announcements are owned by React/DOM, not a canvas/game-engine abstraction.

See `ACCESSIBILITY.md`.

## Performance architecture

The game must remain responsive on the WC-01 reference browser/device set.

Budgets are in `PERFORMANCE_AND_DEVICE_BUDGETS.md`.

Optimization order:

1. remove unnecessary work;
2. memoize pure transforms when measured;
3. limit rendered marks/labels using authored decluttering rules;
4. use D3 helpers efficiently;
5. use Canvas only for measured dense-layer bottlenecks;
6. do not introduce a heavier rendering framework as the first optimization.

## Testing strategy

### Unit / contract

- deterministic domain transitions;
- seeded PRNG;
- scenario schemas;
- forecast verification;
- persistence schema;
- accessible formatting helpers.

### Golden traces

Each canonical scenario has exact expected state checkpoints.

### Component

React Testing Library verifies behavior from user-observable semantics rather than implementation details.

### E2E

Playwright covers:

- Chromium;
- Firefox;
- WebKit;
- keyboard;
- representative touch viewport;
- nested asset-base build;
- reduced motion;
- critical mission path;
- reload/error recovery.

### Accessibility

axe-core provides automated checks, supplemented by manual keyboard, screen-reader-oriented, reflow, contrast, motion, and target-size evidence.

## Release identity

The build must expose or ship a manifest containing at minimum:

- source SHA;
- content/scenario version;
- build timestamp;
- release version;
- dependency-lock identity;
- asset/provenance version.

Immutable candidate artifacts are never overwritten.
