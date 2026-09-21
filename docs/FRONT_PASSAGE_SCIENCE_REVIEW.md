# WC-04 Front Passage Science Review Dossier

Status: **implementation/source review complete; independent science sign-off pending**

This dossier records the evidence used to author the canonical Weather Command v1 scenarios. It intentionally does not mark the scenarios as independently reviewed. The scenario data carries `scienceReviewStatus: "pending-independent"` until a separate reviewer signs off.

## Curriculum authority

NGSS MS-ESS2-5 requires learners to reason from changing temperature, pressure, humidity, precipitation, and wind; it emphasizes high-to-low pressure flow, changing weather when air masses interact, and forecasts expressed within probabilistic ranges. The assessment boundary explicitly avoids requiring recall of cloud-type names or weather-map/station symbols.

Source:
https://www.nextgenscience.org/pe/ms-ess2-5-earths-systems

## Front relationships

NWS educational material describes:

- cold fronts as cold air replacing warm air;
- colder, typically drier air behind a cold front;
- a wind shift and pressure-tendency change with passage;
- possible bands of showers/thunderstorms near a cold front;
- warm fronts as warm air replacing cooler air;
- a more gradual rise of air with warm fronts;
- broader/continuous precipitation often along or ahead of warm fronts.

Source:
https://www.weather.gov/jkl/education

NOAA/NESDIS grades 5–8 weather-map material reinforces high/low pressure, air flow from high toward low pressure, and the role of fronts/maps as forecast evidence.

Source:
https://www.nesdis.noaa.gov/about/k-12-education/weather-forecasting/how-read-weather-map

## Scenario-by-scenario rationale

### Guided Cold Front Shift

Pedagogical purpose:
teach the evidence sequence with strong signal.

Authored causal pattern:
- pre-frontal falling pressure tendency;
- warm/moist initial conditions;
- west → central → east passage order;
- temporary precipitation band;
- temperature decrease;
- wind shift;
- pressure tendency reversal;
- drying after passage.

Simplification:
the same rule family is applied at three stations with staggered timing. Real fronts are less uniform.

### Independent Cold Front Variant

Pedagogical purpose:
test transfer without tutorial callouts.

Differences from guided mission:
- different station geography/names;
- lower initial moisture;
- slower/weaker precipitation signal;
- different front speed/timing;
- smaller pressure/temperature changes;
- precipitation confidence intentionally lower than timing/temperature confidence.

This is not a cosmetic seed swap.

### Warm Front / Gradual Change

Pedagogical purpose:
require the learner to distinguish a slower evidence pattern.

Authored causal pattern:
- cooler air initially at stations;
- warming/moistening over multiple simulation steps;
- pressure tendency changes gradually;
- broad lighter precipitation;
- slower station transition than cold-front missions.

Important boundary:
the scenario does not teach that every warm front produces the same rain amount or exact temperature increase.

### Uncertain Boundary

Pedagogical purpose:
teach confidence calibration.

Authored causal pattern:
- direction of change remains coherent;
- transition width is broader;
- temperature/pressure/wind observations include bounded seeded noise;
- exact timing and precipitation are less certain;
- truth is fixed by scenario seed before the learner forecasts.

Important boundary:
uncertainty is not random correctness. Replaying the same seed/actions reproduces the same observations exactly.

## Golden-trace review

The committed tests lock the Central Station observation trace for all four missions.

Required review questions before changing `scienceReviewStatus`:

1. Does each station-variable direction match the cited relationship?
2. Are the numerical magnitudes plausible as pedagogical synthetic values without implying operational precision?
3. Are cold-front changes sufficiently more abrupt than the warm-front mission?
4. Are precipitation claims phrased as possible/likely rather than universal?
5. Is the uncertain mission genuinely ambiguous without becoming arbitrary?
6. Do accepted forecast ranges bracket defensible predictions without exposing a hidden answer?
7. Are all simplifications/model boundaries adequate for a grades 6–8 learner?
8. Does any copy accidentally imply these are live or safety-relevant forecasts?

## Independent review gate

A separate reviewer must record:
- reviewer identity/role;
- source set reviewed;
- scenario content version(s);
- findings by scenario;
- any required remediation;
- final disposition.

Only after that review is complete may the four canonical scenarios change from `pending-independent` to `independent-reviewed`.

Until then, GAME-341 may move to **Review** but must not be closed as Done.
