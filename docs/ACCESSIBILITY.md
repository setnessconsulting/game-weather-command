# Weather Command — Accessibility Contract

Accessibility is a release requirement, not a final audit.

## Required input paths
All essential actions work with:
- mouse/pointer;
- touch;
- keyboard.

No drag-only action.

## Semantic equivalents
Every essential map/chart fact has a semantic text/table equivalent derived from the same domain snapshot.

Required screen-reader-accessible information includes:
- mission objective;
- station observations;
- chart/trend summaries;
- front/weather-system summary;
- forecast fields;
- confidence;
- verification;
- debrief.

## Visual
- visible focus;
- non-color-only encoding;
- contrast-qualified tokens;
- 360px width support;
- 200% zoom/reflow;
- touch targets around 44–48px where practical;
- no flashing/strobing weather effect.

## Motion
Respect `prefers-reduced-motion`. Reduced motion must not remove scientific information.

## Audio
Mute controls if audio exists. No essential audio-only information.

## Testing
Automated:
- axe-core;
- keyboard smoke paths;
- responsive assertions where reliable.

Human:
- keyboard-only completion;
- screen-reader-oriented semantic review;
- touch completion;
- 200% zoom/reflow;
- reduced-motion review.

No automated tool can substitute for human accessibility qualification.
