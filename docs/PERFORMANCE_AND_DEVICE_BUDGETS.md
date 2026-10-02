# Weather Command — Performance and Device Budgets

Status: binding WC-01 budget contract

These are release gates, not aspirational targets. WC-02 establishes the measurement harness and WC-12 consolidates exact-candidate evidence.

## Reference environment

Primary development/runtime baseline:
- Node 24.x for tooling/CI.

Browser qualification:
- current Playwright Chromium;
- current Playwright Firefox;
- current Playwright WebKit.

Responsive qualification:
- 360 × 640 CSS px phone-class viewport;
- 390 × 844 CSS px modern phone-class viewport;
- 768 × 1024 tablet-class viewport;
- 1440 × 900 desktop-class viewport.

At least one real or representative touch device/browser check is required at WC-14.

## Initial-load budgets

For production build served from a warm same-origin host:

- HTML + critical CSS + initial JS compressed transfer target: <= 350 KiB;
- initial JS execution should not create a single main-thread task > 200 ms on the reference desktop CI environment;
- no blocking runtime network dependency beyond same-origin static assets;
- first meaningful mission shell should be interactive without downloading non-current mission assets.

These budgets can be tightened after WC-02 measurement; relaxation requires an explicit Jira decision with evidence.

## Interaction budgets

Target:
- standard control response perceived immediately;
- no intentional debounce on primary forecast controls unless technically required;
- map selection/state update should complete within one animation frame on typical desktop and within 100 ms on qualified low-end emulation;
- time-step computation for a canonical scenario target <= 16 ms median and <= 50 ms p95 in unit benchmark harness;
- forecast verification target <= 16 ms median and <= 50 ms p95.

The simulation should remain inexpensive enough that animation, not science computation, dominates the perceived transition.

## Animation budgets

Target:
- 60 fps on typical desktop where browser/device permits;
- no repeated long-task pattern during weather transitions;
- reduced-motion path performs no unnecessary interpolation loop;
- no continuous animation when the interface is idle unless it materially communicates state and stays within budget.

If dense precipitation rendering cannot meet the budget with SVG after normal optimization, WC-07 may justify a Canvas presentation adapter.

## Memory / lifecycle

- no unbounded trace accumulation;
- replay histories are bounded by scenario requirements;
- animations cancel on view change/unmount;
- audio nodes/listeners are disposed;
- no interval/timer continues after mission teardown.

## Bundle discipline

Runtime dependencies are intentionally small.

Rules:
- do not add an umbrella visualization/game library for one helper;
- optional D3 modules are imported individually;
- no duplicate copies of React;
- no production dependency solely for development convenience.

WC-02 must add a repeatable bundle-size report.

## Static-host budget

Build must work under:

`/game-assets/weather-command/<version>/`

Requirements:
- no root-relative asset assumption that bypasses the version base;
- all hashed assets cache safely as immutable;
- direct iframe load succeeds;
- a missing asset produces bounded error behavior rather than an endless spinner.

## Browser console/network budget

Qualified mission path:
- zero uncaught exceptions;
- zero unhandled promise rejections;
- zero unexpected console errors;
- zero unexpected third-party network requests;
- zero mixed-content/CSP violations.

## Accessibility-performance rule

Performance optimization may not remove semantic equivalents, focus behavior, or accessible data needed to solve the game.

If an optimization forces an accessibility tradeoff, the accessibility requirement wins unless the owner explicitly changes scope.

## Evidence

WC-12 records:
- bundle report;
- timing benchmark output;
- Playwright traces/screenshots where useful;
- console/network assertions;
- representative animation/performance observation;
- exact source/release SHA.

## Enforcement status

Which of these budgets an automated check actually fails on. A budget with no enforcement is a
stated intention, and a qualification pass must not be read as if it were measured.

### Enforced by an automated check

| Budget | Enforced by |
| --- | --- |
| Compressed transfer <= 350 KiB | `scripts/bundle-report.mjs` (non-zero exit), run by `npm run qualify` and as an explicit step in both CI workflows |
| Time step <= 16 ms median / <= 50 ms p95 | `tests/domain/timingBudget.test.ts` |
| Forecast verification <= 16 ms median / <= 50 ms p95 | `tests/domain/timingBudget.test.ts` |
| No runtime dependency beyond react / react-dom / zod | `scripts/check-privacy-surface.mjs` |
| No fetch / XHR / WebSocket / web storage / analytics in `src` | `scripts/check-privacy-surface.mjs` |
| Zero uncaught exceptions, unhandled rejections, console errors | `tests/e2e/smoke.spec.ts` |
| Zero unexpected third-party network requests | `tests/e2e/smoke.spec.ts`, origin derived from project config |
| Relative asset base; direct nested-host load; no >= 400 responses | `tests/e2e/nestedAssetBase.spec.ts` (chromium) |
| No interval continues after mission teardown | `tests/app/accessibility.test.tsx`, plus the E2E autoplay-teardown case |
| Coverage of the whole production surface | `vitest.config.ts` thresholds inside `npm run verify` |

### Declared, not yet enforced

These are release gates that need a WC-12/WC-14 measurement rather than prose. None of them is
measured today, and a qualification pass does not certify them.

| Budget | Why it is not enforced | Owner |
| --- | --- | --- |
| No single main-thread task > 200 ms on initial load | Needs a real browser performance trace, not jsdom or a headless smoke run | WC-14 |
| First mission shell interactive without non-current mission assets | Needs network-waterfall capture against a real host | WC-13 / WC-14 |
| Map selection/state update within one frame (desktop) / 100 ms (low-end) | Needs a rendered measurement; the map does not animate between snapshots today, so there is no frame to measure | WC-07 / WC-14 |
| 60 fps; no repeated long-task pattern during transitions | Same | WC-14 |
| Reduced-motion path performs no unnecessary interpolation loop | The app has no interpolation loop to measure; what is asserted is that the reduced path disables autoplay and states the equivalent information | WC-14 |
| No continuous idle animation | Needs an idle observation over time | WC-14 |
| No unbounded trace accumulation; replay histories bounded by scenario | Session state retains at most 64 forecast attempts; a 512-revision property check verifies the cap, monotonic attempt numbering, and preservation of the latest comparison | `tests/game/session.test.ts` |
| Animations cancel on view change/unmount | The only interval is cleared on unmount and is now asserted; no other animation exists to check | WC-10 |
| Audio nodes and listeners disposed | `src/audio` is authored but not yet wired into the app, so there is nothing to dispose | WC-10 |
| All hashed assets cache as immutable | The nested-host server sends no `Cache-Control`; needs a header assertion against the real host | WC-13 |
| A missing asset produces bounded error behaviour, not an endless spinner | Needs a fault-injection test | WC-13 |
| Zero mixed-content / CSP violations | Needs a real host with a CSP to test against | WC-13 |
| 390 × 844, 768 × 1024, 1440 × 900 viewports | Only 360 px, 640 px and 320 px layout widths are exercised today | WC-12 / WC-14 |
| Real or representative touch device check | A `touch-chromium` Playwright project on a `Pixel 7` descriptor now covers the representative case; physical hardware remains WC-14 | WC-14 |
| Clean-clone install/build from the published remote | Documented procedure; no automated step clones the remote and builds it | WC-12 |
