# Weather Command — Accessibility Contract

Status: binding WC-01 requirement

Target: WCAG 2.2 AA-aligned product behavior, with game-specific accommodations for dense maps and changing data.

Automated checks are necessary but not sufficient.

## Core principle

No essential science evidence or required action may depend exclusively on:

- color;
- hover;
- drag;
- pointer precision;
- animation;
- sound;
- canvas pixels;
- spatial arrangement alone.

## Input parity

All essential actions work with:

- mouse/pointer;
- touch;
- keyboard.

Drag interactions, if any, have non-drag alternatives.

Touch targets should be approximately 44–48 CSS px where practical.

## Semantic structure

Use:

- one logical `h1`;
- meaningful heading hierarchy;
- landmarks;
- native buttons/inputs whenever possible;
- grouped controls with labels/instructions;
- explicit status semantics only for meaningful state updates.

Do not recreate native control behavior in SVG.

## Map equivalence

The weather map is not the sole information channel.

Required equivalent structures:

- station list;
- selected-station card;
- accessible map summary;
- trend table/text summaries;
- explicit front/system status where needed for the mission.

Station selection lives in the semantic station list, and the map states the selection in words
("West Station (selected)"). The map markers are deliberately **not** controls: the map is exposed
as a single `role="img"` image, so an interactive descendant inside it would be hidden from
assistive technology and would be a pointer-only control with no keyboard equivalent. The
requirement is therefore that the map and the station list agree on which station is selected,
not that both are independently operable.

## Charts

Charts include:

- useful title/caption;
- accessible summary;
- data table or equivalent structured values when required to solve a mission;
- non-color line/series distinctions;
- focusable controls only where interaction is required.

Do not force screen-reader users to traverse every decorative SVG point.

## Color

Weather conventions may use familiar colors, but color is never the only state encoding.

Use combinations of:

- label;
- shape;
- pattern;
- line style;
- symbol;
- position;
- text.

Contrast targets follow WCAG 2.2 AA for text and meaningful UI graphics.

## Motion

Respect `prefers-reduced-motion`.

Reduced-motion mode:
- removes non-essential atmospheric motion;
- replaces travel/interpolation with snapshot/change presentation;
- preserves all information;
- remains visually finished.

No flashing/strobing effect is permitted.

## Audio

Audio is optional reinforcement.

Requirements:
- mute;
- no essential audio-only cue;
- no auto-playing loud sound;
- settings persist locally only if permitted by privacy contract.

## Focus

- visible focus indicator;
- no focus trap;
- focus restoration after closing overlays;
- intentional focus destination after major screen changes;
- no forced focus movement during weather animation;
- route/screen changes announce context appropriately without verbose live-region spam.

## Reflow and zoom

Must remain usable:
- at 360 CSS px width;
- at 200% browser zoom;
- without page-level horizontal information loss.

Dense map/evidence workspaces may change layout rather than preserve desktop geometry.

## Text

- avoid long instruction walls;
- define weather terminology at point of use;
- use age-appropriate wording without sacrificing scientific accuracy;
- avoid shame language;
- do not communicate correctness through iconography alone.

## Time

No required interaction depends on a short real-time countdown.

Simulation time and learner time are separate.

## Automated evidence

Implemented in `tests/e2e/smoke.spec.ts`, `tests/viz/*.test.tsx`, `tests/app/*.test.tsx` and
`tests/game/tutorial.test.ts`:

- axe-core on the mission list, briefing, observing, reduced-motion and motion-toggle states;
- a keyboard-only path: focus a control, activate with `Enter`/`Space`, assert the focus target and
  its text, and confirm the skip link resolves to `#workspace` on the briefing screen;
- a `touch-chromium` Playwright project on a `Pixel 7` device descriptor, so the touch claim is a
  measurement rather than an assumption;
- the reduced-motion path reaching application state, asserted through the rendered control state
  and the equivalent-information text on both the clock panel and the map;
- 360 px width, 200% reflow and 400% reflow (the WCAG 1.4.10 threshold), each asserted as real
  layout-viewport width rather than a CSS `zoom` property, which never asks the layout engine to
  reflow;
- zero cross-origin network requests, derived from the project config;
- the autoplay interval updating the record, pausing, and being torn down on mission exit;
- non-colour encodings and text/table equivalents for the map and both charts;
- semantic-element assertions for every forecast control, station control and assistance control,
  including arrow-key operation of the assistance radio group.

## Manual evidence

Still required, and **not** substitutable by the checks above:

- full keyboard mission, end to end, by a human;
- screen-reader-oriented review of briefing, evidence, forecast, verification, and debrief with a
  real screen reader (axe-core catches only a subset of real AT behaviour);
- 200% zoom/reflow on a real browser zoom control;
- phone touch flow on physical hardware;
- non-color interpretation review with a human;
- reduced-motion review on an operating system that requests it.

## Known gap

The map has no encoding for pressure, for forecast state, or for verification result. Pressure is
present only as a chart series and a station table column; forecast state and verification are
present only as text. This is recorded rather than hidden, and it is a design decision owed to
WC-DESIGN (GAME-343) rather than something the renderer should invent.

## Release blocker

A known defect that prevents a learner from obtaining required evidence or completing a required action through an accessible alternative is release-blocking.
