import { stateAtMinute } from "@/domain";
import {
  buildEvidenceCatalog,
  formatSimulatedTimestamp,
  type EvidenceCatalog,
  type ForecastSessionState,
  type SessionMachine,
  type VerificationReport
} from "@/game";

import { FactList } from "../components/FactList";
import styles from "../mission.module.css";

export interface DebriefPanelProps {
  readonly machine: SessionMachine;
  readonly state: ForecastSessionState;
  readonly evidence: EvidenceCatalog;
  readonly report: VerificationReport;
  readonly onRevise: () => void;
  readonly onBackToMissions: () => void;
}

export function DebriefPanel({
  machine,
  state,
  evidence,
  report,
  onRevise,
  onBackToMissions
}: DebriefPanelProps) {
  const fullCatalog = buildEvidenceCatalog(
    machine.scenario,
    machine.kernel,
    stateAtMinute(machine.kernel, machine.kernel.timeline.maxMinute)
  );
  const evidenceById = new Map(fullCatalog.unlocked.map((item) => [item.id, item]));
  const attached = new Set(report.evidenceQuality.selected);
  void evidence;

  return (
    <section className={styles.panel} aria-labelledby="debrief-heading">
      <div className={styles.panelHeader}>
        <p className={styles.eyebrow}>
          Debrief · {machine.scenario.title} · attempt {report.mode === "forecast" ? "recorded as a forecast" : report.mode}
        </p>
        <h2 id="debrief-heading">Why the outcome happened</h2>
        <p className={styles.lede}>{report.headline}</p>
      </div>

      {machine.scenario.debrief.map((relationship) => (
        <section key={relationship.id} className={styles.dimensionGroup} aria-labelledby={`${relationship.id}-heading`}>
          <h3 id={`${relationship.id}-heading`}>Cause and effect</h3>
          <p>{relationship.explanation}</p>
          <p className={styles.note}>
            Outcome dimensions: {relationship.outcomeDimensions.join(", ")}.
          </p>
          <h4>Evidence this explanation rests on</h4>
          <ul className={styles.bulletList}>
            {relationship.evidenceIds.map((evidenceId) => {
              const evidence = evidenceById.get(evidenceId);
              return (
                <li key={evidenceId}>
                  <strong>{evidence?.title ?? evidenceId}</strong>{" "}
                  {attached.has(evidenceId) ? (
                    <span className={styles.attachedTag}>you attached this</span>
                  ) : (
                    <span className={styles.missingTag}>you did not attach this</span>
                  )}
                  {evidence ? <> — {evidence.summary}</> : null}
                </li>
              );
            })}
          </ul>
          <div className={styles.sourceRefs}>
            <h4>Sources behind this explanation</h4>
            <ul>
              {relationship.sourceRefIds.map((sourceId) => {
                const source = machine.scenario.sources.find((candidate) => candidate.id === sourceId);
                if (!source) return null;
                return (
                  <li key={sourceId}>
                    <a href={source.url} rel="noreferrer noopener" target="_blank">
                      {source.id}
                    </a>{" "}
                    — {source.relationship}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section className={styles.dimensionGroup} aria-labelledby="dimensions-heading">
        <h3 id="dimensions-heading">How each dimension was assessed</h3>
        <table className={styles.facts}>
          <caption>Separate dimensions, no single correctness flag</caption>
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">Assessment</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Timing</th>
              <td>{report.timing.level}</td>
              <td>{report.timing.detail}</td>
            </tr>
            {report.ranges.map((range) => (
              <tr key={range.dimension}>
                <th scope="row">{range.label}</th>
                <td>{range.level}</td>
                <td>{range.detail}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Evidence quality</th>
              <td>{report.evidenceQuality.level}</td>
              <td>{report.evidenceQuality.detail}</td>
            </tr>
            <tr>
              <th scope="row">Causal reasoning consistency</th>
              <td>{report.causalReasoning.level}</td>
              <td>{report.causalReasoning.notes.join(" ") || "Forecast, recommendation and evidence told one consistent story."}</td>
            </tr>
            <tr>
              <th scope="row">Confidence calibration</th>
              <td>{report.calibration.level}</td>
              <td>{report.calibration.detail}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.dimensionGroup} aria-labelledby="attempts-heading">
        <h3 id="attempts-heading">Attempts</h3>
        <ul className={styles.bulletList}>
          {state.attempts.map((attempt) => (
            <li key={attempt.attemptIndex}>
              Attempt {attempt.attemptIndex + 1}: committed at {formatSimulatedTimestamp(attempt.committedAtMinute)}
              {attempt.verification
                ? ` · ${attempt.verification.mode} · timing ${attempt.verification.timing.level}, calibration ${attempt.verification.calibration.level}`
                : " · not compared"}
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Revising is the normal way to work. Nothing here is scored against a single canonical number, and a
          second attempt is worth more than a perfect first one.
        </p>
      </section>

      <section className={styles.dimensionGroup} aria-labelledby="limits-heading">
        <h3 id="limits-heading">What this model does not do</h3>
        <FactList
          caption="Declared model boundaries"
          facts={report.modelBoundaries.map((boundary) => ({ label: boundary.id, value: boundary.description }))}
        />
      </section>

      <div className={styles.actionRow}>
        <button type="button" className={styles.primaryAction} onClick={onRevise}>
          Revise and compare again
        </button>
        <button type="button" onClick={onBackToMissions}>
          Back to mission list
        </button>
      </div>
    </section>
  );
}
