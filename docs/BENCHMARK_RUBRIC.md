# Weather Command Benchmark Rubric

This rubric is frozen before production implementation so release quality cannot be redefined after the game exists.

Comparators are references for specific quality dimensions only. No asset, layout, wording, sound, data set, or scenario may be copied.

## Comparator 1: Smithsonian Weather Lab

Benchmark dimensions:
- immediate clarity of the meteorologist role;
- age-appropriate air-mass reasoning;
- probable outcomes rather than false certainty;
- accessible causal model.

Weather Command target:
- preserve role clarity;
- exceed evidence depth with stations, trends, pressure/moisture/wind, confidence, and predicted-vs-observed verification;
- avoid hidden multiple-choice-answer behavior.

Release evidence:
- target-age playtest notes;
- science review;
- screenshots/video of evidence→forecast→verify loop.

## Comparator 2: NWS/NSSL HotSeat

Benchmark dimensions:
- forecast-desk authenticity;
- changing evidence before a committed decision;
- event progression;
- post-event verification.

Weather Command target:
- capture evidence→forecast→commit→observe→verify;
- keep information hierarchy understandable for grades 6–8;
- exclude real warning authority and professional operational complexity.

Release evidence:
- workflow review;
- mission video;
- reviewer notes on evidence timing and decision consequence.

## Comparator 3: Smithsonian Disaster Detector

Benchmark dimensions:
- role-based middle-school Earth-science gameplay;
- data analysis before prediction;
- prediction leading to meaningful action;
- replay/recovery/systems thinking.

Weather Command target:
- make evidence materially change the player's decision;
- provide stronger uncertainty/confidence treatment;
- provide modern responsive/accessibility quality;
- provide explicit predicted-vs-observed debrief.

Release evidence:
- target-age playtest;
- replay/revision trace;
- usability notes.

## Comparator 4: Mini Metro

Benchmark dimensions:
- dense system readability;
- clean visual hierarchy;
- low-friction interaction;
- animation timing;
- restrained audio feedback;
- accessibility-minded presentation.

Weather Command target:
- weather map stays readable while state changes;
- interactions respond immediately;
- motion makes the atmosphere feel alive without hiding evidence;
- the game feels polished rather than worksheet-like;
- mobile feels intentionally composed.

Release evidence:
- production screenshots/video;
- motion/audio review;
- device review;
- accessibility review.

## Frozen release dimensions

WC-14 must record findings separately for:

1. **Science/causal integrity**
   - relationships are correct within stated boundaries;
   - explanations match evidence.

2. **Evidence discovery and synthesis**
   - player can find relevant data;
   - no required clue is hidden or answer-revealing.

3. **Forecast-workflow authenticity**
   - evidence precedes commitment;
   - time advance produces meaningful verification.

4. **Uncertainty/confidence**
   - reasonable forecast ranges accepted;
   - over/underconfidence can be distinguished.

5. **Game-loop engagement/replay**
   - player wants/understands how to retry;
   - revision is meaningful rather than repetition.

6. **Information hierarchy/readability**
   - next useful action is apparent;
   - changing data does not overwhelm the map.

7. **Animation/game feel**
   - state changes feel responsive and intentional;
   - motion supports comprehension.

8. **Sound/feedback**
   - feedback is restrained, clear, optional;
   - no essential information audio-only.

9. **Onboarding/recovery**
   - fresh player can begin without facilitator explanation;
   - weak forecasts lead to useful recovery.

10. **Accessibility/responsive quality**
    - keyboard/touch/semantic paths;
    - reduced motion;
    - zoom/reflow;
    - mobile composition.

11. **Performance**
    - qualified flows meet WC-01/WC-02 budgets;
    - no obvious jank or long stalls.

## Review rule

Do **not** produce one blended numeric score.

A release-blocking weakness in one dimension cannot be hidden by strengths elsewhere.

"Meets NGSS" is not sufficient evidence of game quality.

For every material gap:
- remediate and requalify the affected exact SHA; or
- record an explicit owner-approved non-blocking limitation with rationale.
