# Weather Command — Frozen Benchmark Rubric

Status: binding WC-01 quality contract  
Freeze point: before production implementation

This rubric is intentionally written before the game is built. WC-14 must use the same dimensions against the exact immutable release candidate. A late release review may add findings, but it may not silently redefine success to fit the shipped result.

No comparator is a template to copy. Production art, sound, writing, scenarios, data, layout, and interaction details must remain original.

## Comparator 1 — Smithsonian Weather Lab

Reference: https://ssec.si.edu/weather-lab

Benchmark dimensions:
- grades 5–8 meteorologist role clarity;
- immediate connection between air masses and likely weather outcomes;
- age-appropriate scientific framing;
- communication that weather models describe probable outcomes;
- broad device accessibility.

Observe:
1. How quickly a new learner understands what role they are playing.
2. Whether the interaction makes air-mass/weather relationships visible.
3. Whether the product avoids implying perfect certainty.
4. Whether the learner can act without reading a long lesson first.

Weather Command minimum expectation:
- equal or better role clarity;
- substantially deeper evidence inspection;
- explicit station/time-series reasoning;
- explicit confidence and verification;
- no hidden multiple-choice answer key.

Do not copy:
- layout;
- wording;
- graphics;
- scenario structure;
- answer patterns.

## Comparator 2 — NWS/NSSL HotSeat / forecast workflow

Reference hub: https://www.weather.gov/learning

Benchmark dimensions:
- sense of operating a forecast desk;
- sequential evidence inspection;
- committing a decision before seeing the future;
- event progression;
- post-event review.

Observe:
1. Whether evidence gathering feels purposeful.
2. Whether the decision has clear consequence.
3. Whether the user can compare what they thought with what occurred.
4. Whether changing conditions remain understandable.

Weather Command minimum expectation:
- evidence → forecast → commit → advance → verify feels authentic;
- information complexity remains appropriate for grades 6–8;
- verification teaches rather than judges;
- operational context remains fictional and non-safety-critical.

Do not copy:
- severe-warning authority;
- professional forecaster complexity;
- operational NWS branding;
- warning thresholds.

## Comparator 3 — Smithsonian Disaster Detector

Reference: https://ssec.si.edu/disaster-detector

Benchmark dimensions:
- middle-school Earth-science game loop;
- scientific data leading to prediction;
- prediction leading to meaningful action;
- consequence/recovery/replay.

Observe:
1. Whether the learner uses tools rather than guesses.
2. Whether predictions change what the player does.
3. Whether the experience feels like a game rather than assessment software.
4. Whether retry/recovery encourages reasoning.

Weather Command minimum expectation:
- at least equal sense of purpose and consequence;
- more explicit uncertainty/confidence;
- stronger predicted-vs-observed comparison;
- modern responsive/accessibility baseline;
- replay exposes a genuine reasoning opportunity rather than a repeated quiz.

Do not copy:
- city fiction;
- mitigation mechanics;
- visual assets;
- hazard scenarios.

## Comparator 4 — Mini Metro

Reference: https://dinopoloclub.com/games/mini-metro/

Benchmark dimensions:
- commercial-quality system readability;
- low-friction interaction;
- restrained visual hierarchy;
- legible state change;
- satisfying but non-distracting motion/audio;
- accessibility-minded presentation.

Observe:
1. Whether the user can read changing system state at a glance.
2. Whether controls feel immediate and predictable.
3. Whether motion communicates state rather than decorates it.
4. Whether sound supports interaction without demanding attention.
5. Whether a dense system remains calm rather than dashboard-heavy.

Weather Command minimum expectation:
- map/evidence hierarchy remains readable during change;
- every major action receives clear response;
- visual polish is coherent across mission states;
- mobile feels intentionally designed;
- reduced-motion/mute modes still feel finished.

Do not copy:
- visual style;
- transit mechanics;
- audio;
- map geometry;
- progression systems.

## Release review dimensions

WC-14 records separate findings for every dimension below. Do not collapse them into one overall score.

### 1. Science / causal clarity

Pass evidence:
- modeled relationships are source-backed;
- learner can connect evidence to atmospheric change;
- no false precision or incorrect causal rule is required to win.

### 2. Evidence discovery and synthesis

Pass evidence:
- learner can find relevant evidence;
- station/map/trend views agree;
- UI does not pre-highlight the answer.

### 3. Forecast workflow authenticity

Pass evidence:
- commit-before-outcome is clear;
- time advance is meaningful;
- verification compares forecast with observed state.

### 4. Uncertainty / confidence

Pass evidence:
- ambiguity can be represented;
- multiple defensible forecasts can receive defensible feedback;
- confidence is evaluated separately from raw error.

### 5. Game-loop engagement and replay

Pass evidence:
- player has a reason to replay/revise;
- interactions feel consequential;
- the product is not perceived merely as a worksheet.

### 6. Information hierarchy / readability

Pass evidence:
- map/evidence/forecast hierarchy is clear at desktop and phone sizes;
- dense evidence does not overwhelm;
- key state changes remain legible.

### 7. Animation / game feel

Pass evidence:
- time advance and verification transitions feel deliberate;
- motion does not obscure data;
- reduced-motion equivalent is complete.

### 8. Sound / feedback

Pass evidence:
- optional audio improves feel where used;
- mute path is complete;
- no required information is audio-only.

### 9. Onboarding / recovery

Pass evidence:
- new target-age player can begin without facilitator instructions;
- hints guide attention rather than give answers;
- weak forecasts lead to useful recovery.

### 10. Accessibility / responsive quality

Pass evidence:
- keyboard/touch/semantic paths are complete;
- 360 px and 200% zoom/reflow pass;
- map/chart equivalents are usable;
- no color-only or hover-only requirement.

### 11. Performance

Pass evidence:
- reference budgets pass;
- animation stays responsive under representative scenario load;
- no long-task pattern makes evidence inspection feel sluggish.

## Review evidence format

For each comparator and release dimension record:

- exact candidate SHA/release ID;
- reviewer;
- date;
- observed evidence;
- material gap;
- severity;
- remediation issue/commit if applicable;
- accepted limitation only with explicit owner rationale.

A strength in one dimension cannot mask a release-blocking weakness in another.

“Meets NGSS” is not sufficient evidence that the result is a high-quality game.
