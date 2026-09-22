import { useId, useMemo } from "react";

import type { KernelScenarioDefinition, ScenarioState } from "@/domain";
import type { WeatherScenarioV1 } from "@/scenarios";
import { buildRegionalSummary, formatPrecipitationRate, formatSimulatedTimestamp, roundTo } from "@/game";

import styles from "./WeatherMap.module.css";

export interface WeatherMapProps {
  readonly scenario: WeatherScenarioV1;
  readonly kernel: KernelScenarioDefinition;
  readonly state: ScenarioState;
  readonly selectedStationId: string;
  readonly onSelectStation?: (stationId: string) => void;
  readonly motionAllowed: boolean;
}

const WIDTH = 100;
const HEIGHT = 64;

const toX = (value: number): number => roundTo(value * WIDTH, 3);
const toY = (value: number): number => roundTo(value * HEIGHT, 3);

/**
 * Non-colour encodings per boundary kind. Every distinction drawn with colour is also drawn
 * with a line style and a written label, so the map remains readable without colour vision
 * and in high-contrast/print contexts.
 */
const boundaryStyle: Record<
  WeatherScenarioV1["boundaries"][number]["kind"],
  { readonly dash: string; readonly width: number; readonly label: string }
> = {
  "cold-front": { dash: "4 2", width: 1.1, label: "Cold front (dashed line)" },
  "warm-front": { dash: "1.2 1.6", width: 1.1, label: "Warm front (dotted line)" },
  "other-bounded-transition": { dash: "5 1.5 1.5 1.5", width: 1.1, label: "Bounded transition (dash-dot line)" }
};

export function WeatherMap({
  scenario,
  kernel,
  state,
  selectedStationId,
  onSelectStation,
  motionAllowed
}: WeatherMapProps) {
  const gradientId = useId();
  const hatchId = useId();
  const arrowId = useId();

  const summary = useMemo(
    () => buildRegionalSummary(scenario, kernel, state),
    [scenario, kernel, state]
  );

  const boundaryGeometries = scenario.boundaries.map((boundary) => {
    const boundaryState = state.boundaries.find((candidate) => candidate.id === boundary.id);
    const path = boundaryState ? boundaryState.path : boundary.initialPath;
    const points = path.map((point) => `${toX(point.x)},${toY(point.y)}`).join(" ");
    const start = path[0]!;
    const speed = Math.hypot(boundary.movement.x, boundary.movement.y);
    return {
      boundary,
      points,
      style: boundaryStyle[boundary.kind],
      direction: speed === 0 ? { x: 0, y: 0 } : { x: boundary.movement.x / speed, y: boundary.movement.y / speed },
      labelPoint: { x: toX(start.x), y: toY(start.y) }
    };
  });

  const stationGeometries = scenario.stations.map((station) => ({
    station,
    x: toX(station.position.x),
    y: toY(station.position.y)
  }));

  return (
    <figure className={styles.figure}>
      <figcaption className={styles.caption}>
        Regional map · {formatSimulatedTimestamp(state.minute)}
      </figcaption>

      <div className={styles.mapFrame}>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Regional forecast map at ${summary.timestamp}. Every fact shown here is repeated as text directly below the map.`}
          className={motionAllowed ? styles.map : `${styles.map} ${styles.still}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#123049" />
              <stop offset="100%" stopColor="#0c2131" />
            </linearGradient>
            <pattern id={hatchId} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="3" height="3" fill="var(--precipitation-weak)" />
              <line x1="0" y1="0" x2="0" y2="3" stroke="var(--precipitation)" strokeWidth="1.1" />
            </pattern>
            <marker id={arrowId} viewBox="0 0 6 6" refX="5" refY="3" markerWidth="3" markerHeight="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill={`url(#${gradientId})`} rx="1.5" />
          {[20, 40, 60, 80].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2={HEIGHT} className={styles.grid} />
          ))}
          {[16, 32, 48].map((y) => (
            <line key={y} x1="0" y1={y} x2={WIDTH} y2={y} className={styles.grid} />
          ))}

          <g className={styles.compass} aria-hidden="true">
            <line x1="95" y1="58" x2="95" y2="50" className={styles.compassLine} />
            <path d="M 95 48.5 L 93.6 51 L 96.4 51 z" className={styles.compassHead} />
            <text x="97.5" y="50" className={styles.compassLabel}>
              N
            </text>
          </g>

          {summary.airMasses.map((airMass) => (
            <text
              key={airMass.airMassId}
              x={toX(airMass.center.x)}
              y={toY(airMass.center.y) - 9}
              textAnchor="middle"
              className={styles.airMassLabel}
            >
              {airMass.label}
            </text>
          ))}

          {summary.precipitationCells.map((cell) => {
            const scenarioCell = scenario.precipitationCells.find((candidate) => candidate.id === cell.cellId)!;
            const cellState = state.precipitationCells.find((candidate) => candidate.id === cell.cellId);
            const center = cellState ? cellState.center : scenarioCell.initialCenter;
            return (
              <g key={cell.cellId}>
                <circle
                  cx={toX(center.x)}
                  cy={toY(center.y)}
                  r={13}
                  fill={`url(#${hatchId})`}
                  className={styles.precipitation}
                />
                <text x={toX(center.x)} y={toY(center.y) + 1} textAnchor="middle" className={styles.cellLabel}>
                  {formatPrecipitationRate(cell.intensityMmh)}
                </text>
              </g>
            );
          })}

          {boundaryGeometries.map((geometry) => (
            <g key={geometry.boundary.id}>
              <polyline
                points={geometry.points}
                fill="none"
                stroke={`var(--${geometry.boundary.kind === "cold-front" ? "cold-front" : geometry.boundary.kind === "warm-front" ? "warm-front" : "other-front"})`}
                strokeWidth={geometry.style.width}
                strokeDasharray={geometry.style.dash}
                strokeLinecap="round"
              />
              <line
                x1={geometry.labelPoint.x}
                y1={geometry.labelPoint.y - 5}
                x2={geometry.labelPoint.x + geometry.direction.x * 12}
                y2={geometry.labelPoint.y - 5 + geometry.direction.y * 12}
                stroke="var(--text-muted)"
                strokeWidth="0.5"
                markerEnd={`url(#${arrowId})`}
              />
              <text
                x={geometry.labelPoint.x + 1}
                y={geometry.labelPoint.y - 6.5}
                className={styles.boundaryLabel}
              >
                {geometry.boundary.kind === "cold-front"
                  ? "Cold front"
                  : geometry.boundary.kind === "warm-front"
                    ? "Warm front"
                    : "Bounded transition"}
              </text>
            </g>
          ))}

          {stationGeometries.map(({ station, x, y }) => {
            const selected = station.id === selectedStationId;
            return (
              <g
                key={station.id}
                className={styles.stationGroup}
                onPointerUp={onSelectStation ? () => onSelectStation(station.id) : undefined}
              >
                {selected ? <circle cx={x} cy={y} r="4.6" className={styles.stationSelectedRing} /> : null}
                <circle cx={x} cy={y} r="2" className={styles.stationDot} />
                <line x1={x - 3.4} y1={y} x2={x + 3.4} y2={y} className={styles.stationTick} />
                <text x={x + 5} y={y + 1.1} className={styles.stationName}>
                  {station.name}
                  {selected ? " (selected)" : ""}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <ul className={styles.legend}>
        {boundaryGeometries.map((geometry) => (
          <li key={geometry.boundary.id}>
            <span className={styles.legendText}>{geometry.style.label}</span>
          </li>
        ))}
        <li>
          <span className={styles.legendText}>Precipitation band (hatched circle, intensity labelled)</span>
        </li>
        <li>
          <span className={styles.legendText}>
            Station (crossed dot, always labelled; the selected station has an outer ring and the word
            &ldquo;selected&rdquo; beside its name)
          </span>
        </li>
        <li>
          <span className={styles.legendText}>Grey arrow: modelled direction of travel</span>
        </li>
      </ul>
    </figure>
  );
}
