# Technology Decisions

Status: **WC-01 baseline**  
Changes to baseline require a Jira-backed ADR when they affect architecture, accessibility, privacy, or the release contract.

## Decision principles

1. Prefer the smallest technology surface that can deliver production quality.
2. Scientific truth remains framework-free.
3. Accessibility and semantic inspectability beat renderer novelty.
4. Use proven organization conventions when they fit.
5. Do not adopt a dependency solely because it is newer.

## Baseline toolchain

### Runtime
- React: **19.3.x**
- React DOM: **19.3.x**
- Zod: **4.6.x**

### Build / language
- Node.js: **24.x**
- Vite: **8.3.x**
- TypeScript: **6.x compatibility baseline for WC-02**, with **TypeScript 7.0 evaluation required before install**
- ESM
- strict type checking

### Test / quality
- Vitest: **5.x**
- React Testing Library
- Playwright: current organization-supported **1.62.x+** line unless WC-02 verifies a newer supported release
- axe-core / @axe-core/playwright: **4.13.x**
- ESLint + typescript-eslint compatible with the selected TypeScript compiler

## TypeScript 7 decision

TypeScript 7.0 is current as of WC-01, but it is a major native-compiler transition.

WC-02 must run a short compatibility check against:
- Vite;
- React tooling;
- ESLint/typescript-eslint;
- Vitest;
- Playwright build/test scripts.

If that check passes without waivers, WC-02 should pin TypeScript 7.0.x. If tooling support is incomplete, remain on the latest supported TypeScript 6.x patch and record the reason. This is an explicit quality/stability decision, not resistance to upgrades.

## Styling

Use:
- CSS Modules;
- CSS custom-property design tokens.

Do not add a UI framework or utility framework merely for convenience.

Tokens must cover:
- typography;
- spacing;
- surface/elevation;
- focus;
- semantic weather states;
- motion;
- contrast.

## Visualization

Primary: **semantic SVG**.

D3 is not a framework owner. Add only specific modules that are proven useful.

Likely candidates:
- scales;
- shape/path generation;
- interpolation;
- contour/data transforms.

Do not add the aggregate `d3` package without measuring the bundle and proving individual modules are insufficient.

## Canvas

Canvas is optional only for a measured dense precipitation/performance use case.

It may not become the sole carrier of required evidence.

## Not approved as v1 baseline

Without a new requirement + ADR:
- Phaser;
- PixiJS;
- Three.js/WebGL engine;
- Unity;
- Rive;
- FMOD;
- Redux;
- Zustand;
- XState;
- Supabase;
- remote learner analytics;
- live weather/radar/model providers;
- Mapbox/Google Maps or third-party tiles;
- LLM runtime calls.

## Animation

Use:
- CSS/SVG transitions;
- bounded `requestAnimationFrame` interpolation;
- React 19.3 View Transitions only as progressive enhancement with fallback.

Animation never advances domain state.

## Audio

Use browser-native:
- Web Audio;
- HTML audio.

Keep the audio graph simple and presentation-only.

## Testing stack

- Vitest for domain/contracts/golden traces;
- React Testing Library for components;
- Playwright for critical paths and Chromium/Firefox/WebKit;
- axe-core for automated accessibility findings;
- human accessibility/playtest review for what automation cannot prove.

## Release technology

- GitHub Actions for CI;
- static-web build;
- immutable versioned artifact;
- private R2 asset storage;
- games-site exact-version selection and rollback.

## Version evidence

WC-01 verified current official release families on 2026-09-21:
- React docs: 19.3 current;
- Vite supported line: 8.3 receives regular patches;
- TypeScript 7.0 is current, with 6.0 as predecessor;
- Vitest 5 released 2026-09-03;
- Zod 4.6 current;
- axe-core 4.13 current.

WC-02 owns exact `package.json` and lockfile pinning after compatibility verification.
