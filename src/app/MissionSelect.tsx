import {
  MISSIONS,
  formatDuration,
  formatMinuteRange,
  formatSimulatedTimestamp,
  scenarioByMissionType,
  type MissionType
} from "@/game";

import styles from "./mission.module.css";

export interface MissionSelectProps {
  readonly onOpenMission: (missionType: MissionType) => void;
}

export function MissionSelect({ onOpenMission }: MissionSelectProps) {
  const first = scenarioByMissionType(MISSIONS[0]!.missionType)!;
  const modelBoundaries = [
    ...new Map(
      MISSIONS.flatMap((mission) => scenarioByMissionType(mission.missionType)!.simplifications).map((boundary) => [
        boundary.id,
        boundary
      ])
    ).values()
  ];
  const sources = [
    ...new Map(
      MISSIONS.flatMap((mission) => scenarioByMissionType(mission.missionType)!.sources).map((source) => [
        source.id,
        source
      ])
    ).values()
  ];

  return (
    <>
      <section className={styles.panel} aria-labelledby="collection-heading">
        <p className={styles.eyebrow}>Forecast desk · four missions · deterministic simulation</p>
        <h1 id="collection-heading">Weather Command</h1>
        <p className={styles.lede}>
          Read the evidence, commit a forecast with a range and a confidence level, then compare it with what the
          simulated weather actually did. Nothing here is live weather, and no answer is revealed before you
          commit.
        </p>

        <div className={styles.noticeRow}>
          <p className={styles.notice} role="note">
            <strong>Simulation, not live weather.</strong> Every station, front and forecast in this game is
            fictional and generated deterministically on your device. There is no live data, no location, no
            account, and nothing is sent anywhere.
          </p>
          <p className={styles.notice} role="note">
            <strong>Play offline-safe.</strong> The whole game runs from static files with no gameplay network
            requests, so it behaves the same on a school tablet with no connection.
          </p>
        </div>
      </section>

      <section aria-labelledby="missions-heading">
        <h2 id="missions-heading" className={styles.sectionHeading}>
          Choose a mission
        </h2>
        <ul className={styles.missionList}>
          {MISSIONS.map((mission) => (
            <li key={mission.scenarioId} className={styles.missionCard}>
              <div className={styles.missionCardHeader}>
                <h3>{mission.title}</h3>
                <span className={styles.difficultyTag}>{mission.difficultyLabel}</span>
              </div>
              <p>{mission.focus}</p>
              <p className={styles.missionObjective}>{mission.objective}</p>
              <dl className={styles.definitionList}>
                <dt>Forecast target</dt>
                <dd>{mission.targetStationName}</dd>
                <dt>Forecast window</dt>
                <dd>{formatMinuteRange(mission.forecastWindow.startMinute, mission.forecastWindow.endMinute)}</dd>
                <dt>Mission length</dt>
                <dd>
                  {formatDuration(mission.timeline.maxMinute)} in {mission.timeline.stepMinutes}-minute steps
                </dd>
                <dt>Evidence tools</dt>
                <dd>
                  {mission.evidenceCount} sets across {mission.stationCount} stations
                </dd>
              </dl>
              <h4 className={styles.cardSubheading}>This mission teaches</h4>
              <ul className={styles.bulletList}>
                {mission.teaches.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => onOpenMission(mission.missionType)}
              >
                Open briefing for {mission.title}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.panel} aria-labelledby="model-heading">
        <h2 id="model-heading">What the model does and does not do</h2>
        <p className={styles.note}>
          The simulation is an authored, deterministic set of causal rules, not a numerical weather prediction
          model. Every mission states the same thing up front: forecasts are made from evidence, and simplifications
          are declared rather than hidden.
        </p>
        <table className={styles.facts}>
          <caption>Declared model boundaries across all four missions</caption>
          <tbody>
            {modelBoundaries.map((boundary) => (
              <tr key={boundary.id}>
                <th scope="row">{boundary.id}</th>
                <td>{boundary.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Science sources behind the content</h3>
        <ul className={styles.bulletList}>
          {sources.map((source) => (
            <li key={source.id}>
              <a href={source.url} rel="noreferrer noopener" target="_blank">
                {source.id}
              </a>{" "}
              — {source.relationship} {source.reviewed ? "(reviewed)" : "(review pending)"}
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Science-review status: the canonical scenario content carries{" "}
          <code>{first.scienceReviewStatus}</code>. The independent human science review is tracked separately in
          the project&apos;s Jira epic; this build does not claim that review has happened.
        </p>
        <p className={styles.note}>
          Simulated day starts at {formatSimulatedTimestamp(0)} and every reading is stamped with the simulated time
          it became available.
        </p>
      </section>
    </>
  );
}
