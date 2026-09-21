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
   station's change window - the station must traverse the authored transition zone exactly across
   the window over which its observation ramps;
3. a precipitation cell does not move with a modeled front, so the radar layer and the front layer
   cannot disagree about where the band is.

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

Behind a cold front, NWS material and the NOAA jetstream pages describe winds typically from the west
or northwest. The guided (265 deg) and independent (270 deg) missions land there. The uncertain mission
settles near 217-235 deg (south-westerly) with an accepted sector of 200-250 deg. That is defensible
for a deliberately weak, broad boundary - a weak front produces a weaker wind veer - and it is
consistent with the smaller authored temperature/pressure deltas. It is recorded here rather than
changed, because revising the canonical wind answer is a science-authoring decision that belongs to
the human reviewer.

### F6 - LOW - Observational noise only exists once a transition starts (OPEN - forwarded)

`assertSaneObservation`/`observationAt` apply authored `noise` only while a station effect's progress
is greater than zero. Before the first effect begins, the uncertain mission's "noisy evidence" is
perfectly clean, and the first evidence drop is available at minute 60 while West Station does not
begin changing until minute 90. The uncertainty framing therefore relies on the broad accepted range
and the wide transition zone rather than on pre-frontal observation scatter. Whether to add authored
pre-frontal variability is a design decision for WC-05/WC-06; it is recorded, not silently changed.

### F7 - LOW - Accepted ranges ship to the learner runtime (FORWARDED to WC-06)

`acceptedRanges` are part of the scenario payload and therefore reach the browser. They are envelopes,
not a hidden scalar answer key, which satisfies the "no hidden answer key" rule. They must, however,
never be surfaced in the UI before forecast commitment. This is a WC-06 verification obligation and is
recorded here so it is not lost.

### F8 - ACCEPTED - Warm-front pressure tendency turning weakly positive after passage

Ahead of a warm front the pressure falls; after passage the fall typically levels off, and some
sources describe a slight rise. The warm mission authors -1.0 hPa/3h initially and +0.5 hPa/3h after
passage. That reads as "stabilising / beginning to rise" rather than the sharp post-cold-front rise,
which is the distinction the mission is teaching. Reviewed and accepted against:

- NWS Louisville, "Basic Discussion on Pressure": with a warm front the cool air ahead must retreat
  before warm air can advance; precipitation falls along and ahead of the front.
- Independent educational summaries of warm-front passage describe pressure as stabilising or
  beginning to rise, explicitly *not* the sharp rise seen with a cold front.
- FAA Balloon Flying Handbook ch. 4: "A quickly falling barometric pressure bottoms out during frontal
  passage, then begins a gradual increase" - the cold-front case, used to check that the cold-front
  missions' pressure-tendency reversal is the sharper one.

## Review checklist

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Causal correctness | Pass - cold fronts advance cold/dry air and dry the station behind passage; warm fronts advance warm/moist air with precipitation along and ahead of the front |
| 2 | Station-variable direction and magnitude | Pass except F5 (recorded) - directions match the cited relationships; magnitudes are plausible synthetic pedagogy |
| 3 | Timing relationships | **Found F1, remediated** - front, band, and station timing now agree by construction and by test |
| 4 | Cold-front vs warm-front distinction | Pass - cold-front temperature change is 6-7 C in 30 min; the warm front moves 5 C across 90 min with a 0.30 transition width against 0.10-0.12 for the cold fronts |
| 5 | Precipitation language does not imply universality | Pass - debrief text uses "band", "broken showers", "broader light-rain signal"; the bounded-precipitation boundary is now learner-facing |
| 6 | Forecast ranges | Pass - every accepted range brackets the canonical outcome and fits its forecast window |
| 7 | Confidence calibration | Pass - defensible confidence widens from `[medium, high]` on the guided mission to `[low, medium]` on the uncertain mission |
| 8 | Deterministic uncertainty | Pass - seeded PRNG in the domain layer; replays reproduce identical observations; the noise key includes `contentVersion`, so a content revision re-draws the stream by design |
| 9 | Debrief explanations | Pass - each debrief links evidence IDs to outcome dimensions; debrief text was checked against the corrected front timing |
| 10 | Model boundaries/simplifications | **Found F2, remediated** |
| 11 | No implication of live or operational forecasting | Pass - fictional region, synthetic stations, no live feeds; objectives are scenario-bounded |
| 12 | Exact deterministic golden traces | **Found F3/F4, remediated** - all four missions lock exact traces |

## Golden-trace review

The committed tests lock the Central Station trace for all four missions and now additionally assert
the front/station coherence claims directly, independently of the validator's own arithmetic.

Determinism was preserved, not re-derived by hand. Comparing every checkpoint of every station before
and after remediation:

- guided, independent, and warm-front station observations are byte-identical;
- uncertain-boundary station observations changed **only** because `contentVersion` is part of the
  seeded-noise key, so a content revision re-draws that stream by design. The authored deltas, windows,
  and noise amplitudes are unchanged.

Model boundaries now always output values inside their documented ranges, and `assertSaneObservation`
still rejects out-of-range simulated weather rather than clamping it.

## Independent review gate

A separate **human** reviewer must still record:

- reviewer identity/role;
- source set reviewed;
- scenario content version(s);
- findings by scenario, including disposition of F5 and F6;
- any required remediation;
- final disposition.

Only after that review is complete may the four canonical scenarios change from
`pending-independent` to `independent-reviewed`.

Until then, GAME-341 may move to **Review** but must not be closed as Done.
