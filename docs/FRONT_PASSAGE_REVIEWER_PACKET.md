# WC-04 Front Passage — Reviewer Packet (GAME-341)

This packet exists to let a **human** reviewer perform the required science sign-off on the canonical
Weather Command v1 scenarios quickly and with real evidence. Everything numeric in sections 3 and 6 is
generated from the shipped scenario content, not transcribed from prose.

Read `docs/FRONT_PASSAGE_SCIENCE_REVIEW.md` for the full defect/remediation history. This packet is the
*decision* document: what to check, what is already proven, and what still needs a human call.

---

## 1. What you are being asked to produce

GAME-341 requires a separate reviewer to record:

1. reviewer identity and role;
2. the source set reviewed;
3. the scenario content version(s) reviewed;
4. findings by scenario;
5. any required remediation;
6. a final disposition.

A valid disposition is one of: **accept**, **accept with noted limitations**, or **reject with
findings**. Section 7 is a worksheet you can fill in directly.

**This packet is not an approval.** The technical review it summarises was performed by an AI session.
GAME-336 states that human judgments about clarity and age-appropriateness remain human evidence and
that automated or AI checks may not fabricate that approval.

---

## 2. Scope lock

**The binding scope is the content versions and the three file hashes below.** Those are what you are
reviewing. Commit SHAs are recorded as provenance only: a documentation-only change moves `main`
without altering a byte of the reviewed content, so a newer `main` on its own does **not** mean this
packet is stale. If a content version or one of the hashes has changed, stop and ask for a regenerated
packet.

| Item | Value |
| --- | --- |
| Repository | `setnessconsulting/game-weather-command` |
| **Scenario content (binding)** | `wc04-guided-cold-front-2`, `wc04-independent-cold-front-2`, `wc04-warm-front-2`, `wc04-uncertain-boundary-2` |
| **`src/scenarios/frontPassageScenarios.ts` (binding)** | git blob `bb73e96526fb51dbd2afd27f12d46fd22d100e6c`, sha256 `3f25fa5b9b992c8f21da28b5b141764378ee2ac32a5742f0894a4c43acc92950` |
| **`src/scenarios/schema.ts` (binding)** | sha256 `9ee4729971e1bea06254144c6b256c6f64ac9dabf0749857e87f834d50e8cee5` |
| **`src/scenarios/scienceSources.ts` (binding)** | sha256 `f2de0e5f5f580f5f95ff89a8f9a1fe2285c3212ce10092c6055e5d89c6c3f35d` |
| Reviewed PRs (provenance) | #6 coherence remediation, head `747d82f37e007033203abba3da35220ba4938f9d`, merged `81a3e1f8f4b13fc6eba09550875fd625f69f2374`; #7 replay conformance, head `d2e56649927ec78c7bc14f3ad43cdd1f02cc6992`, merged `468d4e182279aa06e79cf50d18a6f0731539d919`; #8 this packet |
| CI evidence | run `35665212364` (PR #6), run `35666860623` (PR #7), run `35667360177` (PR #8): verify + browser + nested-host all PASS |

### Reproducing every claim

```bash
npm ci
npm run verify        # typecheck, lint, unit tests + coverage, architecture purity, build, privacy
npm run test:e2e      # browser E2E
npm run test:host     # nested-host E2E
```

Named tests that back this packet:

| Claim | Test |
| --- | --- |
| Front reaches each station inside its change window | `tests/scenarios/frontPassageScenarios.test.ts` → "places the front at each station inside that station's authored change window" |
| Transition width matches front speed across the window | same file → "derives transition width from front speed and window duration" |
| Warm front is materially more gradual | same file → "keeps the warm front materially more gradual than either cold front" |
| Golden traces for all four missions | same file → the four "locks the … golden trace" tests |
| Authored incoherence fails closed | `tests/domain/scenarioCoherence.test.ts` (12 tests) |
| Deterministic replay of canonical content | `tests/scenarios/canonicalReplay.test.ts` (8 tests) |
| Seeded uncertainty is real but scoped | same file → "lets the authored seed move only the scenarios that declare observational noise" |

---

## 3. The content you are reviewing

Timeline is 30-minute steps for every mission. `Front reaches x` is the simulation minute at which the
authored boundary crosses that station's longitude; it must fall inside the station's change window.

### 3.1 Cold Front Shift — `guided-cold-front-shift`

- contentVersion `wc04-guided-cold-front-2`, seed `2026092101`, max 240 min
- Objective: *"Forecast when the main weather change will reach Central Station and explain the evidence supporting that forecast."*
- Front: `x(t) = 0.09 + 0.12 × step`, transitionWidth `0.12`. Leaves the region at ≈ 227 min.
- Precipitation band `frontal-band`: starts at x `0.09`, moves with the front, 4 mm/h decaying 0.1/step.

| Station | x | Change window | Front reaches x | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| West Station | 0.22 | 30–60 | 32.5 min | −7 | +4 | +4 | −18 | +75 | +3 | +4 |
| Central Station | 0.50 | 90–120 | 102.5 min | −7 | +4 | +4 | −18 | +75 | +3 | +4 |
| East Station | 0.78 | 150–180 | 172.5 min | −7 | +4 | +4 | −18 | +75 | +3 | +4 |

Initial observations:

| Station | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| West Station | 22 | 1007 | −2 | 76 | 185 | 4 | 0 |
| Central Station | 23 | 1006 | −2 | 78 | 190 | 4 | 0 |
| East Station | 24 | 1005 | −2 | 80 | 195 | 5 | 0 |

Post-passage clearing: `west-clearing` 90–150, `central-clearing` 150–210, `east-clearing` 210–240
(RH −8, precip −4 each). No observational noise.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 23 | 1006 | −2 | 78 | 190 | 4 | 0 |
| 60 | 23 | 1006 | −2 | 78 | 190 | 4 | 0 |
| 120 | 16 | 1010 | +2 | 60 | 265 | 7 | 4 |
| 180 | 16 | 1010 | +2 | 56 | 265 | 7 | 2 |
| 240 | 16 | 1010 | +2 | 52 | 265 | 7 | 0 |

Accepted range: arrival 90–120 min, ΔT −8…−5 °C, precip probability 60–90 %, wind 240–300°, confidence
`medium|high`. Evidence available at minutes 0 (stations), 30 (pressure trend, front position), 60
(precipitation band).

### 3.2 Front Timing Challenge — `independent-cold-front-variant`

- contentVersion `wc04-independent-cold-front-2`, seed `2026092102`, max 300 min
- Objective: *"Use the station sequence and boundary motion to forecast Central Station without tutorial callouts."*
- Front: `x(t) = 0.08 + 0.10 × step`, transitionWidth `0.10`. Leaves the region at ≈ 276 min.
- Precipitation band `broken-frontal-showers`: 2.5 mm/h decaying 0.08/step.

| Station | x | Change window | Front reaches x | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Pine Station | 0.32 | 60–90 | 72 min | −6 | +4 | +3 | −14 | +85 | +2.5 | +2 |
| Lake Station | 0.52 | 120–150 | 132 min | −6 | +4 | +3 | −14 | +85 | +2.5 | +2 |
| Ridge Station | 0.72 | 180–210 | 192 min | −6 | +4 | +3 | −14 | +85 | +2.5 | +2 |

Initial observations:

| Station | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pine Station | 20 | 1009 | −1.5 | 66 | 175 | 5 | 0 |
| Lake Station | 22 | 1008 | −1.5 | 69 | 185 | 5 | 0 |
| Ridge Station | 23 | 1007 | −1.5 | 72 | 190 | 6 | 0 |

Post-passage drying: `west-drying` 120–180, `central-drying` 180–240, `east-drying` 240–300 (RH −6,
precip −2 each). No observational noise.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 22 | 1008 | −1.5 | 69 | 185 | 5 | 0 |
| 60 | 22 | 1008 | −1.5 | 69 | 185 | 5 | 0 |
| 120 | 22 | 1008 | −1.5 | 69 | 185 | 5 | 0 |
| 180 | 16 | 1012 | +1.5 | 55 | 270 | 7.5 | 2 |
| 240 | 16 | 1012 | +1.5 | 49 | 270 | 7.5 | 0 |
| 300 | 16 | 1012 | +1.5 | 49 | 270 | 7.5 | 0 |

Accepted range: arrival 120–150 min, ΔT −8…−4 °C, precip probability 45–75 %, wind 240–300°, confidence
`medium|high`. Evidence at minutes 60 (station sequence, front motion), 90 (showers).

### 3.3 Gradual Change — `warm-front-gradual-change`

- contentVersion `wc04-warm-front-2`, seed `2026092103`, max 300 min
- Objective: *"Distinguish a gradual warm-front pattern from the sharper cold-front missions and forecast the Central Station transition."*
- Front: `x(t) = 0.06 + 0.10 × step`, **transitionWidth `0.30`** — 2.5× the guided cold front, which is what
  makes "gradual" quantitative rather than decorative. Leaves the region at ≈ 282 min.
- Precipitation band `broad-light-rain`: starts at x `0.14` (i.e. **ahead of** the front, matching NWS
  "precipitation along and ahead of" a warm front), 2.2 mm/h decaying 0.05/step.

| Station | x | Change window | Front reaches x | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Meadow Station | 0.26 | 30–120 | 60 min | +5 | −2 | +1.5 | +12 | +50 | +2 | +2 |
| Valley Station | 0.53 | 90–180 | 141 min | +5 | −2 | +1.5 | +12 | +50 | +2 | +2 |
| Grove Station | 0.80 | 150–240 | 222 min | +5 | −2 | +1.5 | +12 | +50 | +2 | +2 |

Initial observations:

| Station | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Meadow Station | 16 | 1015 | −1 | 65 | 105 | 3 | 0 |
| Valley Station | 15 | 1016 | −1 | 62 | 110 | 3 | 0 |
| Grove Station | 14 | 1017 | −1 | 60 | 115 | 3 | 0 |

Rain eases: `west-rain-eases` 180–240, `central-rain-eases` 240–300 (precip −2 each). No observational
noise.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 15 | 1016 | −1 | 62 | 110 | 3 | 0 |
| 60 | 15 | 1016 | −1 | 62 | 110 | 3 | 0 |
| 120 | 16.667 | 1015.333 | −0.5 | 66 | 126.667 | 3.667 | 0.667 |
| 180 | 20 | 1014 | +0.5 | 74 | 160 | 5 | 2 |
| 240 | 20 | 1014 | +0.5 | 74 | 160 | 5 | 2 |
| 300 | 20 | 1014 | +0.5 | 74 | 160 | 5 | 0 |

Accepted range: arrival 120–180 min, ΔT +3…+7 °C, precip probability 60–85 %, wind 130–190°, confidence
`medium`. Evidence at minutes 60 (trends, boundary), 90 (broad rain).

### 3.4 Uncertain Timing — `uncertain-boundary-variant`

- contentVersion `wc04-uncertain-boundary-2`, seed `2026092104`, max 300 min
- Objective: *"Make a defensible forecast when the direction of change is visible but exact timing and precipitation are less certain."*
- Front: `x(t) = 0.06 + 0.10 × step`, transitionWidth `0.20`. Leaves the region at ≈ 282 min.
- Precipitation band `patchy-rain`: 1.8 mm/h decaying 0.05/step.

| Station | x | Change window | Front reaches x | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cedar Station | 0.38 | 90–150 | 96 min | −4.5 | +2.5 | +1.5 | −10 | +55 | +2 | +2.5 |
| Harbor Station | 0.56 | 120–180 | 150 min | −4.5 | +2.5 | +1.5 | −10 | +55 | +2 | +2.5 |
| Field Station | 0.74 | 180–240 | 204 min | −4.5 | +2.5 | +1.5 | −10 | +55 | +2 | +2.5 |

Initial observations:

| Station | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cedar Station | 20 | 1010 | −0.8 | 70 | 165 | 4 | 0 |
| Harbor Station | 21 | 1009 | −0.8 | 72 | 170 | 4.5 | 0 |
| Field Station | 22 | 1008 | −0.8 | 74 | 175 | 5 | 0 |

Observational noise (seeded, deterministic): temperature ±0.5 °C, pressure ±0.4 hPa, wind direction ±8°.
Noise is applied only once a station's change has begun.

**No post-passage clearing effects exist in this mission** — see open item F9.

Central Station golden trace:

| Minute | T | P | dP/3h | RH | dir | spd | precip |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | 21 | 1009 | −0.8 | 72 | 170 | 4.5 | 0 |
| 60 | 21 | 1009 | −0.8 | 72 | 170 | 4.5 | 0 |
| 120 | 21 | 1009 | −0.8 | 72 | 170 | 4.5 | 0 |
| 180 | 16.834 | 1011.542 | +0.7 | 62 | 222.077 | 6.5 | 2.5 |
| 240 | 16.675 | 1011.110 | +0.7 | 62 | 217.224 | 6.5 | 2.5 |
| 300 | 16.922 | 1011.178 | +0.7 | 62 | 222.583 | 6.5 | 2.5 |

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
per-relationship mapping are in `src/scenarios/scienceSources.ts`.

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

**FAA Balloon Flying Handbook ch. 4** (`faa.gov`) — "A quickly falling barometric pressure bottoms out
during frontal passage, then begins a gradual increase", i.e. the sharp pressure-tendency reversal that
distinguishes cold-front passage.

---

## 5. The twelve criteria, with the evidence for each

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Causal correctness | Pass | Cold fronts: T falls, P rises, tendency reverses −2 → +2, RH dries, wind veers S → W, temporary rain band. Warm front: T and RH rise, P eases, tendency rises to ≈ +0.5, wind veers E-SE → S-SE, rain along/ahead of the front. |
| 2 | Variable direction and magnitude | Pass with note | Directions match §4. Magnitudes are synthetic but plausible. **F5** concerns the post-frontal wind sector on the uncertain mission. |
| 3 | Timing relationships | Pass | Front crosses each station inside its change window (§3); enforced fail-closed by `assertScenarioCoherence`. |
| 4 | Cold vs warm distinction | Pass | Cold front: 6–7 °C in a 30 min window. Warm front: 5 °C across 90 min with transitionWidth 0.30 vs 0.10–0.12. |
| 5 | Precipitation language not universal | Pass | Debrief text uses "band", "broken showers", "broader light-rain signal"; the precipitation simplification is learner-facing. |
| 6 | Forecast ranges | Pass with note | Every accepted range brackets the canonical outcome and fits its forecast window. **F10** notes `transitionArrivalMinute` is undefined. |
| 7 | Confidence calibration | Pass | Defensible confidence narrows from `medium\|high` (guided) to `low\|medium` (uncertain). |
| 8 | Deterministic uncertainty | Pass | Seeded PRNG in the domain layer; canonical replay test proves the seed moves only the noise-declaring mission. See **F6**. |
| 9 | Debrief explanations | Pass | Each debrief links evidence IDs to outcome dimensions; checked against corrected front timing. See **F9**. |
| 10 | Model boundaries | Pass | Four learner-facing boundaries (§3.5). |
| 11 | No live/operational implication | Pass | Fictional region, synthetic stations, no live feeds; objectives are scenario-bounded. |
| 12 | Exact golden traces | Pass | All four locked and replay-verified (§2). |

---

## 6. Open items that need your decision

These are the only places where the technical review did **not** reach a defensible conclusion on its
own. Each has a concrete recommendation so you can accept or reject quickly.

### F9 — MEDIUM — the uncertain mission never clears after the front passes

The guided, independent, and warm-front missions all model post-passage clearing. The uncertain mission
does not: it has **no follow-up effects at all**. Every station therefore reaches +2.5 mm/h and holds it
to the end of the timeline. Cedar Station is fully changed by minute 150 but still reports 2.5 mm/h
steady rain at minute 300 — 150 minutes after the front crossed it at minute 96.

Consequence: the mission's own final third contradicts the cold-front relationship it cites, where rain
is a band associated with passage rather than a permanent state.

**Recommendation:** add clearing effects mirroring the other missions — `west-clearing` 150–210 and
`central-clearing` 180–240 (precip −2.5, RH −5) — and re-lock the uncertain golden trace. This is a
canonical content change and would require `contentVersion` `-3`.

**Your call:** accept as-is (defensible if the intent is sustained broad rain), or approve the
remediation. ☐ accept as-is ☐ approve remediation ☐ other: __________

### F10 — MEDIUM — `transitionArrivalMinute` is undefined, and the four missions disagree

`transitionArrivalMinute` is a load-bearing verification input, but the term is defined nowhere in
`docs/` and the four canonical accepted ranges are not consistent with any single reading:

| Mission | Canonical change window | Accepted arrival range | Onset in range? | Completion in range? |
| --- | --- | --- | --- | --- |
| guided | 90–120 | 90–120 | yes | yes |
| independent | 120–150 | 120–150 | yes | yes |
| warm | 90–180 | 120–180 | **no** (90 < 120) | yes |
| uncertain | 120–180 | 120–210 | yes | **no** (180 < 210) |

Consequence: without a definition, WC-06's verification could mark a defensible forecast wrong (or
right) depending on an undocumented convention.

**Recommendation:** have WC-06 own an explicit definition — for example "the first simulation step at
which the target station's authored change has begun" — and align all four ranges to it as part of the
forecast-verification story, rather than silently inheriting four different conventions.

**Your call:** ☐ accept a documented definition chosen by WC-06 ☐ require alignment now ☐ other: __________

### F5 — LOW — post-frontal wind sector on the uncertain mission

Behind a cold front, the cited sources describe winds typically from the west or north-west. The guided
(265°) and independent (270°) missions land there. The uncertain mission settles at 217–235° with an
accepted sector of 200–250°, i.e. south-westerly. That is defensible for a deliberately weak, broad
boundary — a weak front produces a weaker veer, and it is consistent with the smaller authored
temperature and pressure deltas — but it is a science-authoring judgment call.

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

**Date:** ____________  **Content versions reviewed:** `wc04-*-2` (all four)  ☐ confirmed

**Source set reviewed:** ☐ NGSS MS-ESS2-5 ☐ NWS basic-fronts ☐ NOAA/NESDIS weather maps
☐ other: __________

**Findings by scenario**

| Scenario | Accept | Accept with note | Reject | Finding |
| --- | --- | --- | --- | --- |
| Guided Cold Front Shift | ☐ | ☐ | ☐ | |
| Independent Cold Front Variant | ☐ | ☐ | ☐ | |
| Warm Front / Gradual Change | ☐ | ☐ | ☐ | |
| Uncertain Boundary (Uncertain Timing) | ☐ | ☐ | ☐ | |

**Open-item dispositions:** F9 ☐ accept ☐ remediate  ·  F10 ☐ WC-06 defines ☐ align now
·  F5 ☐ accept ☐ change  ·  F6 ☐ accept ☐ change

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
5. Unblock **GAME-342 / WC-05** and **GAME-343 / WC-DESIGN**, which the Jira blocker links currently hold
   in Backlog.

If the disposition is reject or accept-with-notes, the findings become remediation work against GAME-341
and the gate stays open.

---

## 9. What this packet is not

It is not a science approval, not a substitute for reading `src/scenarios/frontPassageScenarios.ts`, and
not evidence that a human reviewed anything. It is the accumulated evidence a human needs in order to
review the content properly and quickly.
