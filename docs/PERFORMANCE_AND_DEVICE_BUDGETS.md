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
