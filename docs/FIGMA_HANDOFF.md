# Weather Command — Design Board Handoff

Status: AI-authored responsive design source, version 1. The source is ready to import into a
Figma design file. No cloud file key or Figma version is claimed until the imported file is
created and read back.

## Design source

- Editable vector source: [`design/figma/weather-command-v1.svg`](../design/figma/weather-command-v1.svg)
- Board contains four screen studies: desktop mission desk, tablet mission desk, phone mission
  desk, and desktop debrief.
- The screens follow the real Weather Command flow: briefing, observe, gather evidence, forecast,
  commit, compare after the window, revise, and debrief.
- Mission-start measurements in the observing screens come from the published `Cold Front Shift`
  starting state. Debrief comparison numbers are marked as layout examples and must be bound to a
  qualified mission record before release.

## Decisions made in this design

- Keep the regional map schematic and fictional; do not add map tiles or real geography.
- Show pressure as named station readings and measured tendency. Do not draw interpolated isobars,
  a pressure field, or pressure-centered symbols unsupported by the deterministic model.
- Distinguish the modeled front position and direction from observed station reports.
- Show precipitation with a hatch pattern and an explicit label. Use text, line pattern, shape, and
  selected-state labels so color is never the only cue.
- Keep forecast ranges and confidence visible together. The committed forecast remains the
  learner's prediction; the observation record appears only after the comparison unlocks.
- Make the next time action available on phone without requiring a drag gesture. Use progressive
  panels on small screens and preserve the 44 px control target.
- Debrief each forecast dimension separately, show the evidence trail and calibration explanation,
  and always offer revision without punitive language.
- Keep motion calm and optional. Reduced motion removes interpolation while retaining the same
  information and controls.

## Before this becomes a release design authority

1. Import the SVG into Figma under Andrew's selected account and save the editable file.
2. Record its exact file URL/key, version, and the imported page/frame names here and in GAME-343.
3. Review the pressure and forecast-state choices with the independent science and comparator
   reviewers. Record changes rather than treating this AI-authored concept as sign-off.
4. Reconcile the approved design with the production components, accessibility equivalents,
   representative device measurements, and asset provenance.

This handoff is original vector work created for Weather Command. It uses project colors and a
system-font stack; it contains no third-party map art, borrowed comparator layouts, or bundled
font/audio assets. It is a design reference, not a shipping runtime asset.
