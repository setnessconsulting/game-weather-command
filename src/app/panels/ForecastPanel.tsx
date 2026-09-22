import {
  CONFIDENCE_LEVELS,
  confidenceLabel,
  type ConfidenceLevel,
  formatMinuteRange,
  formatSimulatedTimestamp,
  recommendationOptionsFor,
  sessionValidation,
  type EvidenceCatalog,
  type ForecastSessionState,
  type NumericRangeValue,
  type RangeField as RangeFieldName,
  type SessionMachine
} from "@/game";

import { RangeField } from "../components/RangeField";
import styles from "../mission.module.css";

export interface ForecastPanelProps {
  readonly machine: SessionMachine;
  readonly state: ForecastSessionState;
  readonly evidence: EvidenceCatalog;
  readonly onSetRange: (field: RangeFieldName, range: NumericRangeValue | null) => void;
  readonly onSetConfidence: (confidence: ConfidenceLevel) => void;
  readonly onSetRecommendation: (recommendationId: string) => void;
  readonly onCommit: () => void;
}

export function ForecastPanel({
  machine,
  state,
  evidence,
  onSetRange,
  onSetConfidence,
  onSetRecommendation,
  onCommit
}: ForecastPanelProps) {
  const validation = sessionValidation(state, machine);
  const blocking = validation.issues.filter((issue) => issue.severity === "blocking");
  const recommendations = recommendationOptionsFor(machine);
  const attachedEvidence = evidence.unlocked.filter((item) => state.selectedEvidenceIds.includes(item.id));
  const locked = state.phase !== "observing";

  return (
    <section className={styles.panel} aria-labelledby="forecast-heading">
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>
          Forecast window {formatMinuteRange(machine.window.startMinute, machine.window.endMinute)}
        </p>
        <h2 id="forecast-heading">Forecast for {machine.targetStationName}</h2>
        <p className={styles.note}>
          Every field takes a range or a sector, because a forecast is a statement about what is possible. Nothing
          is compared with the record until you commit and the comparison unlocks.
        </p>
      </div>

      {locked ? (
        <p className={styles.inlineStatus} data-tone="info">
          The draft is locked while a committed forecast is being compared. Choose &ldquo;Revise forecast&rdquo; to
          edit it again — revisions are expected, not penalised.
        </p>
      ) : null}

      <fieldset className={styles.fieldGroup} disabled={locked}>
        <legend className={styles.fieldGroupLegend}>Your forecast</legend>

        <RangeField
          id="forecast-temperature"
          label="Temperature change"
          unit="°C"
          step={0.5}
          lowLabel="Smallest expected change"
          highLabel="Largest expected change"
          hint={`How much ${machine.targetStationName} will change by the end of the mission, as a range. Negative means cooler.`}
          value={state.forecast.temperatureChangeC}
          issues={validation.issues.filter((issue) => issue.field === "temperature")}
          onChange={(range) => onSetRange("temperatureChangeC", range)}
        />

        <RangeField
          id="forecast-precipitation"
          label="Precipitation probability"
          unit="%"
          lowLabel="Lowest credible chance"
          highLabel="Highest credible chance"
          hint="The chance that measurable precipitation reaches the target station during the mission."
          value={state.forecast.precipitationProbabilityPct}
          issues={validation.issues.filter((issue) => issue.field === "precipitation")}
          onChange={(range) => onSetRange("precipitationProbabilityPct", range)}
        />

        <RangeField
          id="forecast-wind"
          label="Wind direction sector"
          unit="degrees"
          lowLabel="Sector start"
          highLabel="Sector end"
          hint="Where the wind will blow from once the change has passed. Enter a simple span between 0 and 359."
          value={state.forecast.windDirectionDeg}
          issues={validation.issues.filter((issue) => issue.field === "wind")}
          onChange={(range) => onSetRange("windDirectionDeg", range)}
        />

        <RangeField
          id="forecast-timing"
          label="Timing window for the main change"
          unit={`minutes from start (mission length ${machine.scenario.timeline.maxMinute})`}
          step={machine.scenario.timeline.stepMinutes}
          lowLabel="Earliest arrival"
          highLabel="Latest arrival"
          hint="When the main change reaches the target station. A narrow window on strong evidence beats a wide window on weak evidence."
          value={state.forecast.transitionWindow}
          issues={validation.issues.filter((issue) => issue.field === "timing")}
          onChange={(range) => onSetRange("transitionWindow", range)}
        />
      </fieldset>

      <fieldset className={styles.fieldGroup} disabled={locked}>
        <legend className={styles.fieldGroupLegend}>Confidence</legend>
        <div role="radiogroup" aria-label="Confidence in this forecast" className={styles.pillGroup}>
          {CONFIDENCE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={state.forecast.confidence === level}
              className={styles.pill}
              onClick={() => onSetConfidence(level)}
            >
              {confidenceLabel[level]}
            </button>
          ))}
        </div>
        <p className={styles.fieldHint}>
          Confidence is about how well the evidence supports the numbers, not about wanting to be right.
        </p>
      </fieldset>

      <fieldset className={styles.fieldGroup} disabled={locked}>
        <legend className={styles.fieldGroupLegend}>Operational recommendation</legend>
        <p className={styles.fieldHint}>
          These recommendations and the region are fictional. Choose the one your own forecast would support.
        </p>
        <div role="radiogroup" aria-label="Operational recommendation" className={styles.optionList}>
          {recommendations.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={state.forecast.recommendationId === option.id}
              className={styles.option}
              onClick={() => onSetRecommendation(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <section className={styles.reasoning} aria-labelledby="reasoning-heading">
        <h3 id="reasoning-heading">Evidence behind this forecast</h3>
        {attachedEvidence.length === 0 ? (
          <p className={styles.note}>
            No evidence is attached. You can still commit, but the debrief will not be able to show what your
            reasoning was based on.
          </p>
        ) : (
          <ul className={styles.bulletList}>
            {attachedEvidence.map((evidence) => (
              <li key={evidence.id}>
                <strong>{evidence.title}</strong> — {evidence.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      {blocking.length > 0 ? (
        <div className={styles.blockingSummary} role="alert">
          <h3>Not ready to commit</h3>
          <ul>
            {blocking.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.readyNote}>
          All fields are filled and internally consistent. Committing at {formatSimulatedTimestamp(state.minute)}{" "}
          will be recorded as a{" "}
          {state.minute >= machine.window.endMinute
            ? "hindcast, because the published window has closed"
            : "forecast"}
          .
        </p>
      )}

      <div className={styles.actionRow}>
        <button type="button" className={styles.primaryAction} onClick={onCommit} disabled={locked}>
          Commit forecast
        </button>
      </div>
    </section>
  );
}
