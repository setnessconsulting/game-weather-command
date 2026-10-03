# Weather Command — As-Built Design Preproduction (WC-DESIGN companion)

**Status: implementation-derived record plus AI-authored design source. No Figma authority is
claimed yet.** A native Figma file key/version now exists and is recorded in
[`FIGMA_HANDOFF.md`](FIGMA_HANDOFF.md) and on GAME-343; that records the artifact only and does not
establish design authority. WC-DESIGN's DoD additionally requires independent review and
reconciliation of that native file against the editable vector source
[`design/figma/weather-command-v1.svg`](../design/figma/weather-command-v1.svg) and against this
as-built record. The sections below describe the system as shipped in WC-07/WC-08; the new design
decisions are proposals until reviewed and implemented.

## 1. Design tokens (`src/styles/tokens.css`)

- Dark "forecast desk" palette: `--bg #08131f`, `--surface #102235`, `--text #f5f8fb`, muted
  secondary text for hierarchy, `--focus #ffd166` (visible focus, never colour-only).
- System colours are **never the only encoding**: `--cold-front`, `--warm-front`, `--other-front`,
  `--precipitation`, `--station` are each paired with a line style, shape, pattern or label (see §4).
- Spacing scale `--space-1…8` (0.25–3 rem); radii `--radius-sm/md/lg/pill`.
- `--tap-target: 2.75rem` (44 px) minimum for interactive elements.
- Motion: `--transition-quick 140ms`, `--transition-calm 260ms`, both `ease-out`; both collapse to
  `0ms` under `prefers-reduced-motion: reduce` (token-level, plus a component-level transition
  override in `mission.module.css`).

## 2. Layout and layer priority

- **Desktop (≥ 60rem):** two-column grid — main workspace `1.55fr`, side rail `0.95fr` (min 18rem).
  Side rail carries time controls + evidence list (the "next useful action" is always beside the
  evidence, not behind a tab).
- **Tablet (< 60rem):** single column; map → station reports → trends stack; time controls and
  evidence follow the workspace.
- **Mobile (≤ 34rem):** reduced panel padding, single-column definition lists, header actions
  left-aligned; station tables scroll horizontally inside `.tableScroll` (no page-level horizontal
  scroll — fixed by `0c8563f` after the 360px E2E caught overflow).
- **Decluttering strategy:** evidence unlocks progressively (`availableAtMinute`); locked evidence is
  listed as "not yet available" with its unlock time rather than rendered disabled; the map legend
  is static text; dense station data lives in tables with `scope` headers, not in the SVG.

## 3. Motion specification

| Transition | Spec | Reduced-motion equivalent |
| --- | --- | --- |
| Front / band / air-mass movement | Interpolated between deterministic snapshots; presentation only, never advances science state | Static per-step positions; no interpolation |
| Station change | Observation values update per step; no tweening of instrument values | Identical (values are stepwise by design) |
| Forecast commit | Calm 260ms ease-out on the commit confirmation; no celebratory animation | Instant state change |
| Time advance | Stepwise clock update; map re-renders from the new snapshot | Identical |
| Verification reveal | Predicted-vs-observed panels appear together; no staggered reveals | Identical |
| Revision | Same commit path as first attempt; attempt index shown textually | Identical |

No flashing/strobing effects exist anywhere; weather changes are state changes, not pulses.

## 4. Non-colour encodings (map and charts)

- Fronts: dash pattern + width + text label per kind — cold `4 2`, warm `1.2 1.6`, bounded
  transition `5 1.5 1.5 1.5`; each also labelled in plain words ("Cold front (dashed line)").
- Precipitation: hatched pattern fill (not just colour) + intensity value printed at the band centre.
- Stations: crossed dot + always-printed name; selected station adds an outer ring **and** the word
  "selected".
- Motion: grey arrow marker (direction of travel), `aria-hidden` (the motion is also described in
  text).
- Verification states: text labels + icons, never colour alone; debrief dimensions are named
  ("supported", "partially supported") with per-dimension detail.

## 5. Interaction-feedback matrix

| Input | Pointer | Keyboard | Touch |
| --- | --- | --- | --- |
| Select station | `onPointerUp` on station group | Station tabs are real `<button>`s with `aria-pressed` | Same buttons; 44px targets |
| Advance time | Time control buttons | Native buttons; focus visible | Native buttons |
| Set minute | Time slider/step controls | Native range/step semantics | Step buttons (no precision drag) |
| Attach evidence | Toggle buttons | Native toggle buttons | Native toggle buttons |
| Open evidence detail | "Open detailed evidence" button | Same | Same |
| Commit forecast | Primary commit button | Native button; form-validated | Native button |
| Play/pause + motion toggle | Toggle buttons | Native buttons | Native buttons |

No essential interaction is hover-only, drag-only, or colour-only. Every map fact is repeated as
text directly below the map (the SVG `aria-label` states this contract).

## 6. Audio-feedback map

`src/audio/index.ts` establishes the presentation-only boundary; **WC-10 owns production audio**.
Planned map (to be validated in WC-10):

| Event | Audio | Rationale |
| --- | --- | --- |
| Forecast commit | Soft confirm tick | Committing is consequential; feedback should be calm, not celebratory |
| Time advance | Very soft clock tick | Marks the step without demanding attention |
| Verification result | None (visual only) | Results need reading, not reacting; silence avoids shame/failure framing |
| Errors/invalid input | None (inline text) | Errors are explained in words |

Audio is always mutable and always has an equivalent visual channel; no essential information is
audio-only.

## 7. Predicted-vs-observed comparison design

- Side-by-side panels after verification: each forecast dimension (temperature, precipitation,
  wind, timing) shows the predicted range and the observed value with a per-dimension support
  label — never a single opaque score.
- Timing is shown as the learner's window against the observed window (overlap), with the
  forecast/nowcast/hindcast classification stated in words.
- Error is framed as information: "Your range overlaps it but reaches beyond it", "None of the
  evidence this mission's debrief relies on was attached…". No red-X treatment, no punitive
  language; revision is always available and never shamed.

## 8. Uncertainty / confidence visual language

- Confidence is a explicit learner choice (low/medium/high) with calibration feedback that names
  the direction of miscalibration ("Stating more confidence than the evidence carries is the most
  common calibration error in forecasting").
- Uncertainty is represented by range widths and by the uncertain mission's wider envelopes and
  noisier evidence — never by hiding the range or by a single precise answer.
- The uncertain mission's debrief states that "medium or low confidence can therefore be better
  calibrated than unjustified precision".

## 9. Comparator notes (frozen rubric input for WC-14)

| Comparator | Dimension | Weather Command target |
| --- | --- | --- |
| Smithsonian Weather Lab | Science/causal clarity | Matches the meteorologist role; exceeds in evidence depth (stations, time series, pressure/moisture/wind trends, forecast windows, confidence, predicted-vs-observed verification); no hidden multiple-choice key |
| NWS/NSSL HotSeat | Forecast-workflow authenticity | Captures evidence → forecast → commit → observe → verify; deliberately excludes severe-warning authority and operational complexity |
| Smithsonian Disaster Detector | Game-loop engagement | Evidence changes what the player chooses; more explicit uncertainty, evidence attribution and predicted-vs-observed debrief |
| Mini Metro | Information hierarchy / game feel | Dense evidence remains readable at a glance; calm low-friction interaction; state changes easy to read; non-color encodings first-class |

## 10. Accessibility implementation notes

- Semantic tables with `<caption>` and `scope` for all station/trend/evidence data.
- SVG map is `role="img"` with a summary `aria-label`; every visual fact has a text equivalent.
- Focus: visible `--focus` ring; logical tab order (map → stations → trends → side rail).
- Touch targets ≥ 44px (`--tap-target`); no drag-only essential interaction.
- Reduced motion: token-level transition collapse + component-level override.
- axe-core E2E gate: the smoke spec asserts zero accessibility violations on boot.

## 11. V1 pressure and forecast-state design

The AI-authored responsive board is in [`design/figma/weather-command-v1.svg`](../design/figma/weather-command-v1.svg).
The map adds each station's observed pressure and a short measured tendency label beside its
marker; the station table and the map's accessible name retain the complete value. No isobars or
interpolated pressure field are drawn because the deterministic scenario model does not define
either. During observation and after commitment, the map explicitly says it shows observed
conditions only. A committed result remains hidden until the published comparison time; the
forecast stays in its own panel. Independent reconciliation of the native Figma file against this
record, and human science/comparator review, are still required before this proposal becomes design
authority.
