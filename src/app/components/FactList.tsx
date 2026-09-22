import type { EvidenceFact } from "@/game";

import styles from "../mission.module.css";

export interface FactListProps {
  readonly caption: string;
  readonly facts: readonly EvidenceFact[];
  readonly compact?: boolean;
}

/**
 * Renders derived facts as real text in a table.
 *
 * This is the semantic equivalent of every map layer, chart and marker in the game: if a fact
 * is visible on the map or a chart, it also appears here as readable text with its label.
 */
export function FactList({ caption, facts, compact = false }: FactListProps) {
  if (facts.length === 0) return null;
  return (
    <table className={compact ? `${styles.facts} ${styles.factsCompact}` : styles.facts}>
      <caption>{caption}</caption>
      <tbody>
        {facts.map((fact, index) => (
          <tr key={`${fact.label}-${index}`}>
            <th scope="row">{fact.label}</th>
            <td>
              {fact.value}
              {fact.note ? <span className={styles.factNote}>{fact.note}</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
