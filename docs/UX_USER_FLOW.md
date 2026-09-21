# Weather Command — UX and User Flow

Status: canonical WC-01 interaction contract

## Experience posture

The learner should feel like a junior meteorologist operating a calm, credible forecast workstation.

The interface is neither:
- a professional NWS clone; nor
- a school form dressed as a game.

It uses progressive disclosure so evidence is rich without becoming overwhelming.

## Top-level flow

```text
Launch
  -> Mission briefing
  -> Observe
  -> Build forecast
  -> Commit forecast
  -> Advance time
  -> Compare predicted vs observed
  -> Explain/revise
  -> Debrief
  -> Replay / next mission
```

## Launch

Requirements:

- clear game title and one-sentence role;
- "Start forecast" primary action;
- settings accessible before play;
- simulation/not-live-weather statement discoverable without dominating the screen;
- no account gate.

## Mission briefing

Show:

- fictional region/location;
- forecast window;
- operational context;
- concise learner objective;
- available evidence types;
- tutorial level.

Do not front-load a long weather lecture.

## Observe workspace

Desktop/tablet layout can show:

- map as primary spatial surface;
- evidence/station panel;
- timeline/time controls;
- current task/forecast status.

Mobile uses deliberate progressive panels rather than shrinking all desktop panes.

### Map interaction

A station can be selected by:
- pointer/touch;
- keyboard-accessible station list;
- semantic control associated with the visual marker.

Selection synchronizes:
- station card;
- trend view;
- accessible summary;
- map highlight.

### Evidence drawer/panel

Evidence types have:
- clear labels;
- current timestamp;
- state/trend;
- "use in forecast" affordance where appropriate.

The UI must not mark the "correct" evidence before forecast commitment.

## Build forecast

The forecast editor progressively asks for:

1. target/location if not fixed;
2. temperature trend/range;
3. precipitation probability/range;
4. wind shift/change;
5. transition timing window;
6. confidence;
7. supporting evidence;
8. optional fictional operational recommendation.

Inputs should prefer bounded graphical/semantic controls over free text.

Free text is not required for v1.

## Confidence

Confidence must be understandable as "how certain are you given the evidence?" rather than a score multiplier.

Use an explicit bounded scale with semantic labels. Exact labels are resolved in Figma/content design, but the scale must avoid implying impossible precision.

## Commit forecast

Before commit, summarize the learner's forecast.

After commit:
- freeze that forecast as the comparison artifact;
- do not reveal the future immediately;
- provide a clear "Advance time" action.

## Advance time

Advancing time should be one of the most satisfying moments in the game.

The visual system may show:
- boundary movement;
- station updates;
- pressure/temperature changes;
- precipitation changes;
- wind change.

The state transition itself is deterministic and instant; animation only presents it.

Reduced motion uses a crisp snapshot transition plus explicit change summaries.

## Verification

Show predicted vs observed conditions side-by-side or in a strongly comparable arrangement.

Separate:

- what evidence the learner used;
- what happened;
- forecast error/range;
- confidence;
- causal explanation.

Avoid giant red X / "wrong" language.

Useful phrasing is evidence-based: "The front arrived earlier than your window" or "Your precipitation range matched, but confidence was higher than the evidence supported."

## Revision

Allow the learner to:
- inspect evidence again;
- identify what changed;
- revise the forecast or replay from a defined checkpoint.

Revision is a first-class loop, not a punishment screen.

## Debrief

The debrief should communicate:

- one or more causal relationships the mission demonstrated;
- how evidence supported the forecast;
- what uncertainty remained;
- the learner's improvement/revision if applicable;
- replay/next mission.

Do not show a leaderboard.

## Tutorial strategy

Mission 1:
- contextual highlights;
- one-time callouts;
- short explanations at point of need;
- progressive hint ladder.

Hints:
1. remind the learner where relevant evidence lives;
2. ask a guiding question;
3. identify a useful pattern;
4. only as a final recovery step, explain the relationship without filling the forecast for the learner.

Later missions reduce scaffolding.

## Responsive composition

### 360–599 px
- one primary surface at a time;
- map and evidence switch via persistent tabs/segmented navigation;
- forecast editor uses full-width step/panel flow;
- no page-level horizontal scrolling.

### 600–1023 px
- map plus collapsible evidence panel;
- forecast summary remains visible when practical.

### 1024 px+
- workstation composition with map + evidence/forecast panel;
- avoid excessive empty dashboard chrome.

## Keyboard model

- predictable document order;
- no canvas-only controls;
- station list provides equivalent navigation to clicking markers;
- map-layer toggles are native controls;
- focus moves intentionally on major screen changes;
- Escape closes non-modal overlays where appropriate;
- no keyboard trap.

## Feedback model

Each significant action has:
- immediate visual state feedback;
- optional restrained audio when useful;
- accessible status update only when it provides meaningful information.

Avoid repetitive screen-reader announcements during animated weather transitions.

## Visual-quality gate

Before WC-07/WC-08:
- Figma must establish a production-fidelity representative screen;
- all major states must have visual hierarchy;
- dense evidence must be tested at phone/tablet/desktop widths;
- no placeholder/default-browser styling may be treated as production direction.
