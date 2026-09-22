import {
  contextualHint,
  currentTutorialStep,
  tutorialProgress,
  visibleHints,
  type ForecastSessionState,
  type SessionMachine
} from "@/game";

import styles from "../mission.module.css";

export interface CoachingPanelProps {
  readonly machine: SessionMachine;
  readonly state: ForecastSessionState;
  readonly onUseHint: (stepId: string) => void;
  readonly onSetAssistance: (assistance: ForecastSessionState["assistance"]) => void;
}

/**
 * Contextual coaching.
 *
 * Coaching describes the next useful action only. It is generated from the current session
 * state, so it cannot reveal a station outcome, an arrival time or an accepted range.
 */
export function CoachingPanel({ machine, state, onUseHint, onSetAssistance }: CoachingPanelProps) {
  const step = currentTutorialStep(machine, state);
  const progress = tutorialProgress(machine, state);
  const showProgress = machine.scenario.missionType === "guided-cold-front";

  return (
    <section className={styles.coaching} aria-labelledby="coaching-heading">
      <div className={styles.coachingHeader}>
        <h2 id="coaching-heading">Coaching</h2>
        <div className={styles.assistanceControl}>
          <span id="assistance-label">Assistance</span>
          <div role="radiogroup" aria-labelledby="assistance-label" className={styles.pillGroup}>
            {(["guided", "reduced", "off"] as const).map((level) => (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={state.assistance === level}
                className={styles.pill}
                onClick={() => onSetAssistance(level)}
              >
                {level === "guided" ? "Step by step" : level === "reduced" ? "Hints on request" : "No coaching"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showProgress ? (
        <p className={styles.progress} role="status">
          {progress.completed} of {progress.total} guided steps complete.
        </p>
      ) : null}

      {step ? (
        <div className={styles.coachingStep}>
          <h3>{step.title}</h3>
          <p>{step.instruction}</p>
          <ul className={styles.hintList}>
            {visibleHints(step, state).map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
          <button type="button" onClick={() => onUseHint(step.id)}>
            {state.hintsUsed[step.id] ? "Show another hint" : "Show a hint"}
          </button>
        </div>
      ) : (
        <p className={styles.coachingIdle}>{contextualHint(machine, state)}</p>
      )}

      {!step && state.assistance !== "off" ? (
        <p className={styles.note}>
          No step is outstanding. The hint above is generated from your current state, not from the answer.
        </p>
      ) : null}
    </section>
  );
}
