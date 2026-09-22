import type { MissionSummary } from "@/game";
import { formatDuration, formatMinuteRange, formatSimulatedTimestamp } from "@/game";
import type { SessionMachine, SessionStatus } from "@/game";

import styles from "../mission.module.css";

export interface BriefingPanelProps {
  readonly machine: SessionMachine;
  readonly mission: MissionSummary;
  readonly onStart: () => void;
  readonly status: SessionStatus | undefined;
  readonly onBackToMissions: () => void;
}

export function BriefingPanel({ machine, mission, onStart, status, onBackToMissions }: BriefingPanelProps) {
  const { scenario } = machine;
  return (
    <section className={styles.panel} aria-labelledby="briefing-heading">
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>
          Mission briefing · {mission.difficultyLabel} · {mission.stationCount} stations
        </p>
        <h2 id="briefing-heading">{scenario.title}</h2>
        <p className={styles.lede}>{scenario.objective}</p>
      </div>

      <div className={styles.twoUp}>
        <div>
          <h3>Your forecast target</h3>
          <dl className={styles.definitionList}>
            <dt>Target station</dt>
            <dd>{machine.targetStationName}</dd>
            <dt>Forecast window</dt>
            <dd>
              {formatMinuteRange(machine.window.startMinute, machine.window.endMinute)} of simulated time
            </dd>
            <dt>Comparison unlocks</dt>
            <dd>
              at {formatSimulatedTimestamp(machine.verificationMinute)}, the close of the published window
            </dd>
            <dt>Mission length</dt>
            <dd>
              {formatDuration(scenario.timeline.maxMinute)} in {scenario.timeline.stepMinutes}-minute steps
            </dd>
          </dl>
          <p className={styles.note}>
            Commit before the change reaches {machine.targetStationName}. A forecast written after the change has
            already started is recorded as a nowcast, and one written after the window closes as a hindcast — both
            are allowed, and the debrief explains the difference.
          </p>
        </div>

        <div>
          <h3>What this mission teaches</h3>
          <ul className={styles.bulletList}>
            {mission.teaches.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>What you will be asked for</h3>
          <ul className={styles.bulletList}>
            <li>Temperature change at {machine.targetStationName}, as a range</li>
            <li>Precipitation probability, as a range</li>
            <li>Wind direction once the change has passed, as a sector</li>
            <li>The timing window for the main change</li>
            <li>Your confidence, and one operational recommendation</li>
          </ul>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button type="button" className={styles.primaryAction} onClick={onStart}>
          Start observing {machine.targetStationName}
        </button>
        <button type="button" onClick={onBackToMissions}>
          Back to mission list
        </button>
      </div>

      {status ? (
        <p className={styles.inlineStatus} data-tone={status.tone}>
          {status.message}
        </p>
      ) : null}
    </section>
  );
}
