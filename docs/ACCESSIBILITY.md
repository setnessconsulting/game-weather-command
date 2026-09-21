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

Selecting an item in the semantic station list and selecting its map marker must resolve to the same domain entity.

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

At minimum:
- axe-core on major states;
- Playwright keyboard-critical paths;
- touch/mobile viewport coverage;
- reduced-motion path;
- semantic element assertions.

## Manual evidence

Before release:
- full keyboard mission;
- screen-reader-oriented review of briefing, evidence, forecast, verification, and debrief;
- 200% zoom/reflow;
- phone touch flow;
- non-color interpretation review;
- reduced-motion review.

## Release blocker

A known defect that prevents a learner from obtaining required evidence or completing a required action through an accessible alternative is release-blocking.
