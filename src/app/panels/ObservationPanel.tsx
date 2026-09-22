import { useMemo } from "react";

import { stateAtMinute } from "@/domain";
import {
  buildRegionalSummary,
  buildStationSeries,
  describeObservationFacts,
  formatHumidity,
  formatPrecipitationRate,
  formatPressure,
  formatPressureTendency,
  formatSignedDegrees,
  formatSignedHumidity,
  formatSignedPressure,
  formatSignedTemperature,
  formatSignedWindSpeed,
  formatSimulatedTimestamp,
  formatTemperature,
  formatWind,
  type EvidenceCatalog,
  type ForecastSessionState,
  type SessionMachine
} from "@/game";
import type { WeatherScenarioV1 } from "@/scenarios";
import { TrendChart } from "@/viz/TrendChart";
import { WeatherMap } from "@/viz/WeatherMap";

import { FactList } from "../components/FactList";
import { TimeControls } from "../components/TimeControls";
import styles from "../mission.module.css";

export interface ObservationPanelProps {
  readonly machine: SessionMachine;
  readonly scenario: WeatherScenarioV1;
  readonly state: ForecastSessionState;
  readonly evidence: EvidenceCatalog;
  readonly playing: boolean;
  readonly motionAllowed: boolean;
  readonly onSelectStation: (stationId: string) => void;
  readonly onSetMinute: (minute: number) => void;
  readonly onAdvance: (steps: number) => void;
  readonly onTogglePlay: () => void;
  readonly onToggleMotion: () => void;
  readonly onOpenEvidence: (evidenceId: string) => void;
  readonly onToggleEvidence: (evidenceId: string) => void;
}

const stationMarkers = [
  { shape: "circle", dash: "0" },
  { shape: "square", dash: "7 3" },
  { shape: "triangle", dash: "2 3" }
] as const;

export function ObservationPanel({
  machine,
  scenario,
  state,
  evidence,
  playing,
  motionAllowed,
  onSelectStation,
  onSetMinute,
  onAdvance,
  onTogglePlay,
  onToggleMotion,
  onOpenEvidence,
  onToggleEvidence
}: ObservationPanelProps) {
  const canonicalState = useMemo(() => stateAtMinute(machine.kernel, state.minute), [machine.kernel, state.minute]);
  const regional = useMemo(
    () => buildRegionalSummary(scenario, machine.kernel, canonicalState),
    [scenario, machine.kernel, canonicalState]
  );

  const selectedStation = scenario.stations.find((station) => station.id === state.selectedStationId)!;
  const selectedSeries = useMemo(
    () => buildStationSeries(machine.kernel, state.selectedStationId, state.minute),
    [machine.kernel, state.selectedStationId, state.minute]
  );
  const trendSeries = useMemo(
    () =>
      scenario.stations.map((station) => ({
        station,
        series: buildStationSeries(machine.kernel, station.id, state.minute)
      })),
    [machine.kernel, scenario.stations, state.minute]
  );

  const readings = selectedSeries.points.length > 1 ? selectedSeries.points : null;
  const firstReading = readings?.[0]?.observation;
  const lastReading = readings?.[readings.length - 1]?.observation;

  const temperatureLines = trendSeries.map(({ station, series }, index) => ({
    id: station.id,
    label: station.name,
    marker: stationMarkers[index % stationMarkers.length]!,
    points: series.points.map((point) => ({ minute: point.minute, value: point.observation.temperatureC }))
  }));
  const pressureLines = trendSeries.map(({ station, series }, index) => ({
    id: station.id,
    label: station.name,
    marker: stationMarkers[index % stationMarkers.length]!,
    points: series.points.map((point) => ({ minute: point.minute, value: point.observation.pressureHpa }))
  }));

  return (
    <div className={styles.workspace}>
      <div className={styles.workspaceMain}>
        <section className={styles.panel} aria-labelledby="map-heading">
          <h2 id="map-heading">Regional map</h2>
          <WeatherMap
            scenario={scenario}
            kernel={machine.kernel}
            state={canonicalState}
            selectedStationId={state.selectedStationId}
            onSelectStation={onSelectStation}
            motionAllowed={motionAllowed}
          />

          <div className={styles.boundaryBlock}>
            <h3>Front position and motion</h3>
            {regional.boundaries.map((boundary) => (
              <div key={boundary.boundaryId} className={styles.boundaryBlockInner}>
                <p>{boundary.positionSummary}</p>
                <p>{boundary.motionSummary}</p>
                <div className={styles.tableScroll}>
                  <table className={styles.facts}>
                    <caption>Extrapolated arrival at each station, assuming the current motion continues</caption>
                    <thead>
                      <tr>
                        <th scope="col">Station</th>
                        <th scope="col">Extrapolated arrival</th>
                        <th scope="col">Basis</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boundary.proximity.map((proximity) => (
                        <tr key={proximity.stationId}>
                          <th scope="row">{proximity.stationName}</th>
                          <td>
                            {proximity.etaMinutes !== undefined
                              ? formatSimulatedTimestamp(proximity.etaMinutes)
                              : "not extrapolated"}
                          </td>
                          <td>{proximity.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panel} aria-labelledby="stations-heading">
          <h2 id="stations-heading">Station reports</h2>
          <p className={styles.note}>
            Readings are valid at {evidence.timestamp}. Select a station to inspect it in detail; every row below
            is the same information the map markers represent.
          </p>

          <div className={styles.stationTabs} role="group" aria-label="Select a station to inspect">
            {scenario.stations.map((station) => (
              <button
                key={station.id}
                type="button"
                aria-pressed={station.id === state.selectedStationId}
                className={styles.stationTab}
                onClick={() => onSelectStation(station.id)}
              >
                {station.name}
              </button>
            ))}
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.facts}>
              <caption>All stations at {evidence.timestamp}</caption>
              <thead>
                <tr>
                  <th scope="col">Station</th>
                  <th scope="col">Temp</th>
                  <th scope="col">Pressure</th>
                  <th scope="col">Tendency</th>
                  <th scope="col">Humidity</th>
                  <th scope="col">Wind</th>
                  <th scope="col">Precipitation</th>
                </tr>
              </thead>
              <tbody>
                {scenario.stations.map((station) => {
                  const observation = canonicalState.stations[station.id]!;
                  return (
                    <tr key={station.id} data-selected={station.id === state.selectedStationId}>
                      <th scope="row">
                        {station.name}
                        {station.id === state.selectedStationId ? " (selected)" : ""}
                      </th>
                      <td>{formatTemperature(observation.temperatureC)}</td>
                      <td>{formatPressure(observation.pressureHpa)}</td>
                      <td>{formatPressureTendency(observation.pressureTendencyHpaPer3h)}</td>
                      <td>{formatHumidity(observation.relativeHumidityPct)}</td>
                      <td>{formatWind(observation.windDirectionDeg, observation.windSpeedMps)}</td>
                      <td>{formatPrecipitationRate(observation.precipitationRateMmh)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h3>
            {selectedStation.name} in detail
            {state.inspectedStationIds.includes(selectedStation.id) ? "" : " (not yet inspected)"}
          </h3>
          <FactList
            caption={`${selectedStation.name} instrument report at ${evidence.timestamp}`}
            facts={describeObservationFacts(canonicalState.stations[selectedStation.id]!)}
          />
          {firstReading && lastReading ? (
            <FactList
              caption={`${selectedStation.name} change since ${formatSimulatedTimestamp(0)}`}
              facts={[
                {
                  label: "Temperature change",
                  value: formatSignedTemperature(lastReading.temperatureC - firstReading.temperatureC)
                },
                {
                  label: "Pressure change",
                  value: formatSignedPressure(lastReading.pressureHpa - firstReading.pressureHpa)
                },
                {
                  label: "Humidity change",
                  value: formatSignedHumidity(
                    lastReading.relativeHumidityPct - firstReading.relativeHumidityPct
                  )
                },
                {
                  label: "Wind direction change",
                  value: formatSignedDegrees(
                    ((lastReading.windDirectionDeg - firstReading.windDirectionDeg + 540) % 360) - 180
                  )
                },
                {
                  label: "Wind speed change",
                  value: formatSignedWindSpeed(lastReading.windSpeedMps - firstReading.windSpeedMps)
                }
              ]}
            />
          ) : (
            <p className={styles.note}>
              Only one reading is available so far, so no change can be measured yet. Advance the clock to compare.
            </p>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="trends-heading">
          <h2 id="trends-heading">Trends</h2>
          {selectedSeries.points.length > 1 ? (
            <>
              <TrendChart
                title="Temperature by station"
                unit="°C"
                caption={`Temperature at each station from ${formatSimulatedTimestamp(0)} to ${evidence.timestamp}`}
                lines={temperatureLines}
                formatValue={(value) => value.toFixed(1)}
              />
              <TrendChart
                title="Pressure by station"
                unit="hPa"
                caption={`Pressure at each station from ${formatSimulatedTimestamp(0)} to ${evidence.timestamp}`}
                lines={pressureLines}
                formatValue={(value) => value.toFixed(0)}
              />
            </>
          ) : (
            <p className={styles.note}>
              A trend needs at least two readings. Advance the simulated clock by {scenario.timeline.stepMinutes}{" "}
              minutes to start a trend.
            </p>
          )}
        </section>
      </div>

      <div className={styles.workspaceSide}>
        <TimeControls
          scenario={scenario}
          minute={state.minute}
          verificationMinute={machine.verificationMinute}
          playing={playing}
          motionAllowed={motionAllowed}
          onSetMinute={onSetMinute}
          onAdvance={onAdvance}
          onTogglePlay={onTogglePlay}
          onToggleMotion={onToggleMotion}
        />

        <section className={styles.panel} aria-labelledby="evidence-heading">
          <h2 id="evidence-heading">Evidence</h2>
          <p className={styles.note}>
            Attaching evidence records the reasoning behind your forecast. Evidence becomes available as the
            simulated clock reaches it.
          </p>

          <ul className={styles.evidenceList}>
            {evidence.unlocked.map((item) => {
              const attached = state.selectedEvidenceIds.includes(item.id);
              return (
                <li key={item.id} className={styles.evidenceItem}>
                  <div className={styles.evidenceHeader}>
                    <h3>{item.title}</h3>
                    <span className={styles.evidenceMeta}>
                      available {item.timestamp} · tags: {item.learningTags.join(", ")}
                    </span>
                  </div>
                  <p>{item.summary}</p>
                  <div className={styles.evidenceActions}>
                    <button type="button" aria-pressed={attached} onClick={() => onToggleEvidence(item.id)}>
                      {attached ? "Attached to forecast reasoning" : "Attach to forecast reasoning"}
                    </button>
                    <button type="button" onClick={() => onOpenEvidence(item.id)}>
                      Open detailed evidence
                    </button>
                  </div>
                  {state.openedEvidenceIds.includes(item.id) ? (
                    <FactList caption={`${item.title} — exact values`} facts={item.facts} compact />
                  ) : (
                    <p className={styles.note}>
                      This evidence is available, but its exact-value table has not been opened yet.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>

          {evidence.locked.length > 0 ? (
            <div className={styles.lockedEvidence}>
              <h3>Not yet available</h3>
              <ul>
                {evidence.locked.map((item) => (
                  <li key={item.id}>
                    {item.title} — available at {formatSimulatedTimestamp(item.availableAtMinute)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
