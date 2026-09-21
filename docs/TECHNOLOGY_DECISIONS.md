# Weather Command — Technology Decisions

Status: Accepted for WC-01. Exact patch versions are pinned by WC-02 lockfile using supported stable packages available at implementation time.

## Approved baseline

| Concern | Technology | Boundary / reason |
|---|---|---|
| Language | TypeScript 6.x, strict ESM | All production source |
| UI | React 19.3 line | Client-side static application |
| Build | Vite 8.x | Static bundle and development |
| Validation | Zod | Authored scenario/content boundaries |
| Visualization | SVG + narrow D3 imports | Accessible map/chart primitives |
| Styling | CSS Modules + CSS variables | Game-specific design system |
| Domain state | Pure TS reducers/transitions | Deterministic/testable |
| Animation | CSS/SVG/rAF | Snapshot interpolation only |
| Audio | Web Audio / HTML audio | Optional presentation feedback |
| Unit tests | Vitest 5.x | Domain/contracts/components |
| Component tests | React Testing Library | Semantic behavior |
| E2E | Playwright | Chromium/Firefox/WebKit |
| Accessibility | axe-core + manual review | Automated + human evidence |
| Design | Figma | Visual/interaction authority |
| CI | GitHub Actions | Credential-free validation |
| Hosting | games-site + private R2 | Immutable static artifact |

## Runtime dependency policy
The runtime allowlist should remain intentionally small:
- react;
- react-dom;
- zod;
- only D3 packages proven necessary by implemented visualization.

Do not add a dependency merely because it is conventional.

## Not approved in v1 without ADR
- Phaser;
- PixiJS;
- Three.js/WebGL game engine;
- Unity;
- Rive;
- FMOD;
- Redux/Zustand/XState solely as preference;
- Supabase/backend SDK;
- live weather/radar API SDK;
- Mapbox/Google Maps;
- analytics/marketing SDK;
- LLM/AI runtime SDK.

## ADR threshold
A new major runtime dependency requires:
1. concrete unmet requirement;
2. alternatives considered;
3. bundle/performance impact;
4. accessibility impact;
5. testability impact;
6. failure/fallback behavior;
7. owner-visible ADR.

## Version policy
- WC-02 pins exact versions in `package.json` and lockfile.
- No floating production dependencies.
- Upgrade after vertical-slice freeze only through dedicated PR with regression evidence.
- Avoid deprecated TypeScript 6 options that are scheduled for removal in TypeScript 7.
