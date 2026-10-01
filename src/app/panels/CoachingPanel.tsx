import {
  coachingComplete,
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

const assistanceLevels: readonly { readonly value: ForecastSessionState["assistance"]; readonly label: string }[] = [
  { value: "guided", label: "Step by step" },
  { value: "reduced", label: "Hints on request" },
  { value: "off", label: "No coaching" }
];

/**
 * Contextual coaching.
 *
 * Coaching describes the next useful action only. It is generated from the current session
 * state, so it cannot reveal a station outcome, an arrival time or an accepted range.
 *
 * "No coaching" means no coaching: the assistance control stays so the player can ask for it
 * back, but no step, hint or nudge is rendered. It also stops once the guided step list is
 * complete, so support fades out for a player who no longer needs it.
 */
export function CoachingPanel({ machine, state, onUseHint, onSetAssistance }: CoachingPanelProps) {
  const step = currentTutorialStep(machine, state);
  const progress = tutorialProgress(machine, state);
  const showProgress = machine.scenario.missionType === "guided-cold-front";
  const coachingOff = state.assistance === "off";
  const finished = coachingComplete(machine, state);

  return (
    <section className={styles.coaching} aria-labelledby="coaching-heading">
      <div className={styles.coachingHeader}>
        <h2 id="coaching-heading">Coaching</h2>
        <div className={styles.assistanceControl}>
          <span id="assistance-label">Assistance</span>
          <div
            role="radiogroup"
            aria-labelledby="assistance-label"
            className={styles.pillGroup}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const index = assistanceLevels.findIndex((level) => level.value === state.assistance);
              const delta = event.key === "ArrowRight" ? 1 : -1;
              const next = assistanceLevels[(index + delta + assistanceLevels.length) % assistanceLevels.length]!;
              onSetAssistance(next.value);
              event.currentTarget
                .querySelector<HTMLButtonElement>(`[data-assistance="${next.value}"]`)
                ?.focus();
            }}
          >
            {assistanceLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                role="radio"
                data-assistance={level.value}
                aria-checked={state.assistance === level.value}
                className={styles.pill}
                onClick={() => onSetAssistance(level.value)}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {coachingOff ? null : (
        <>
          {showProgress ? (
            <p className={styles.progress} role="status">
              {finished
                ? "All guided steps complete. Coaching has stood down."
                : `${progress.completed} of ${progress.total} guided steps complete.`}
            </p>
          ) : null}

          {step ? (
            <div className={styles.coachingStep}>
              <h3>{step.title}</h3>
              <p>{step.instruction}</p>
              {(() => {
                const shown = visibleHints(step, state);
                return (
                  <>
                    <ul className={styles.hintList}>
                      {shown.map((hint) => (
                        <li key={hint}>{hint}</li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => onUseHint(step.id)}>
                      {shown.length > 0 ? "Show another hint" : "Show a hint"}
                    </button>
                  </>
                );
              })()}
            </div>
          ) : finished ? (
            <p className={styles.coachingIdle}>
              You have worked through every step on your own. The evidence stays available for the debrief.
            </p>
          ) : (
            <p className={styles.coachingIdle}>{contextualHint(machine, state)}</p>
          )}

          {!step && !finished ? (
            <p className={styles.note}>
              No step is outstanding. The hint above is generated from your current state, not from the answer.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
