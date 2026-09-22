import type { WeatherScenarioV1 } from "@/scenarios";
import { formatDuration, formatSimulatedClock, formatSimulatedTimestamp } from "@/game";

import styles from "../mission.module.css";

export interface TimeControlsProps {
  readonly scenario: WeatherScenarioV1;
  readonly minute: number;
  readonly verificationMinute: number;
  readonly playing: boolean;
  readonly motionAllowed: boolean;
  readonly onSetMinute: (minute: number) => void;
  readonly onAdvance: (steps: number) => void;
  readonly onTogglePlay: () => void;
  readonly onToggleMotion: () => void;
}

export function TimeControls({
  scenario,
  minute,
  verificationMinute,
  playing,
  motionAllowed,
  onSetMinute,
  onAdvance,
  onTogglePlay,
  onToggleMotion
}: TimeControlsProps) {
  const { stepMinutes, maxMinute, checkpoints } = scenario.timeline;
  const nextCheckpoint = checkpoints.find((checkpoint) => checkpoint > minute);
  const atEnd = minute >= maxMinute;

  return (
    <section className={styles.timePanel} aria-labelledby="time-heading">
      <div className={styles.timeHeader}>
        <h3 id="time-heading">Simulated clock</h3>
        <p className={styles.timeNow}>
          <span className={styles.timeClock}>{formatSimulatedClock(minute)}</span>
          <span className={styles.timeOffset}>T+{formatDuration(minute)}</span>
        </p>
      </div>

      <p className={styles.timeNote}>
        Observations are valid for this simulated step only. Every station reading and evidence item is stamped
        with the simulated time it became available; the next update arrives {formatDuration(stepMinutes)} later.
      </p>

      <div className={styles.timeButtons}>
        <button
          type="button"
          onClick={() => onSetMinute(Math.max(0, minute - stepMinutes))}
          disabled={minute <= 0}
        >
          Back {stepMinutes} min
        </button>
        <button type="button" onClick={() => onAdvance(1)} disabled={atEnd}>
          Advance {stepMinutes} min
        </button>
        <button type="button" onClick={() => onAdvance((verificationMinute - minute) / stepMinutes)} disabled={minute >= verificationMinute}>
          Advance to window close ({formatSimulatedTimestamp(verificationMinute)})
        </button>
        <button type="button" onClick={() => onSetMinute(nextCheckpoint ?? maxMinute)} disabled={atEnd}>
          Next checkpoint{nextCheckpoint !== undefined ? ` (T+${formatDuration(nextCheckpoint)})` : ""}
        </button>
      </div>

      <div className={styles.slider}>
        <label htmlFor="simulated-minute">
          Simulation time cursor, {formatSimulatedTimestamp(0)} to {formatSimulatedTimestamp(maxMinute)}
        </label>
        <input
          id="simulated-minute"
          type="range"
          min={0}
          max={maxMinute}
          step={stepMinutes}
          value={minute}
          onChange={(event) => onSetMinute(Number(event.target.value))}
        />
      </div>

      <div className={styles.timeToggles}>
        <button type="button" onClick={onTogglePlay} aria-pressed={playing} disabled={!motionAllowed}>
          {playing ? "Pause automatic time advance" : "Play automatic time advance"}
        </button>
        <button type="button" onClick={onToggleMotion} aria-pressed={!motionAllowed}>
          {motionAllowed ? "Reduce motion" : "Motion reduced (tap to restore)"}
        </button>
      </div>
      {!motionAllowed ? (
        <p className={styles.timeNote}>
          Motion is reduced: automatic time advance is unavailable and the map holds still. Every other control
          works exactly the same.
        </p>
      ) : null}
    </section>
  );
}
