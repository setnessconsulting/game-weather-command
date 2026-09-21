# Weather Command — Technical Design

## Architecture principles
1. Scientific truth lives in framework-free TypeScript.
2. React orchestrates application state and semantic UI.
3. SVG is the primary weather-map/chart renderer.
4. D3 is a utility, not an application framework.
5. Animation interpolates between authoritative snapshots.
6. Static hosting must work from a nested versioned base path.
7. Gameplay requires no network.

## Package boundaries
Initial source layout:

```text
src/
  domain/       # science, forecasts, scoring/verification, replay
  scenarios/    # versioned authored content + validation
  app/          # React application orchestration
  viz/          # SVG/D3 and optional measured Canvas enhancement
  audio/        # browser-native presentation feedback
  styles/       # CSS Modules/tokens
  testing/      # shared fixtures/helpers
```

Forbidden dependency directions:
- `domain/` cannot import React, DOM, D3, audio, or games-site code.
- `scenarios/` cannot import React.
- `viz/` consumes immutable/read-only domain snapshots.
- `audio/` cannot mutate domain/scenario truth.
- no package may import games-site internals.

## State model
The mission state machine must be explicit and testable independent of presentation:

`briefing → observe → forecast-draft → forecast-committed → time-advanced → verification → revise-or-debrief`

Replay must serialize:
- scenario id/version;
- seed;
- deterministic player actions;
- committed forecasts;
- verification outcomes.

## Rendering
Primary: semantic SVG.

D3 modules may be used narrowly for:
- scales;
- path/shape generation;
- interpolation;
- contours;
- data transforms.

Canvas is allowed only if a measured performance/readability need exists, such as dense precipitation. Any Canvas information required to solve the mission must have a semantic equivalent.

WebGL/Three/Pixi/Phaser are not baseline technologies.

## Styling
CSS Modules + CSS custom properties.

Tokens cover:
- typography;
- spacing;
- focus;
- motion;
- elevation;
- weather-state semantics;
- contrast-safe palette;
- touch-target sizing.

## Animation
Use CSS/SVG transitions and bounded `requestAnimationFrame` interpolation. React View Transitions may be used only as progressive enhancement with fallback.

Animation never advances science state.

## Audio
Use browser-native Web Audio / HTML audio for small original/licensed cues. Mute is required. No essential information is audio-only.

## Data validation
Zod validates authored scenario/content boundaries. Scenario schema and content version are explicit and fail closed.

## Hosting contract
The build must be self-contained static web content compatible with:
- `/game-assets/weather-command/<version>/index.html`
- relative/versioned asset resolution;
- same-origin `StaticGameFrame`;
- no parent-window navigation requirement;
- no postMessage protocol unless later justified by an ADR.
