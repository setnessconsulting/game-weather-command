# Weather Command — Technology Decisions

Status: binding WC-01 decision record  
Decision date: 2026-09-21

A fresh package/release review found TypeScript 7.0.2 stable, but the current typescript-eslint 8.70 support range is `>=4.8.4 <6.1.0` and it explicitly warns on TypeScript 7. For a fully supported lint/typecheck stack, Weather Command intentionally begins on TypeScript 6.0.2. TypeScript 7 is a planned future upgrade only after the lint toolchain officially supports it.

## Runtime baseline

| Technology | Pinned baseline | Role | Allowed boundary | Decision |
|---|---:|---|---|---|
| React | 19.3.0 | application UI | `app/` | required |
| React DOM | 19.3.0 | DOM renderer | `app/` | required |
| Zod | 4.6.5 | authored scenario/persistence validation | `scenarios/`, bounded adapters | required |
| D3 | none initially | visualization helpers | `viz/` only | add individual modules only when WC-05 proves need |

## Development/test baseline

| Technology | Pinned baseline | Role |
|---|---:|---|
| Node.js | 24.x | repo/CI runtime; aligns with current Setness standalone-game repos |
| TypeScript | 6.0.2 | strict type checking; highest supported TypeScript line for current typescript-eslint |
| Vite | 8.3.0 | dev/build |
| @vitejs/plugin-react | 6.1.1 | React/Vite integration |
| Vitest | 5.0.1 | unit/contract tests |
| React Testing Library | 16.3.3 | component behavior |
| Playwright | 1.63.0 | E2E across Chromium/Firefox/WebKit |
| axe-core | 4.13.0 | accessibility engine |
| ESLint | 10.11.0 | linting |
| typescript-eslint | 8.70.0 | TypeScript lint integration |

Where a package has required peer packages (for example React Testing Library's DOM peer), WC-02 must pin the compatible peer version in the lockfile rather than using a range.

## Version evidence checked

- React latest version page: https://react.dev/versions
- React 19.3 announcement: https://react.dev/blog/2026/09/09/react-19-3
- TypeScript 6 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/\n- TypeScript 6 compatibility package: https://www.npmjs.com/package/@typescript/typescript6\n- typescript-eslint support window: https://typescript-eslint.io/users/dependency-versions/
- Vite npm: https://www.npmjs.com/package/vite
- Vitest 5 announcement: https://vitest.dev/blog/vitest-5
- Vitest npm: https://www.npmjs.com/package/vitest
- Zod 4.6: https://zod.dev/blog/zod-4-6
- Playwright browser documentation: https://playwright.dev/docs/browsers
- axe-core npm: https://www.npmjs.com/package/axe-core

## Language

TypeScript strict mode, ESM.

Production modules must not use untyped JavaScript unless an ADR demonstrates a necessary tooling constraint.

## Styling

Use:

- CSS Modules for component styles;
- CSS custom properties for design tokens;
- a small global reset/foundation layer;
- explicit tokens for type, spacing, elevation, focus, motion, and semantic weather states.

Do not add Tailwind, Bootstrap, Material UI, or another UI framework merely for implementation convenience. Weather Command needs an authored game visual system.

## Domain model

Framework-free pure TypeScript is the only scientific authority.

No React, DOM, D3, audio, browser storage, or timing imports are allowed in `domain/`.

## Validation

Zod validates:

- scenario files;
- content version;
- persisted local data;
- release/config boundaries where useful.

Do not use Zod compilation/eval-style acceleration by default. Scenario payloads are small enough that ordinary validation is preferable unless profiling proves otherwise.

## Visualization

Primary: semantic SVG.

Add individual D3 modules only after WC-05 identifies a concrete transform/rendering need. Do not install the umbrella `d3` package preemptively.

Likely candidates, if needed:
- scales;
- shapes;
- interpolation;
- contours;
- arrays.

Canvas is a performance escape hatch for dense precipitation only after profiling. WebGL is not an approved baseline.

## State management

Use:

- pure domain transition functions;
- discriminated unions;
- React reducers/context only where component orchestration requires shared UI state.

Not approved by default:

- Redux;
- Zustand;
- XState;
- MobX.

A new state library requires an ADR with measured complexity/testability benefit.

## Animation

Use:

- CSS transitions;
- SVG animation/interpolation;
- bounded `requestAnimationFrame` interpolation;
- React 19.3 View Transitions only as progressive enhancement with tested fallback.

Animation never advances domain time.

## Audio

Use browser-native Web Audio / HTML audio with original or licensed small assets.

FMOD is not justified for this v1 because the audio need is restrained interaction/atmospheric feedback rather than adaptive score orchestration.

Every audio cue must have an equivalent visual/state cue. Mute is always available.

## Figma

Figma becomes production design authority only when a real file/version is linked and recorded by WC-DESIGN.

Until then, repository wireframes are illustrative and cannot claim visual approval.

## CI

GitHub Actions is the verification authority.

WC-02 must establish:

- install from lockfile;
- typecheck;
- lint;
- unit/contract tests;
- architecture-boundary checks;
- production build;
- privacy/network-surface checks;
- browser smoke path.

## Release

Static-web immutable artifact hosted by `games-site` through private R2.

No game runtime backend is required.

## Explicitly rejected for v1

Unless a new Jira requirement and ADR establish otherwise:

- Phaser;
- PixiJS;
- Three.js;
- Unity;
- Blender-dependent 3D runtime;
- Rive;
- FMOD;
- Supabase;
- Mapbox/Google Maps;
- live weather/radar/model APIs;
- analytics SDKs;
- LLM/AI APIs;
- general state frameworks.

## Upgrade policy

The lockfile is authoritative once WC-02 lands.

After the production vertical slice, dependency upgrades require a dedicated change with:
- motivation;
- compatibility review;
- full verification;
- regenerated exact-SHA evidence when applicable.

“Latest exists” is not sufficient justification.


## TypeScript 7 upgrade gate

Do not upgrade to TypeScript 7 while the active typescript-eslint support range excludes it.

The future upgrade requires:
- official typescript-eslint support for TypeScript 7;
- clean lint/typecheck on the full repository;
- no suppression of unsupported-version warnings;
- full WC-02/WC-12 verification.
