import { useEffect, useRef } from "react";

import type { WeatherScenarioV1 } from "@/scenarios";
import { formatSimulatedTimestamp, type MissionSummary } from "@/game";

import styles from "./mission.module.css";
import { BriefingPanel } from "./panels/BriefingPanel";
import { CoachingPanel } from "./panels/CoachingPanel";
import { DebriefPanel } from "./panels/DebriefPanel";
import { ForecastPanel } from "./panels/ForecastPanel";
import { ObservationPanel } from "./panels/ObservationPanel";
import { VerificationPanel } from "./panels/VerificationPanel";
import { useMissionSession, useMotionPreference } from "./useMissionSession";

export interface MissionScreenProps {
  readonly scenario: WeatherScenarioV1;
  readonly mission: MissionSummary;
  readonly onExit: () => void;
}

const phaseLabels = {
  briefing: "Briefing",
  observing: "Observing",
  "awaiting-outcome": "Committed, waiting for the comparison",
  verified: "Compared with the record",
  debrief: "Debrief"
} as const;

export function MissionScreen({ scenario, mission, onExit }: MissionScreenProps) {
  const { machine, state, dispatch, snapshot, evidence } = useMissionSession(scenario);
  const motion = useMotionPreference();
  const phaseHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousPhase = useRef(state.phase);

  // Move focus to the new phase heading so keyboard and screen-reader users land on the
  // content that just changed rather than at the top of the document.
  useEffect(() => {
    if (previousPhase.current === state.phase) return;
    previousPhase.current = state.phase;
    phaseHeadingRef.current?.focus();
  }, [state.phase]);

  // Automatic time advance is a convenience only: every control works identically without it.
  useEffect(() => {
    if (!motion.playing || motion.reducedMotion || state.minute >= scenario.timeline.maxMinute) return;
    const timer = setInterval(() => dispatch({ type: "advance", steps: 1 }), 1600);
    return () => clearInterval(timer);
  }, [motion.playing, motion.reducedMotion, state.minute, scenario.timeline.maxMinute, dispatch]);

  const report = snapshot.activeAttempt?.verification ?? snapshot.latestVerification;
  const canCompare = state.minute >= machine.verificationMinute;
  const editorKey = `${state.attempts.length}-${state.activeAttemptIndex === null ? "open" : "locked"}`;

  return (
    <div className={styles.mission}>
      <a className={styles.skipLink} href="#workspace">
        Skip to the workspace
      </a>

      <header className={styles.missionHeader}>
        <div>
          <p className={styles.eyebrow}>
            {mission.difficultyLabel} mission · {machine.targetStationName} ·{" "}
            {scenario.timeline.maxMinute} simulated minutes
          </p>
          <h1 id="mission-title">{scenario.title}</h1>
          <p className={styles.lede}>{scenario.objective}</p>
        </div>
        <div className={styles.missionHeaderSide}>
          <p className={styles.phaseTag} data-tone="info">
            {phaseLabels[state.phase]}
          </p>
          <button type="button" onClick={onExit}>
            Mission list
          </button>
        </div>
      </header>

      <p className={styles.statusRegion} role="status" aria-live="polite" data-tone={state.status?.tone ?? "info"}>
        {state.status?.message ?? `Simulated time ${formatSimulatedTimestamp(state.minute)}.`}
      </p>

      <h2 ref={phaseHeadingRef} tabIndex={-1} className={styles.phaseHeading}>
        {phaseLabels[state.phase]}
      </h2>

      {state.phase === "briefing" ? (
        <BriefingPanel
          machine={machine}
          mission={mission}
          status={state.status}
          onStart={() => dispatch({ type: "start" })}
          onBackToMissions={onExit}
        />
      ) : (
        <>
          <CoachingPanel
            machine={machine}
            state={state}
            onUseHint={(stepId) => dispatch({ type: "useHint", stepId })}
            onSetAssistance={(assistance) => dispatch({ type: "setAssistance", assistance })}
          />

          {state.phase === "verified" || state.phase === "debrief" ? null : (
            <div id="workspace" className={styles.workspaceWrapper}>
              <ObservationPanel
                machine={machine}
                scenario={scenario}
                state={state}
                evidence={evidence}
                playing={motion.playing}
                motionAllowed={!motion.reducedMotion}
                onSelectStation={(stationId) => dispatch({ type: "selectStation", stationId })}
                onSetMinute={(minute) => dispatch({ type: "setMinute", minute })}
                onAdvance={(steps) => dispatch({ type: "advance", steps })}
                onTogglePlay={motion.togglePlaying}
                onToggleMotion={motion.toggleReducedMotion}
                onOpenEvidence={(evidenceId) => dispatch({ type: "openEvidence", evidenceId })}
                onToggleEvidence={(evidenceId) => dispatch({ type: "toggleEvidence", evidenceId })}
              />

              <ForecastPanel
                key={editorKey}
                machine={machine}
                state={state}
                evidence={evidence}
                onSetRange={(field, range) => dispatch({ type: "setRange", field, range })}
                onSetConfidence={(confidence) => dispatch({ type: "setConfidence", confidence })}
                onSetRecommendation={(recommendationId) => dispatch({ type: "setRecommendation", recommendationId })}
                onCommit={() => dispatch({ type: "commit" })}
              />

              {state.phase === "awaiting-outcome" ? (
                <section className={styles.panel} aria-labelledby="compare-heading">
                  <h2 id="compare-heading">Compare with the record</h2>
                  <p className={styles.note}>
                    The comparison unlocks at{" "}
                    {formatSimulatedTimestamp(machine.verificationMinute)}, the close of the published forecast
                    window. Nothing about the outcome is shown until then.
                  </p>
                  <div className={styles.actionRow}>
                    <button
                      type="button"
                      className={styles.primaryAction}
                      onClick={() => dispatch({ type: "verify" })}
                      disabled={!canCompare}
                    >
                      {canCompare
                        ? "Compare forecast with the record"
                        : `Advance to ${formatSimulatedTimestamp(machine.verificationMinute)} first`}
                    </button>
                    <button type="button" onClick={() => dispatch({ type: "revise" })}>
                      Revise before comparing
                    </button>
                  </div>
                </section>
              ) : null}
            </div>
          )}

          {state.phase === "verified" && report ? (
            <VerificationPanel
              report={report}
              attemptCount={state.attempts.length}
              onRevise={() => dispatch({ type: "revise" })}
              onOpenDebrief={() => dispatch({ type: "finish" })}
            />
          ) : null}

          {state.phase === "debrief" && report ? (
            <DebriefPanel
              machine={machine}
              state={state}
              evidence={evidence}
              report={report}
              onRevise={() => dispatch({ type: "revise" })}
              onBackToMissions={onExit}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
