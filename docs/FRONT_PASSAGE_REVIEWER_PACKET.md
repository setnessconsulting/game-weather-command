# WC-04 Front Passage - Reviewer Packet (GAME-341)

This packet is the decision companion to `docs/FRONT_PASSAGE_SCIENCE_REVIEW.md`. It was regenerated
after the second independent review (findings F11-F21) was remediated at `contentVersion` `-3`/`-4`.
Every per-scenario fact below is generated from the shipped content (and cross-checked against
`tests/fixtures/goldenObservationMatrix.json`), not transcribed from prose.

## 1. What you are being asked to produce

A disposition for each of the four canonical Front Passage scenarios, plus explicit dispositions for the
open items in §6. The review criteria are the twelve rows in §5; the source basis you can check without
leaving this packet is §4; the exact content under review is scope-locked in §2.

**This packet is the input to the human review, not its result.** It does not claim that any human has
reviewed anything, and it does not change `scienceReviewStatus` on any scenario.

## 2. Scope lock

**The binding scope is the content versions and the three file hashes below.** Those are what you are
reviewing. Commit SHAs are recorded as provenance only: a documentation-only change moves `main`
without altering a byte of the reviewed content, so a newer `main` on its own does **not** mean this
packet is stale. If a content version or one of the hashes has changed, stop and ask for a regenerated
packet.

| Item | Value |
| --- | --- |
| Repository | `setnessconsulting/game-weather-command` |
| **Scenario content (binding)** | `wc04-guided-cold-front-3`, `wc04-independent-cold-front-3`, `wc04-warm-front-4`, `wc04-uncertain-boundary-3` |
| **`src/scenarios/frontPassageScenarios.ts` (binding)** | git blob `c5770338321553d3dde288fc83b45934d98fc3ee`, sha256 `8f578c3bcd02a776445bc260e2bd6c1f1ea3dc4f38367aecaee0238ee6b6d6a8` |
| **`src/scenarios/schema.ts` (binding)** | sha256 `82941fbf043d9b07deed875740b5cec376a9ba644a1f1aee7cc0dff374732692` |
| **`src/scenarios/scienceSources.ts` (binding)** | sha256 `4fb9170933b4371f54ca2bc4aa0b0398693c75c81dcaac4550227f905f2c3089` |
| Reviewed PRs (provenance) | #6 coherence remediation, merged `81a3e1f8f4b13fc6eba09550875fd625f69f2374`; #7 replay conformance, merged `468d4e182279aa06e79cf50d18a6f0731539d919`; #8 first packet, merged `0f08119dd955b8d0244be1881762dd2da242817f`; #10 F11-F21 remediation (this packet's content) |
| CI evidence | runs `35665212364` (PR #6), `35666860623` (PR #7), `35667360177` (PR #8): verify + browser + nested-host all PASS. Re-run after the F11-F21 remediation is merged. |

### Reproducing every claim

```bash
npm ci
npm run verify        # typecheck, lint, unit tests + coverage, architecture purity, build, privacy
npm run test:e2e      # browser E2E
npm run test:host     # nested-host E2E
npm run test:golden:regenerate   # re-locks tests/fixtures/goldenObservationMatrix.json from shipped content
```

Named tests that back this packet:

| Claim | Test |
| --- | --- |
| Front reaches each station inside its change window | `tests/scenarios/frontPassageScenarios.test.ts` → "places the front at each station inside that station's authored change window" |
| Transition width matches front speed across the window | same file → "derives transition width from front speed and window duration" |
| Warm front is materially more gradual | same file → "keeps the warm front materially more gradual than either cold front" |
| Station rain matches band coverage at every station/minute | same file → "makes station precipitation agree with the band at every station and minute" |
| Uncertain mission clears when the band leaves | same file → "clears the uncertain mission's rain once the band leaves the region" |
| Golden traces for every station at every step | `tests/scenarios/goldenObservationMatrix.test.ts` (3 tests) + `tests/fixtures/goldenObservationMatrix.json` |
| Authored incoherence fails closed | `tests/domain/scenarioCoherence.test.ts` + `tests/scenarios/frontPassageScenarios.test.ts` → "WC-04 authored coherence fails closed" (7 tests) |
| Deterministic replay of canonical content | `tests/scenarios/canonicalReplay.test.ts` (8 tests) |
| Seeded uncertainty is real but scoped | same file → "lets the authored seed move only the scenarios that declare observational noise" |
| Accepted envelopes contain the observed window | `tests/scenarios/frontPassageScenarios.test.ts` → "rejects an accepted envelope that excludes the observed transition window" |

---

## 3. The content you are reviewing

Timeline is 30-minute steps for every mission. `Front reaches x` is the simulation minute at which the
authored boundary crosses that station's longitude; it must fall inside the station's change window.

**Derived dimensions (F12/F13 remediation).** Station *precipitation* is computed from the authored
band geometry (a station reports rain exactly while a band centre is inside the band's
`footprintRadius` of it, scaled by current intensity), and station *pressure tendency* is computed
as the change over the preceding 3 h of the produced pressure trajectory. Neither is authored per
station; the schema rejects authored values fail-closed. The `dP/3h` and `precip` columns below are
therefore kernel-derived outputs, not authored deltas.

### 3.1 Cold Front Shift — `guided-cold-front-shift`

- contentVersion `wc04-guided-cold-front-3`, seed `2026092101`, max 240 min
- Objective: *"Forecast when the main weather change will reach Central Station and explain the evidence supporting that forecast."*
- Front: `x(t) = 0.09 + 0.12 × step`, transitionWidth `0.12`. Leaves the region at ≈ 227 min.
- Precipitation band `frontal-band`: starts at x `0.09`, moves with the front, 4 mm/h decaying 0.1/step,
  footprintRadius `0.13`.

| Station | x | Change window | Front reaches x | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| West Station | 0.22 | 30–60 | 32.5 min | −7 | +4 | −18 | +75 | +3 |
| Central Station | 0.50 | 90–120 | 102.5 min | −7 | +4 | −18 | +75 | +3 |
| East Station | 0.78 | 150–180 | 172.5 min | −7 | +4 | −18 | +75 | +3 |

Initial observations (precipitation and tendency are derived; see above):

| Station | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- |
| West Station | 22 | 1007 | 76 | 185 | 4 |
| Central Station | 23 | 1006 | 78 | 190 | 4 |
| East Station | 24 | 1005 | 80 | 195 | 5 |

Post-passage clearing: `west-clearing` 90–150, `central-clearing` 150–210, `east-clearing` 210–240
(RH −8 each). No observational noise.

Central Station golden trace (dP/3h and precip derived):

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 23 | 1006 | 0 | 78 | 190 | 4 | 0 |
| 60 | 23 | 1006 | 0 | 78 | 190 | 4 | 0 |
| 120 | 16 | 1010 | +4 | 60 | 265 | 7 | 1.662 |
| 180 | 16 | 1010 | +4 | 56 | 265 | 7 | 0 |
| 240 | 16 | 1010 | 0 | 52 | 265 | 7 | 0 |

Accepted range: arrival 90–120 min, ΔT −8…−5 °C, precip probability 60–90 %, wind 240–300°, confidence
`medium|high`. Evidence available at minutes 0 (stations), 30 (pressure trend, front position), 60
(precipitation band).

### 3.2 Front Timing Challenge — `independent-cold-front-variant`

- contentVersion `wc04-independent-cold-front-3`, seed `2026092102`, max 300 min
- Objective: *"Use the station sequence and boundary motion to forecast Central Station without tutorial callouts."*
- Front: `x(t) = 0.08 + 0.10 × step`, transitionWidth `0.10`. Leaves the region at ≈ 276 min.
- Precipitation band `broken-frontal-showers`: 2.5 mm/h decaying 0.08/step, footprintRadius `0.13`.

| Station | x | Change window | Front reaches x | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pine Station | 0.32 | 60–90 | 72 min | −6 | +4 | −14 | +85 | +2.5 |
| Lake Station | 0.52 | 120–150 | 132 min | −6 | +4 | −14 | +85 | +2.5 |
| Ridge Station | 0.72 | 180–210 | 192 min | −6 | +4 | −14 | +85 | +2.5 |

Initial observations:

| Station | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- |
| Pine Station | 20 | 1009 | 66 | 175 | 5 |
| Lake Station | 22 | 1008 | 69 | 185 | 5 |
| Ridge Station | 23 | 1007 | 72 | 190 | 6 |

Post-passage drying: `west-drying` 120–180, `central-drying` 180–240, `east-drying` 240–300 (RH −6
each). No observational noise.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 22 | 1008 | 0 | 69 | 185 | 5 | 0 |
| 60 | 22 | 1008 | 0 | 69 | 185 | 5 | 0 |
| 120 | 22 | 1008 | 0 | 69 | 185 | 5 | 1.231 |
| 150 | 16 | 1012 | +4 | 55 | 270 | 7.5 | 0.935 |
| 180 | 16 | 1012 | +4 | 55 | 270 | 7.5 | 0 |
| 240 | 16 | 1012 | 0 | 49 | 270 | 7.5 | 0 |
| 300 | 16 | 1012 | 0 | 49 | 270 | 7.5 | 0 |

Accepted range: arrival 120–150 min, ΔT −8…−4 °C, precip probability 45–75 %, wind 240–300°, confidence
`medium|high`. Evidence at minutes 60 (station sequence, front motion), 90 (showers).

### 3.3 Gradual Change — `warm-front-gradual-change`

- contentVersion `wc04-warm-front-4`, seed `2026092103`, max 300 min
- Objective: *"Distinguish a gradual warm-front pattern from the sharper cold-front missions and forecast the Central Station transition."*
- Front: `x(t) = 0.06 + 0.10 × step`, **transitionWidth `0.30`** — 2.5× the guided cold front, which is what
  makes "gradual" quantitative rather than decorative. Leaves the region at ≈ 282 min.
- Precipitation band `broad-light-rain`: starts at x `0.10` (i.e. **ahead of** the front, matching NWS
  "precipitation along and ahead of" a warm front), 2.2 mm/h decaying 0.05/step, footprintRadius `0.13`.

| Station | x | Change window | Front reaches x | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Meadow Station | 0.26 | 30–120 | 60 min | +5 | −2 | +12 | +50 | +2 |
| Valley Station | 0.53 | 90–180 | 141 min | +5 | −2 | +12 | +50 | +2 |
| Grove Station | 0.80 | 150–240 | 222 min | +5 | −2 | +12 | +50 | +2 |

Initial observations:

| Station | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- |
| Meadow Station | 16 | 1015 | 65 | 105 | 3 |
| Valley Station | 15 | 1016 | 62 | 110 | 3 |
| Grove Station | 14 | 1017 | 60 | 115 | 3 |

No post-passage rain-easing effects: rain is band-derived and ends as the band moves on. No
observational noise.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 15 | 1016 | 0 | 62 | 110 | 3 | 0 |
| 60 | 15 | 1016 | 0 | 62 | 110 | 3 | 0 |
| 120 | 16.667 | 1015.333 | −0.667 | 66 | 126.667 | 3.667 | 1.538 |
| 180 | 20 | 1014 | −2 | 74 | 160 | 5 | 0 |
| 240 | 20 | 1014 | −0.667 | 74 | 160 | 5 | 0 |
| 300 | 20 | 1014 | 0 | 74 | 160 | 5 | 0 |

Accepted range: arrival **90–180 min** (aligned to the observed window; was 120–180), ΔT +3…+7 °C,
precip probability 60–85 %, wind 130–190°, confidence `medium`. Evidence at minutes 60 (trends,
boundary), 90 (broad rain).

### 3.4 Uncertain Timing — `uncertain-boundary-variant`

- contentVersion `wc04-uncertain-boundary-3`, seed `2026092104`, max 300 min
- Objective: *"Make a defensible forecast when the direction of change is visible but exact timing and precipitation are less certain."*
- Front: `x(t) = 0.06 + 0.10 × step`, transitionWidth `0.20`. Leaves the region at ≈ 282 min.
- Precipitation band `patchy-rain`: 1.8 mm/h decaying 0.05/step, footprintRadius `0.13`.

| Station | x | Change window | Front reaches x | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cedar Station | 0.38 | 90–150 | 96 min | −4.5 | +2.5 | −10 | +55 | +2 |
| Harbor Station | 0.56 | 120–180 | 150 min | −4.5 | +2.5 | −10 | +55 | +2 |
| Field Station | 0.74 | 180–240 | 204 min | −4.5 | +2.5 | −10 | +55 | +2 |

Initial observations:

| Station | T | P | RH | dir | spd |
| --- | --- | --- | --- | --- | --- |
| Cedar Station | 20 | 1010 | 70 | 165 | 4 |
| Harbor Station | 21 | 1009 | 72 | 170 | 4.5 |
| Field Station | 22 | 1008 | 74 | 175 | 5 |

Observational noise (seeded, deterministic): temperature ±0.5 °C, pressure ±0.4 hPa, wind direction ±8°.
Noise is applied only once a station's change has begun.

**No post-passage clearing effects exist in this mission** — rain is band-derived and ends when the
band leaves the region (F9 remediation via F12). Every station is dry at minute 300.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 21 | 1009 | 0 | 72 | 170 | 4.5 | 0 |
| 60 | 21 | 1009 | 0 | 72 | 170 | 4.5 | 0 |
| 120 | 21 | 1009 | 0 | 72 | 170 | 4.5 | 0.315 |
| 180 | 16.760 | 1011.535 | +2.535 | 62 | 229.187 | 6.5 | 0.295 |
| 240 | 16.284 | 1011.260 | +1.331 | 62 | 227.598 | 6.5 | 0 |
| 300 | 16.012 | 1011.432 | −0.045 | 62 | 227.218 | 6.5 | 0 |

Accepted range: arrival 120–210 min, ΔT −6…−2 °C, precip probability 35–70 %, wind 200–250°, confidence
`low|medium`. Evidence at minutes 60 (trends, boundary), 90 (patchy rain).

### 3.5 Model boundaries shipped to the learner

All four missions declare, as learner-facing: `fictional-region` (synthetic stations and normalized
coordinates, not a live location), `pedagogical-dynamics` (authored causal rules, not a numerical
fluid-dynamics model), `bounded-precipitation` (simplified evidence bands, no cloud microphysics or
convection), and `schematic-front-geometry` (straight translating boundaries; real fronts curve, connect
to low-pressure centres, and travel in other directions).

---

## 4. Source basis

Quoted so you can check the authored relationships without leaving this packet. Full URLs and the
per-relationship mapping are in `src/scenarios/scienceSources.ts` (which now cites the pages the quotes
actually come from — F18).

**NGSS MS-ESS2-5** (`nextgenscience.org/pe/ms-ess2-5-earths-systems`) — learners collect and use data on
temperature, pressure, humidity, precipitation and wind to explain how the movement and interaction of
air masses changes weather; forecasts are probabilistic; the assessment boundary avoids requiring recall
of cloud-type names or weather-map symbols.

**NWS, "Basic Discussion on Pressure"** (`weather.gov/lmk/basic-fronts`):

> "A front represents a boundary between two air masses that contain different temperature, wind, and
> moisture properties. … Air normally is warmer ahead of a cold front and colder behind it. With a cold
> front, cold air advances and displaces the warm air since cold air is more dense (heavier) than warm
> air."

> "Where the two air masses meet, convergence often occurs which can result in upward motion of air
> parcels. If the air contains enough moisture, rain can occur."

> "Relatively cool or cold air is present ahead of a warm front with warmer air behind the front, i.e.,
> the opposite from that of cold fronts. … If enough moisture is present, this can result in
> precipitation along and ahead of the front. With a warm front, the cool air ahead of it must retreat
> before the warm air behind it can advance."

**NOAA / NESDIS, "How to read Surface Weather Maps"** (`noaa.gov/jetstream/wxmaps`):

> "Fronts are usually detectable at the surface in a number of ways: winds often 'converge' or come
> together at the fronts, temperature differences can be quite noticeable from one side of a front to
> the other side, and the pressure on either side of a front can vary significantly."

> "Phrases like 'ahead of the front' and 'behind of the front' refer to a front's motion — being 'behind
> the cold front' means being inside the cold air mass, and being 'ahead of the cold front' means being
> in the warm air mass the cold air mass is displacing as it moves."

---

## 5. The twelve criteria, with the evidence for each

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Causal correctness | Pass | Cold fronts: T falls, P rises, tendency (derived) reverses 0 → +4 and back, RH dries, wind veers S → W, temporary rain band straddling passage. Warm front: T and RH rise, P eases then steadies, tendency derived from the trajectory, wind veers E-SE → S-SE, rain along/ahead of the front. |
| 2 | Variable direction and magnitude | Pass with note | Directions match §4. Magnitudes are synthetic but plausible. **F5** concerns the post-frontal wind sector on the uncertain mission. |
| 3 | Timing relationships | Pass | Front crosses each station inside its change window (§3); enforced fail-closed by `assertScenarioCoherence`. Station rain matches band coverage at every station/minute (F12); tendency matches the pressure trajectory (F13). |
| 4 | Cold vs warm distinction | Pass | Cold front: 6–7 °C in a 30 min window. Warm front: 5 °C across 90 min with transitionWidth 0.30 vs 0.10–0.12. |
| 5 | Precipitation language not universal | Pass | Debrief text uses "band", "broken showers", "broader light-rain signal"; the precipitation simplification is learner-facing; station rain is band-derived. |
| 6 | Forecast ranges | Pass | `transitionArrivalMinute` is defined (F10); every accepted range contains its target station's observed window and fits its forecast window, enforced fail-closed (F14). |
| 7 | Confidence calibration | Pass | Defensible confidence narrows from `medium\|high` (guided) to `low\|medium` (uncertain). |
| 8 | Deterministic uncertainty | Pass | Seeded PRNG in the domain layer; canonical replay test proves the seed moves only the noise-declaring mission. See **F6**. |
| 9 | Debrief explanations | Pass | Each debrief links evidence IDs to outcome dimensions; checked against corrected front timing. **F9 remediated** (band-derived clearing). |
| 10 | Model boundaries | Pass | Four learner-facing boundaries (§3.5). |
| 11 | No live/operational implication | Pass | Fictional region, synthetic stations, no live feeds; objectives are scenario-bounded. |
| 12 | Exact golden traces | Pass | Every station at every step of all four missions is locked in `tests/fixtures/goldenObservationMatrix.json` and asserted against the live kernel (F16); replay conformance suite underneath. |

---

## 6. Open items that need your decision

These are the only places where the technical review did **not** reach a defensible conclusion on its
own. F9 and F10 were remediated in code (band-derived clearing; defined and enforced
`transitionArrivalMinute`); they appear here because a canonical content change of that kind should be
*confirmed* by the human reviewer, not merely assumed.

### F9 — MEDIUM — the uncertain mission never clears after the front passes (REMEDIATED in code; confirm)

The uncertain mission has **no follow-up effects at all**. Before the F12 remediation, every station
therefore held +2.5 mm/h to the end of the timeline, contradicting the cold-front relationship the
mission cites. Station precipitation is now band-derived: the band leaves the region by the end of the
timeline, so every station is dry at minute 300 — the same clearing behaviour the other missions model
with follow-up effects, now guaranteed by construction.

**Your call:** accept the band-derived clearing as the mission's behaviour ☐ accept ☐ require authored
clearing effects instead ☐ other: __________

### F10 — MEDIUM — `transitionArrivalMinute` was undefined and the four missions disagreed (REMEDIATED in code; confirm)

`transitionArrivalMinute` is now defined as the authored accepted envelope for the **observed
transition window** (half-maximum sustained temperature-change span) at the target station, and
`parseWeatherScenario` fails closed unless the envelope contains that window. The warm-front envelope
was aligned to its observed window (90–180). All four missions now satisfy the rule.

| Mission | Observed window | Accepted arrival range | Contains window? |
| --- | --- | --- | --- |
| guided | 90–120 | 90–120 | yes |
| independent | 120–150 | 120–150 | yes |
| warm | 90–180 | 90–180 | yes |
| uncertain | 120–180 | 120–210 | yes |

**Your call:** confirm the definition and the four envelopes ☐ confirm ☐ require changes ☐ other: __________

### F5 — LOW — post-frontal wind sector on the uncertain mission

The guided (265°) and independent (270°) missions settle westerly/north-westerly behind the front. The
uncertain mission settles at 217–235° with an accepted sector of 200–250°, i.e. south-westerly. The
cited sources describe convergence, temperature contrast and pressure differences at fronts; none of
the quoted passages directly states a post-frontal wind direction, so no source claim is made. The
south-westerly sector is model-defensible for a deliberately weak, broad boundary — a weak front
produces a weaker veer, and it is consistent with the smaller authored temperature and pressure deltas
— but it is a science-authoring judgment call.

**Your call:** ☐ accept as a deliberate weak-front signature ☐ require a stronger veer ☐ other: __________

### F6 — LOW — observational noise exists only after a transition starts

Authored noise is applied only once a station's change has begun, so before minute 90 the uncertain
mission's "noisy evidence" is perfectly clean, and its first evidence drop is available at minute 60.
The uncertainty framing therefore rests on the broad accepted range and the wide transition zone rather
than on pre-frontal observation scatter.

**Recommendation:** decide during WC-05/WC-06 whether to author pre-frontal variability. This is a design
question rather than a wrong value.

**Your call:** ☐ accept for v1 ☐ require pre-frontal variability ☐ other: __________

### F7 — informational — `acceptedRanges` ship to the learner runtime

They are envelopes rather than a hidden scalar answer key, which satisfies the "no hidden answer key"
rule, but the UI must never surface them before forecast commitment. Recorded as a WC-06 verification
obligation. No action needed from you beyond awareness.

---

## 7. Decision worksheet

**Reviewer identity and role:** ____________________________________________

**Date:** ____________  **Content versions reviewed:** `wc04-guided-cold-front-3`,
`wc04-independent-cold-front-3`, `wc04-warm-front-4`, `wc04-uncertain-boundary-3` (all four)  ☐ confirmed

**Source set reviewed:** ☐ NGSS MS-ESS2-5 ☐ NWS basic-fronts ☐ NOAA/NESDIS weather maps
☐ other: __________

**Findings by scenario**

| Scenario | Accept | Accept with note | Reject | Finding |
| --- | --- | --- | --- | --- |
| Guided Cold Front Shift | ☐ | ☐ | ☐ | |
| Independent Cold Front Variant | ☐ | ☐ | ☐ | |
| Warm Front / Gradual Change | ☐ | ☐ | ☐ | |
| Uncertain Boundary (Uncertain Timing) | ☐ | ☐ | ☐ | |

**Open-item dispositions:** F9 ☐ accept band-derived clearing ☐ require authored clearing  ·
F10 ☐ confirm definition + envelopes ☐ require changes  ·  F5 ☐ accept ☐ change  ·  F6 ☐ accept ☐ change

**Required remediation (if any):** ____________________________________________

**Final disposition:** ☐ accept  ☐ accept with noted limitations  ☐ reject with findings

---

## 8. What happens after a disposition of accept

1. Update the four scenarios from `scienceReviewStatus: "pending-independent"` to `"independent-reviewed"`,
   bumping `contentVersion` and recording the reviewer identity/role and the reviewed versions in
   `docs/FRONT_PASSAGE_SCIENCE_REVIEW.md`.
2. Re-run the complete verification suite (`npm run verify`, `npm run test:e2e`, `npm run test:host`).
3. Open and review the PR, merge only when green, and record the exact merge SHA and CI run in GAME-341.
4. Transition **GAME-341 to Done** and record the reviewer evidence on the issue.
5. Unblock **GAME-342 / WC-05** and **GAME-343 / WC-DESIGN**, which the Jira blocker links currently hold.

If the disposition is reject or accept-with-notes, the findings become remediation work against GAME-341
and the gate stays open.

---

## 9. What this packet is not

It is not a science approval, not a substitute for reading `src/scenarios/frontPassageScenarios.ts`, and
not evidence that a human reviewed anything. It is the accumulated evidence a human needs in order to
review the content properly and quickly.
