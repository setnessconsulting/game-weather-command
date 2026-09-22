import {
  formatSignedDegrees,
  formatSignedTemperature,
  formatSimulatedTimestamp,
  type SupportLevel,
  type VerificationReport
} from "@/game";

import { FactList } from "../components/FactList";
import styles from "../mission.module.css";

export interface VerificationPanelProps {
  readonly report: VerificationReport;
  readonly onRevise: () => void;
  readonly onOpenDebrief: () => void;
  readonly attemptCount: number;
}

const levelLabel: Record<SupportLevel, string> = {
  supported: "Supported by the record",
  "partially-supported": "Partly supported",
  unsupported: "Not supported"
};

const calibrationLabel: Record<VerificationReport["calibration"]["level"], string> = {
  "well-calibrated": "Well calibrated",
  overconfident: "Overconfident for this evidence",
  underconfident: "More cautious than the evidence required"
};

export function VerificationPanel({ report, onRevise, onOpenDebrief, attemptCount }: VerificationPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="verification-heading">
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>
          Verification · attempt {attemptCount} · committed {formatSimulatedTimestamp(report.committedAtMinute)}
        </p>
        <h2 id="verification-heading">Predicted against observed</h2>
        <p className={styles.lede}>{report.headline}</p>
        <p className={styles.note}>{report.modeDetail}</p>
      </div>

      <section className={styles.dimensionGroup} aria-labelledby="timing-heading">
        <h3 id="timing-heading">Timing</h3>
        <p className={styles.level} data-level={report.timing.level}>
          {levelLabel[report.timing.level]}
        </p>
        <p>{report.timing.detail}</p>
      </section>

      <section className={styles.dimensionGroup} aria-labelledby="ranges-heading">
        <h3 id="ranges-heading">Forecast values</h3>
        <ul className={styles.dimensionList}>
          {report.ranges.map((range) => (
            <li key={range.dimension} className={styles.dimensionItem}>
              <h4>{range.label}</h4>
              <p className={styles.level} data-level={range.level}>
                {levelLabel[range.level]}
              </p>
              <p>
                Forecast {range.predicted.min} to {range.predicted.max}. Observed {range.observedLabel}.
              </p>
              <p>{range.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className={styles.twoUp}>
        <section className={styles.dimensionGroup} aria-labelledby="evidence-quality-heading">
          <h3 id="evidence-quality-heading">Evidence quality</h3>
          <p className={styles.level} data-level={report.evidenceQuality.level}>
            {levelLabel[report.evidenceQuality.level]}
          </p>
          <p>{report.evidenceQuality.detail}</p>
        </section>

        <section className={styles.dimensionGroup} aria-labelledby="reasoning-heading">
          <h3 id="reasoning-heading">Causal reasoning consistency</h3>
          <p className={styles.level} data-level={report.causalReasoning.level}>
            {levelLabel[report.causalReasoning.level]}
          </p>
          <p>
            Your forecast implied {report.causalReasoning.forecastDirection} conditions; the record shows{" "}
            {report.causalReasoning.observedDirection} conditions, measured as{" "}
            {formatSignedTemperature(report.observed.temperatureChangeC)} and a wind shift of{" "}
            {formatSignedDegrees(report.observed.windShiftDeg)}.
          </p>
          <ul className={styles.bulletList}>
            {report.causalReasoning.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className={styles.dimensionGroup} aria-labelledby="calibration-heading">
        <h3 id="calibration-heading">Confidence calibration</h3>
        <p className={styles.level} data-level={report.calibration.level}>
          {calibrationLabel[report.calibration.level]}
        </p>
        <p>{report.calibration.detail}</p>
      </section>

      <section className={styles.dimensionGroup} aria-labelledby="observed-heading">
        <h3 id="observed-heading">What the record actually shows</h3>
        <p>
          {report.observed.summary} Precipitation probability is checked against the scenario&apos;s authored
          defensible range rather than against a single day: {report.precipitationOutcome.verificationBasis}
        </p>
        <FactList
          caption={`${report.stationName} reading at verification time`}
          facts={report.observedFacts}
        />
      </section>

      <details className={styles.reference}>
        <summary>Scenario reference ranges used for this comparison</summary>
        <p className={styles.note}>
          These authored ranges are shown after the comparison, never before it. They are what the scenario
          designer judged defensible, and they are not the only acceptable answer.
        </p>
        <ul className={styles.bulletList}>
          <li>
            Arrival window: {report.reference.authoredAcceptedRange.transitionArrivalMinute.min} to{" "}
            {report.reference.authoredAcceptedRange.transitionArrivalMinute.max} min
          </li>
          <li>
            Temperature change: {report.reference.authoredAcceptedRange.temperatureChangeC.min} to{" "}
            {report.reference.authoredAcceptedRange.temperatureChangeC.max} °C
          </li>
          <li>
            Precipitation probability: {report.reference.authoredAcceptedRange.precipitationProbabilityPct.min} to{" "}
            {report.reference.authoredAcceptedRange.precipitationProbabilityPct.max} %
          </li>
          <li>
            Wind sectors:{" "}
            {report.reference.authoredAcceptedRange.windDirectionSectorsDeg
              .map((sector) => `${sector.min}°–${sector.max}°`)
              .join(", ")}
          </li>
          <li>
            Defensible confidence: {report.reference.authoredAcceptedRange.defensibleConfidence.join(" or ")}
          </li>
          <li>
            Published forecast window: {report.reference.forecastWindow.startMinute} to{" "}
            {report.reference.forecastWindow.endMinute} min
          </li>
        </ul>
      </details>

      <div className={styles.actionRow}>
        <button type="button" className={styles.primaryAction} onClick={onOpenDebrief}>
          Open the debrief
        </button>
        <button type="button" onClick={onRevise}>
          Revise forecast and compare again
        </button>
      </div>
    </section>
  );
}
