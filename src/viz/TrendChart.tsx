import { useId, useMemo } from "react";

import { roundTo } from "@/game";

import styles from "./TrendChart.module.css";

export interface TrendLineMarker {
  readonly shape: "circle" | "square" | "triangle" | "cross";
  readonly dash: string;
}

export interface TrendLine {
  readonly id: string;
  readonly label: string;
  readonly marker: TrendLineMarker;
  readonly points: readonly { readonly minute: number; readonly value: number }[];
}

export interface TrendChartProps {
  readonly title: string;
  readonly unit: string;
  readonly lines: readonly TrendLine[];
  readonly formatValue: (value: number) => string;
  readonly caption: string;
}

const WIDTH = 320;
const HEIGHT = 150;
const PADDING = { left: 46, right: 12, top: 14, bottom: 26 };

function markerPath(shape: TrendLineMarker["shape"], x: number, y: number): string {
  switch (shape) {
    case "square":
      return `M ${x - 2.6} ${y - 2.6} h 5.2 v 5.2 h -5.2 z`;
    case "triangle":
      return `M ${x} ${y - 3.1} L ${x + 3} ${y + 2.4} L ${x - 3} ${y + 2.4} z`;
    case "cross":
      return `M ${x - 2.8} ${y} h 5.6 M ${x} ${y - 2.8} v 5.6`;
    default:
      return `M ${x - 2.7} ${y} a 2.7 2.7 0 1 0 5.4 0 a 2.7 2.7 0 1 0 -5.4 0`;
  }
}

/**
 * Line chart for a station variable.
 *
 * The chart is decorative: it is hidden from assistive technology and the exact numbers are
 * always available in the table beside it, so no chart fact exists only in SVG geometry.
 * Each series differs by marker shape and dash pattern as well as colour.
 */
export function TrendChart({ title, unit, lines, formatValue, caption }: TrendChartProps) {
  const titleId = useId();

  const geometry = useMemo(() => {
    const minutes = [...new Set(lines.flatMap((line) => line.points.map((point) => point.minute)))].sort(
      (a, b) => a - b
    );
    const values = lines.flatMap((line) => line.points.map((point) => point.value));
    const rawMin = values.length > 0 ? Math.min(...values) : 0;
    const rawMax = values.length > 0 ? Math.max(...values) : 1;
    const span = rawMax - rawMin || 1;
    const min = rawMin - span * 0.1;
    const max = rawMax + span * 0.1;
    const minMinute = minutes[0] ?? 0;
    const maxMinute = minutes[minutes.length - 1] ?? 1;
    const minuteSpan = maxMinute - minMinute || 1;

    const scaleX = (minute: number): number =>
      roundTo(PADDING.left + ((minute - minMinute) / minuteSpan) * (WIDTH - PADDING.left - PADDING.right), 2);
    const scaleY = (value: number): number =>
      roundTo(HEIGHT - PADDING.bottom - ((value - min) / (max - min)) * (HEIGHT - PADDING.top - PADDING.bottom), 2);

    const yTicks = [min, min + (max - min) / 2, max];
    const xTicks = minutes.filter((_, index) => index % Math.ceil(minutes.length / 6) === 0);

    return { minutes, min, max, scaleX, scaleY, yTicks, xTicks };
  }, [lines]);

  return (
    <section className={styles.chart} aria-labelledby={titleId}>
      <h4 id={titleId} className={styles.title}>
        {title} <span className={styles.unit}>({unit})</span>
      </h4>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        aria-hidden="true"
        focusable="false"
        className={styles.svg}
        preserveAspectRatio="none"
      >
        <rect
          x={PADDING.left}
          y={PADDING.top}
          width={WIDTH - PADDING.left - PADDING.right}
          height={HEIGHT - PADDING.top - PADDING.bottom}
          className={styles.plot}
        />
        {geometry.yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={PADDING.left}
              y1={geometry.scaleY(tick)}
              x2={WIDTH - PADDING.right}
              y2={geometry.scaleY(tick)}
              className={styles.gridline}
            />
            <text x={PADDING.left - 6} y={geometry.scaleY(tick) + 3} textAnchor="end" className={styles.tick}>
              {formatValue(tick)}
            </text>
          </g>
        ))}
        {geometry.xTicks.map((minute) => (
          <text
            key={`x-${minute}`}
            x={geometry.scaleX(minute)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className={styles.tick}
          >
            {minute}
          </text>
        ))}
        <text x={WIDTH / 2} y={HEIGHT} textAnchor="middle" className={styles.axisLabel}>
          simulated minutes
        </text>

        {lines.map((line) => (
          <g key={line.id}>
            <polyline
              points={line.points
                .map((point) => `${geometry.scaleX(point.minute)},${geometry.scaleY(point.value)}`)
                .join(" ")}
              fill="none"
              className={styles.line}
              strokeDasharray={line.marker.dash}
              strokeWidth="2"
            />
            {line.points.map((point) => (
              <path
                key={`${line.id}-${point.minute}`}
                d={markerPath(line.marker.shape, geometry.scaleX(point.minute), geometry.scaleY(point.value))}
                className={styles.markerPath}
                data-marker={line.marker.shape}
              />
            ))}
          </g>
        ))}
      </svg>

      <ul className={styles.legend}>
        {lines.map((line) => (
          <li key={line.id}>
            <svg viewBox="0 0 24 10" aria-hidden="true" className={styles.legendSwatch}>
              <line x1="0" y1="5" x2="24" y2="5" strokeDasharray={line.marker.dash} className={styles.line} strokeWidth="2" />
              <path d={markerPath(line.marker.shape, 12, 5)} className={styles.markerPath} data-marker={line.marker.shape} />
            </svg>
            <span>
              {line.label} — {line.marker.shape} marker, {line.marker.dash === "0" ? "solid" : "dashed"} line
            </span>
          </li>
        ))}
      </ul>

      <details className={styles.tableToggle}>
        <summary>View {title.toLowerCase()} as a table</summary>
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Station</th>
              {geometry.minutes.map((minute) => (
                <th key={minute} scope="col">
                  T+{minute}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id}>
                <th scope="row">{line.label}</th>
                {geometry.minutes.map((minute) => {
                  const point = line.points.find((candidate) => candidate.minute === minute);
                  return <td key={minute}>{point ? formatValue(point.value) : "–"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
