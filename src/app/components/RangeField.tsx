import { useState, type ChangeEvent } from "react";

import type { ForecastIssue, NumericRangeValue } from "@/game";

import styles from "../mission.module.css";

export interface RangeFieldProps {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly unit: string;
  readonly value: NumericRangeValue | null;
  readonly step?: number;
  readonly lowLabel?: string;
  readonly highLabel?: string;
  readonly issues: readonly ForecastIssue[];
  readonly onChange: (range: NumericRangeValue | null) => void;
}

const parse = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

/**
 * Two-ended numeric range input.
 *
 * Plain number inputs only — no slider and no drag — so entering a forecast is equally
 * possible with a keyboard, a touch screen, a switch device or a screen reader. Partial input
 * is kept locally so a lone minus sign is still typeable.
 */
export function RangeField({
  id,
  label,
  hint,
  unit,
  value,
  step = 1,
  lowLabel = "Low end",
  highLabel = "High end",
  issues,
  onChange
}: RangeFieldProps) {
  const [low, setLow] = useState(value ? String(value.min) : "");
  const [high, setHigh] = useState(value ? String(value.max) : "");

  const update = (nextLow: string, nextHigh: string): void => {
    setLow(nextLow);
    setHigh(nextHigh);
    const parsedLow = parse(nextLow);
    const parsedHigh = parse(nextHigh);
    if (parsedLow === undefined || parsedHigh === undefined) {
      onChange(null);
      return;
    }
    onChange({ min: parsedLow, max: parsedHigh });
  };

  const fieldIssues = issues.filter((issue) => issue.severity === "blocking");
  const advisories = issues.filter((issue) => issue.severity === "advisory");
  const hintId = `${id}-hint`;
  const issueId = `${id}-issues`;

  return (
    <fieldset className={styles.field} aria-describedby={`${hintId}${fieldIssues.length > 0 ? ` ${issueId}` : ""}`}>
      <legend className={styles.fieldLegend}>
        {label} <span className={styles.fieldUnit}>({unit})</span>
      </legend>
      <p id={hintId} className={styles.fieldHint}>
        {hint}
      </p>
      <div className={styles.rangeInputs}>
        <span className={styles.rangeInput}>
          <label htmlFor={`${id}-low`}>{lowLabel}</label>
          <input
            id={`${id}-low`}
            type="number"
            inputMode="decimal"
            step={step}
            value={low}
            onChange={(event: ChangeEvent<HTMLInputElement>) => update(event.target.value, high)}
          />
        </span>
        <span className={styles.rangeInput}>
          <label htmlFor={`${id}-high`}>{highLabel}</label>
          <input
            id={`${id}-high`}
            type="number"
            inputMode="decimal"
            step={step}
            value={high}
            onChange={(event: ChangeEvent<HTMLInputElement>) => update(low, event.target.value)}
          />
        </span>
      </div>
      <p id={issueId} className={styles.fieldIssues} role={fieldIssues.length > 0 ? "alert" : undefined}>
        {fieldIssues.map((issue) => (
          <span key={issue.message} className={styles.issueBlocking}>
            {issue.message}
          </span>
        ))}
      </p>
      {advisories.length > 0 ? (
        <ul className={styles.advisories}>
          {advisories.map((issue) => (
            <li key={issue.message}>{issue.message}</li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}
