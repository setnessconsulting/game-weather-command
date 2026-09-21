# Weather Command — UX and User Flow

## Product feel
A calm, polished forecast workstation with game-like feedback. It must not resemble a school form or generic dashboard.

## Main flow
1. Briefing
2. Observe map/stations/trends
3. Select evidence
4. Build forecast
5. State confidence
6. Commit
7. Advance scenario time
8. Compare predicted vs observed
9. Explain support/refutation
10. Revise or debrief
11. Replay / next variant

## Information hierarchy
At any moment the UI should answer:
- What am I trying to forecast?
- What time/location does this evidence describe?
- What changed?
- What evidence matters?
- What have I predicted?
- How confident am I?
- What actually happened?
- What can I revise?

## Responsive strategy
Desktop: map + evidence/forecast workspace may coexist.

Tablet: prioritize map plus a docked/overlay evidence panel.

Phone: deliberate staged composition; no compressed desktop layout. One primary task surface at a time with persistent context summary.

## Interaction
Essential interactions require equivalent:
- pointer;
- keyboard;
- touch.

No essential hover, precision drag, color-only, motion-only, or audio-only interaction.

## Forecast verification
Verification is side-by-side or tightly paired:
- predicted;
- observed;
- error/range;
- evidence;
- confidence calibration.

Wrong/weak forecasts use neutral explanatory feedback. No shaming red-X treatment.

## Motion
Motion specifications are required for:
- front progression;
- precipitation changes;
- station updates;
- forecast commit;
- time advance;
- verification reveal;
- revision.

Reduced-motion mode preserves information and still feels production-finished.

## Audio
Optional, restrained cues may reinforce:
- commit;
- time advance;
- weather transition;
- successful evidence link;
- debrief.

Audio never carries essential information.
