# WC-04 Front Passage Science Review Dossier

Status: **independent technical/scientific review performed and remediated; human/science sign-off still pending**

This dossier records the evidence used to author the canonical Weather Command v1 scenarios, an
independent technical review of that content, the defects that review found, and the remediation
that closed them. It intentionally does **not** mark the scenarios as independently reviewed. The
scenario data carries `scienceReviewStatus: "pending-independent"` until a separate reviewer signs
off.

## Review record

| Field | Value |
| --- | --- |
| Review type | Independent technical/scientific content review (AI-assisted, **not a human review**) |
| Reviewed content | `wc04-guided-cold-front-1`, `wc04-independent-cold-front-1`, `wc04-warm-front-1`, `wc04-uncertain-boundary-1` |
| Review baseline | `main` @ `323cdec4ff37b3ac187ea8ff2387c7b4ffe3b214` |
| Source set | NGSS MS-ESS2-5; NWS "Basic Discussion on Pressure" (`weather.gov/lmk/basic-fronts`); NOAA/NESDIS "How to read Surface Weather Maps" (`noaa.gov/jetstream/wxmaps`); FAA Balloon Flying Handbook ch. 4 |
| Resulting content | `wc04-guided-cold-front-2`, `wc04-independent-cold-front-2`, `wc04-warm-front-2`, `wc04-uncertain-boundary-2` |

### Explicit limitation

The reviewer is an AI session, not a human. This record establishes that a defensible technical
review occurred, that specific defects were found, and that they were remediated with evidence. It
**is not** the human/science sign-off required by GAME-341 and GAME-336. `scienceReviewStatus`
therefore remains `pending-independent` for all four scenarios, and GAME-341 must not be closed on
the strength of this document alone.

## Curriculum authority

NGSS MS-ESS2-5 requires learners to reason from changing temperature, pressure, humidity,
precipitation, and wind; it emphasizes high-to-low pressure flow, changing weather when air masses
interact, and forecasts expressed within probabilistic ranges. The assessment boundary explicitly
avoids requiring recall of cloud-type names or weather-map/station symbols.

Source:
https://www.nextgenscience.org/pe/ms-ess2-5-earths-systems

Mechanic-to-standard mapping (F19):

| Game mechanic | MS-ESS2-5 element | How it is exercised |
| --- | --- | --- |
| Station/map/trend evidence inspection | SEP-3 Planning and Carrying Out Investigations | v1 provides the data (maps, station records, visualizations) rather than having learners plan an investigation; the clarification statement explicitly permits provided data |
| Evidence -> forecast -> verification loop | CCC-2 Cause and Effect | Every mission requires attributing observed changes to air-mass/boundary movement and checking the attribution against the record |
| Temperature/pressure/humidity/wind/precipitation variables | DCI ESS2.C (The Roles of Water in Earth's Surface Processes) / ESS2.D (Weather and Climate) | All five variables are observed, trended and forecast; ESS2.D's "weather can only be predicted probabilistically" is cited directly for the uncertain mission's objective |
| Probabilistic forecast with confidence | Clarification statement: prediction within probabilistic ranges | Forecasts are ranges with stated confidence; verification scores calibration separately from correctness |
| No symbol-memorization path | Assessment boundary | Success requires reading evidence, not recalling cloud/front symbols; front kinds are labelled in plain language throughout |

## Front relationships

NWS educational material describes:

- cold fronts as cold air advancing into and displacing warmer air ahead of it;
- colder, typically drier air behind a cold front;
- a wind shift and pressure-tendency change with passage;
- possible bands of showers/thunderstorms near a cold front;
- warm fronts as warm air replacing cooler air, with cool air ahead of the front having to retreat
  before the warm air can advance;
- precipitation **along and ahead of** a warm front;
- warm fronts as a more gradual, slantwise transition.

Source:
https://www.weather.gov/lmk/basic-fronts

NOAA/NESDIS grades 5-8 weather-map material reinforces high/low pressure, air flow from high toward
low pressure, convergence and temperature contrast at fronts, and the role of fronts/maps as forecast
evidence. It also states the "ahead of"/"behind" convention used throughout these scenarios: behind
a cold front is inside the cold air mass; ahead of it is the warm air mass being displaced.

Source:
https://www.nesdis.noaa.gov/about/k-12-education/weather-forecasting/how-read-weather-map
https://www.noaa.gov/jetstream/wxmaps

## Findings and disposition

### F1 - HIGH - Front motion disagreed with station change timing (REMEDIATED)

**Defect.** Station observations are derived from authored `stationEffects` windows. Fronts, air
masses, and precipitation bands are moved independently from authored `movement` vectors. Nothing
checked that the two agree, and they did not. In 10 of the 12 station/boundary pairs the front
reached the station far outside that station's authored change window. In two scenarios the front
never reached the eastern station at all inside the scenario timeline.

This is not cosmetic. The guided mission's learner-facing objective is to forecast *when* the main
change reaches Central Station using map evidence, and the `boundary` evidence is tagged
`front-motion`/`timing`. A learner reasoning "the front is still far west, so Central will not change
yet" while Central was already recording a full cold-front signature would be taught the wrong causal
lesson by the game's own evidence layer.

**Evidence (before remediation).**

| Scenario | Station | Authored change window | Front crossing (before) | Verdict |
| --- | --- | --- | --- | --- |
| guided | west | 30-60 | 7.5 | before the window |
| guided | central | 90-120 | 112.5 | ok |
| guided | east | 150-180 | 217.5 | 37.5 min late |
| independent | west | 60-90 | 9.2 | before the window |
| independent | central | 120-150 | 152.3 | after the window |
| independent | east | 180-210 | 286.2 | 76.2 min late |
| warm | west | 30-120 | 10.9 | before the window |
| warm | central | 90-180 | 174.5 | ok |
| warm | east | 150-240 | 338.2 | never reaches it (timeline ends at 300) |
| uncertain | west | 90-150 | 0.0 | before the window |
| uncertain | central | 120-180 | 200.0 | after the window |
| uncertain | east | 180-240 | 400.0 | never reaches it (timeline ends at 300) |

**Remediation.** Boundary and precipitation motion, boundary path origins, air-mass centres, and -
where geometry left no room - station longitudes were re-authored so the front line crosses each
affected station inside that station's change window. Station change windows, deltas, accepted
ranges, evidence, debrief relationships, and the simulation kernel were **not** changed.

| Scenario | Station | Change window | Front crossing (after) |
| --- | --- | --- | --- |
| guided | west / central / east | 30-60 / 90-120 / 150-180 | 32.5 / 102.5 / 172.5 |
| independent | west / central / east | 60-90 / 120-150 / 180-210 | 72.0 / 132.0 / 192.0 |
| warm | west / central / east | 30-120 / 90-180 / 150-240 | 60.0 / 141.0 / 222.0 |
| uncertain | west / central / east | 90-150 / 120-180 / 180-240 | 96.0 / 150.0 / 204.0 |

Every front also now leaves the region inside the scenario timeline rather than stalling short of the
eastern station.

**Regression prevention.** `assertScenarioCoherence` (domain layer) now fails closed when:

1. a boundary-linked station effect claims a passage the authored front motion does not deliver
   inside that effect's window;
2. a boundary's `transitionWidth` does not equal the distance the front travels during that
   station's change window - the station's observation ramp spans the same duration as the front's
   traverse of the transition zone, and the crossing falls inside the ramp window (see F17 for
   the exact guaranteed invariant);
3. a precipitation cell does not move with a modeled front, so the radar layer and the front layer
   cannot disagree about where the band is;
4. a station effect does not author `precipitationRateMmh` or `pressureTendencyHpaPer3h` - both
   are kernel-derived (F12/F13), so an authored value would be silently ignored.

It is wired in at the authored-data boundary (`parseWeatherScenario`), so a bad scenario fixture is
rejected at parse time. The kernel contract is unchanged: the kernel still derives every scientific
value from `stationEffects`, seed, and time.

### F2 - MEDIUM - Front geometry simplification was hidden from the learner (REMEDIATED)

The `bounded-precipitation` model boundary was marked `learnerFacing: false`, and no boundary
described the synthetically straight, zonal fronts used by all four missions. Since the learner must
interpret precipitation evidence and front position to solve the missions, both are things they are
entitled to be told. Both are now learner-facing, and a `schematic-front-geometry` boundary was added
stating that real fronts curve, connect to low-pressure centres, and travel in other directions.

### F3 - MEDIUM - Uncertain-boundary trace was under-locked (REMEDIATED)

The uncertain mission is the one that most depends on deterministic seeded variation, yet its golden
trace locked a single checkpoint. It is now locked at all six checkpoints, with an explicit check that
the settled observation stays within the authored noise amplitude.

### F4 - LOW - Type-unsafe golden-trace helpers (REMEDIATED)

The independent and warm-front trace assertions cast scenarios to the guided scenario's type. The
helper is now typed on `WeatherScenarioV1`, so the four scenario families are checked as themselves.

### F5 - LOW - Post-frontal wind sectors sit at the low end (OPEN - human disposition)

The guided (265 deg) and independent (270 deg) missions settle westerly/north-westerly behind the
front. The uncertain mission settles near 217-235 deg (south-westerly) with an accepted sector of
200-250 deg. The cited sources describe convergence, temperature contrast and pressure differences
at fronts; none of the quoted passages directly states a post-frontal wind direction, so no source
claim is made here. The south-westerly sector is model-defensible for a deliberately weak, broad
boundary - a weak front produces a weaker wind veer - and it is consistent with the smaller authored
temperature/pressure deltas. It is recorded here rather than changed, because revising the canonical
wind answer is a science-authoring decision that belongs to the human reviewer. (See F18 for the
source-register correction this prompted.)

### F6 - LOW - Observational noise only exists once a transition starts (OPEN - forwarded)

`assertSaneObservation`/`observationAt` apply authored `noise` only while a station effect's progress
is greater than zero. Before the first effect begins, the uncertain mission's "noisy evidence" is
perfectly clean, and the first evidence drop is available at minute 60 while West Station does not
begin changing until minute 90. The uncertainty framing therefore relies on the broad accepted range
and the wide transition zone rather than on pre-frontal observation scatter. Whether to add authored
pre-frontal variability is a design decision for WC-05/WC-06; it is recorded, not silently changed.

### F9 - MEDIUM - The uncertain mission never clears after the front passes (REMEDIATED at contentVersion -3; human disposition of the new behaviour recorded)

The guided, independent, and warm-front missions all model post-passage clearing. The uncertain mission
has no follow-up effects at all, so every station reaches +2.5 mm/h and holds it to the end of the
simulation. Cedar Station is fully changed by minute 150 but still reports 2.5 mm/h steady rain at minute
300, 150 minutes after the front crossed it at minute 96. That contradicts the cold-front relationship
the mission cites, where rain is a band associated with passage rather than a permanent state.

**Remediation (applied).** Station precipitation is now derived from the authored band geometry
(see F12): a station reports rain exactly while a band covers it. The uncertain mission's band leaves
the region by the end of the timeline, so every station is dry at minute 300 - the same clearing
behaviour the other three missions model with follow-up effects, now guaranteed by construction
rather than by authored deltas. No new station effects were needed. The human reviewer is asked to
accept this behaviour (or record an alternative disposition) as part of the science sign-off; the
previous "sustained broad rain" reading is no longer the shipped behaviour.

### F10 - MEDIUM - `transitionArrivalMinute` is undefined and the four missions disagree (REMEDIATED at contentVersion -3; human disposition recorded)

`transitionArrivalMinute` is a load-bearing forecast-verification input. It is now defined in
`docs/SCENARIO_SCHEMA.md` and `docs/SCIENCE_MODEL.md` as the authored accepted envelope for the
**observed transition window** (half-maximum sustained temperature-change span) at the target station,
and `parseWeatherScenario` fails closed unless the envelope contains that window.

| Mission | Observed window | Accepted arrival range (at -3) | Contains window? |
| --- | --- | --- | --- |
| guided | 90-120 | 90-120 | yes |
| independent | 120-150 | 120-150 | yes |
| warm | 90-180 | 90-180 (aligned from 120-180) | yes |
| uncertain | 120-180 | 120-210 | yes |

The warm-front envelope was aligned to its observed window (F14) and the invariant is enforced at the
authored-data boundary, so a defensible learner forecast can no longer be displayed beside an envelope
that excludes it. The human reviewer is asked to confirm the per-mission envelopes as part of the
science sign-off.

### F7 - LOW - Accepted ranges ship to the learner runtime (FORWARDED to WC-06)

`acceptedRanges` are part of the scenario payload and therefore reach the browser. They are envelopes,
not a hidden scalar answer key, which satisfies the "no hidden answer key" rule. They must, however,
never be surfaced in the UI before forecast commitment. This is a WC-06 verification obligation and is
recorded here so it is not lost.

### F8 - ACCEPTED (updated for derived tendency) - Warm-front pressure tendency after passage

Ahead of a warm front the pressure falls; after passage the fall typically levels off, and some
sources describe a slight rise. Pressure tendency is now **derived from the produced pressure
trajectory** (F13): the change over the preceding 3 h, clamped at the scenario start. On the warm
mission that reads about -0.7 hPa/3h mid-transition and "steady" after passage - the same
"stabilising" distinction from the sharp post-cold-front rise the mission teaches, now guaranteed to
agree with the pressure chart beside it. Reviewed and accepted against:

- NWS Louisville, "Basic Discussion on Pressure": with a warm front the cool air ahead must retreat
  before warm air can advance; precipitation falls along and ahead of the front.
- Independent educational summaries of warm-front passage describe pressure as stabilising or
  beginning to rise, explicitly *not* the sharp rise seen with a cold front.

(An earlier version of this disposition also quoted the FAA Balloon Flying Handbook ch. 4. That quote
was removed during the F18 source-register correction: the handbook is not in the register and its
exact URL could not be verified, so the disposition stands on the NWS and educational sources above
rather than on an untraceable citation.)

## Second independent review (F11-F21) - remediation record

A second AI-assisted review of the vertical slice recorded findings F11-F21. As with the first review,
this is **not** the human science sign-off; `scienceReviewStatus` remains `pending-independent` on all
four scenarios. Machine-verifiable findings were remediated at `contentVersion` `-3`; items that are
science-authoring or design judgments remain recorded for the human reviewer.

### F11 - HIGH - Learner-visible table disclosed the graded timing answer (REMEDIATED)

`boundaryEta` computed an arrival minute from the same constant-velocity boundary that defines the
graded truth, and the observation panel published it ("Extrapolated arrival at each station") from
minute 0 with a "treat this as rough" caveat that taught the learner to distrust a number that was in
fact exact. **Remediated:** the game no longer prints a computed arrival minute anywhere. Front
position, orientation, motion (direction and speed in region-widths per hour) and station distance
remain as evidence; the note now describes the model honestly ("this model moves the front at a
constant speed; real fronts change speed and direction, so estimate arrival yourself from the map and
the clock"). The evidence facts, the observation table, the tutorial coaching and the summary copy
were all changed with it, and tests now assert that no extrapolated arrival is published. The
learner's own distance-over-speed reasoning is the mission objective; the interface no longer hands
over the answer, including on the uncertain mission where a precise ETA would also have taught false
precision.

### F12 - HIGH - Rendered precipitation band contradicted station precipitation (REMEDIATED)

The band rode the front while each station's rain ramped linearly across its whole change window and
held, so the map and the station record disagreed about when it was raining in 53 of 126
station-steps. **Remediated:** station precipitation is now **derived from the authored band
geometry**. Each cell carries an authored `footprintRadius` (0.13 normalized region units for all four
missions); a station reports precipitation exactly while a band centre is inside that radius, scaled
by current intensity with a linear falloff. The radar-style layer and the station observations are two
renderings of one source of truth and cannot disagree - a property now asserted by test at every
station and minute of all four missions. The schema rejects any station-effect
`precipitationRateMmh` delta fail-closed, so this defect class cannot be re-authored silently.

### F13 - MEDIUM - pressureTendencyHpaPer3h contradicted the pressure series (REMEDIATED)

The authored tendency was independent of the pressure trajectory, so the tendency column read
"falling 2.0 hPa/3 h" beside a flat chart, and on the warm mission reported "rising" while the level
was still falling. **Remediated:** tendency is computed as the change over the preceding 3 h of the
pressure trajectory the kernel actually produces (clamped at the scenario start, so it reads "steady"
before any change). The tendency column, the pressure chart, and the station reports are now one
story. The schema rejects authored `pressureTendencyHpaPer3h` in effect deltas fail-closed, and
station initials no longer carry the field (it is optional and defaults to 0, the kernel's computed
value at minute 0). The warm-front F8 disposition was updated to the derived semantics (see above).

### F14 - MEDIUM - Warm-front accepted envelope excluded the observed onset (REMEDIATED)

The warm envelope was 120-180 against an observed window of 90-180, violating the binding rule the
schema documents. **Remediated:** the envelope was aligned to 90-180 (inside its published 30-210
window), and `parseWeatherScenario` now fails closed unless every accepted envelope contains its target
station's observed transition window - so the shipped content can never again violate the rule the
document calls binding.

### F15 - MEDIUM - The uncertain mission never clears (REMEDIATED via F12)

See F9 above: with precipitation derived from band geometry, the uncertain mission's rain ends when
its band leaves the region, matching the clearing behaviour the other three missions model with
follow-up effects. No new station effects were required; the trace was re-locked at `-3`.

### F16 - MEDIUM - Golden traces locked only 1 of 3 stations (REMEDIATED)

Exact observation values are now locked for **every station at every simulation step** of all four
missions in `tests/fixtures/goldenObservationMatrix.json`, asserted by
`tests/scenarios/goldenObservationMatrix.test.ts` against the live kernel. The matrix is keyed by
scenarioId + contentVersion + seed and can be regenerated with `npm run test:golden:regenerate`
after any content change. A content edit that broke any station trace now fails a locked
expectation. (The engine-level replay conformance suite in `tests/scenarios/canonicalReplay.test.ts`
remains the self-consistency check underneath.)

### F17 - MEDIUM - Documents asserted a coherence invariant the content does not satisfy (REMEDIATED)

`docs/FRONT_PASSAGE_SCIENCE_REVIEW.md` (this file, F1 remediation item 2) and `docs/SCENARIO_SCHEMA.md`
both claimed the station "traverses the authored transition zone exactly across the window over which
its observation ramps". The implementation guarantees equal **duration** plus an in-window crossing,
not interval equality. Both documents were reworded to the guaranteed invariant. No graded outcome was
affected (crossing minus ramp midpoint is -2.5 / +6 / 0 minutes for guided / warm / uncertain Central
and -3 minutes for all three independent stations).

### F18 - MEDIUM - Source register pointed at pages that do not state the attributed relationships (REMEDIATED)

`nws-fronts` cited `weather.gov/jkl/education` (a generic course index) while the quoted front
relationships actually come from `weather.gov/lmk/basic-fronts` (NWS Louisville, "Basic Discussion on
Pressure", verified verbatim during the first review). **Remediated:** the register URL now cites the
page the quotes come from. `ScienceSource` also gained optional `accessedOn`/`reviewedBy` fields so
`reviewed: true` is traceable; all three entries record the 2026-09-21 AI-assisted technical review
and explicitly note it is not the required human science sign-off. The unregistered FAA Balloon
Flying Handbook quote was removed from the F8 disposition rather than cited to an unverifiable URL
(see F8). The human reviewer is asked to confirm the register as part of the sign-off.

### F19 - LOW - MS-ESS2-5 trace omitted the SEP, CCC and DCI elements (REMEDIATED)

The mechanic-to-standard mapping table was added to the Curriculum authority section below. v1
exercises SEP-3 (Planning and Carrying Out Investigations) only through interpreting provided data,
which the MS-ESS2-5 clarification statement explicitly permits; CCC-2 (Cause and Effect) is exercised
by every mission's evidence-to-forecast reasoning; DCI ESS2.C (weather variables) and ESS2.D
("weather can only be predicted probabilistically", cited for the uncertain mission's objective) are
named directly.

### F20 - LOW - "Uncertain" is instrument noise on a deterministic ramp (OPEN - design)

The uncertain mission's underlying truth is a fixed 60-minute ramp per station with +/-0.5 C,
+/-0.4 hPa and +/-8 deg of observational noise plus a wider envelope. This satisfies the letter of the
rule (truth is not randomised after commitment; multiple defensible forecasts fit the ranges) but is
not yet genuine atmospheric ambiguity. Richer ambiguity (two stations implying different front
speeds, an ensemble-style range presented as evidence) is content design for WC-11, recorded here
so it is not lost.

### F21 - LOW - Three smaller observations (PARTIALLY REMEDIATED)

(a) The guided forecast window id `central-next-three-hours` spans 0-150 (2.5 h). Internal
identifier only; renaming would churn traces and refs for no learner-visible gain. Recorded, not
changed. (b) Evidence `learningTags` were rendered to the learner ("tags: pressure, timing") and
evidence quality was recall-only, making "attach everything" a reasoning-free dominant strategy.
**Remediated:** tags now render as prose ("helps with: ..."), and evidence quality is an F1 score
over recall *and* precision (share of attached evidence the debrief actually relies on), so attaching
irrelevant evidence no longer yields full marks once missions carry distractors. Distractor-evidence
authoring itself is WC-11 content work. (c) A commit after the observed change begins is classified
"nowcast", which matches the documented definition; no change.

## Review checklist

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Causal correctness | Pass - cold fronts advance cold/dry air and dry the station behind passage; warm fronts advance warm/moist air with precipitation along and ahead of the front |
| 2 | Station-variable direction and magnitude | Pass except F5 (recorded) - directions match the cited relationships; magnitudes are plausible synthetic pedagogy |
| 3 | Timing relationships | **Found F1, remediated; re-verified at -3** - front, band, and station timing agree by construction and by test, for precipitation as well as temperature/pressure/wind (F12) |
| 4 | Cold-front vs warm-front distinction | Pass - cold-front temperature change is 6-7 C in 30 min; the warm front moves 5 C across 90 min with a 0.30 transition width against 0.10-0.12 for the cold fronts |
| 5 | Precipitation language does not imply universality | Pass - debrief text uses "band", "broken showers", "broader light-rain signal"; the bounded-precipitation boundary is now learner-facing; station rain is band-derived (F12) |
| 6 | Forecast ranges | **Found F10/F14, remediated** - `transitionArrivalMinute` is defined, every accepted range contains its target station's observed window (fail-closed), and each fits its forecast window |
| 7 | Confidence calibration | Pass - defensible confidence widens from `[medium, high]` on the guided mission to `[low, medium]` on the uncertain mission |
| 8 | Deterministic uncertainty | Pass - seeded PRNG in the domain layer; replays reproduce identical observations; the noise key includes `contentVersion`, so a content revision re-draws the stream by design |
| 9 | Debrief explanations | Pass - each debrief links evidence IDs to outcome dimensions and was checked against the corrected front timing; **found F9, remediated at -3** (band-derived clearing) |
| 10 | Model boundaries/simplifications | **Found F2, remediated** |
| 11 | No implication of live or operational forecasting | Pass - fictional region, synthetic stations, no live feeds; objectives are scenario-bounded |
| 12 | Exact deterministic golden traces | **Found F3/F4/F16, remediated** - every station at every step of all four missions is locked in the golden matrix and asserted against the live kernel |

## Canonical replay conformance

GAME-341's acceptance criterion requires that a reviewer can "replay every scenario deterministically".
Before this review that claim was unproven for the canonical content: `replayScenario` and the replay
contract were only exercised against a synthetic kernel fixture in `tests/domain/`, never against the
four shipping scenarios.

`tests/scenarios/canonicalReplay.test.ts` now proves, for every canonical scenario, that:

- a full mission replays to the authored maximum minute, visiting every simulation step exactly once,
  and each replayed checkpoint equals the canonical `stateAtMinute` snapshot;
- identical scenario + seed + action logs produce identical traces;
- the result is invariant to how advance actions are chunked (uneven chunking lands on the same state);
- a serialized trace round-trips, and authoritative state is recomputed from the action log rather than
  trusted from the payload;
- a tampered serialized checkpoint is ignored by `recomputeReplayTrace`;
- replay identity is bound to `contentVersion`, so a trace from superseded science (`-1`) is rejected
  against current science (`-2`) instead of being silently replayed as current;
- outcome facts are reproducible from replay state.

Deterministic uncertainty is also now checked as a property rather than a statement: changing only the
seed leaves the guided, independent, and warm-front observations bit-identical (they declare no
observational noise), and moves the uncertain-boundary observations (which do).

## Golden-trace review

`tests/fixtures/goldenObservationMatrix.json` locks **every station at every simulation step** for all
four missions (F16), asserted against the live kernel by
`tests/scenarios/goldenObservationMatrix.test.ts`; the committed scenario tests additionally assert
the front/station coherence claims directly, independently of the validator's own arithmetic. The
matrix is regenerated with `npm run test:golden:regenerate` after any content change.

Determinism was preserved, not re-derived by hand. Comparing every checkpoint of every station before
and after remediation:

- guided, independent, and warm-front station observations are byte-identical;
- uncertain-boundary station observations changed **only** because `contentVersion` is part of the
  seeded-noise key, so a content revision re-draws that stream by design. The authored deltas, windows,
  and noise amplitudes are unchanged.

Model boundaries now always output values inside their documented ranges, and `assertSaneObservation`
still rejects out-of-range simulated weather rather than clamping it.

## Reviewer packet

`docs/FRONT_PASSAGE_REVIEWER_PACKET.md` is the decision companion to this dossier. It scope-locks the
exact content versions and file hashes, reproduces the per-scenario facts from the shipped content
(rather than transcribing prose), quotes the source basis, maps each of the twelve review criteria to the
test that backs it, and carries a fill-in decision worksheet covering F5, F6, F9, and F10.

## Independent review gate

A separate **human** reviewer must still record:

- reviewer identity/role;
- source set reviewed (the register now cites the pages the quotes actually come from - F18);
- scenario content version(s) - all four are at `contentVersion` `-3`;
- findings by scenario, including disposition of F5 (uncertain post-frontal wind sector), F6
  (pre-frontal observational variability), and confirmation of the F9/F10/F14 remediations
  (band-derived clearing, defined `transitionArrivalMinute`, aligned warm envelope);
- any required remediation;
- final disposition.

Only after that review is complete may the four canonical scenarios change from
`pending-independent` to `independent-reviewed`.

Until then, GAME-341 stays in **Review** and must not be closed as Done.
