# UX and Accessibility Contract

## Experience direction

Weather Command should feel like a calm, modern forecast workstation.

The learner should always understand:
- what is happening now;
- what evidence is available;
- what decision is expected;
- what changed after time advanced;
- how the result relates to the earlier forecast.

## Required screens/states

- mission briefing;
- regional evidence workspace;
- station inspection;
- trend inspection;
- map-layer controls;
- forecast editor;
- confidence control;
- optional fictional operational recommendation;
- forecast committed state;
- time-advance transition;
- predicted-vs-observed verification;
- revision flow;
- debrief;
- replay/restart;
- settings for reduced motion/audio where applicable.

## Responsive design

Design must be intentional at:
- 360 px portrait;
- phone landscape;
- tablet;
- desktop.

Mobile is not a compressed desktop.

The design must define:
- layer-priority rules;
- decluttering behavior;
- information that moves between panels;
- map/forecast workspace hierarchy;
- focus order at every breakpoint.

## Interaction

Every essential action works with:
- pointer;
- touch;
- keyboard.

No precision drag may be required.

If a direct-manipulation interaction is added, provide a control-based alternative.

## Semantic equivalence

Any fact required to solve a mission that appears visually in a map/chart must also be available through an accessible semantic representation.

Required semantic representations include:
- station observations;
- trend summaries/tables;
- front/air-mass state summaries;
- precipitation summary;
- forecast form;
- verification result;
- debrief.

## Color and motion

No essential state distinction is color-only.

Fronts/precipitation/forecast states require shape, pattern, icon, label, or text reinforcement.

Reduced-motion mode:
- removes nonessential movement;
- preserves timing/state information;
- still feels finished.

No flashing/strobing effect is permitted.

## Focus and announcements

- visible focus is mandatory;
- logical focus restoration after modal/panel/state changes;
- no keyboard traps;
- status updates announced without flooding assistive technology;
- time advance and verification should produce concise semantic summaries.

## Touch/zoom

- practical target size: approximately 44–48 px;
- 200% zoom/reflow must remain usable;
- no page-level horizontal information loss at minimum width.

## Audio

Audio is optional enhancement:
- mute available;
- no essential information audio-only;
- restrained interaction/state feedback preferred over continuous noisy ambience.

## Design quality gate

Before production renderer/shell implementation:
- Figma must contain phone/tablet/desktop compositions;
- one representative vertical-slice screen/state must be production-fidelity;
- visual-density study must cover all v1 evidence layers;
- motion specification must cover time advance and verification;
- predicted-vs-observed design must make error and uncertainty legible without shame treatment;
- comparator notes must cover Weather Lab, HotSeat, Disaster Detector, and Mini Metro.

Placeholder/default-browser styling is not a production design direction.
