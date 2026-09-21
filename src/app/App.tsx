import { useMemo } from "react";

import { foundationScenario } from "@/scenarios/foundationScenario";
import { parseFoundationScenario } from "@/scenarios/schema";
import { WeatherMapShell } from "@/viz/WeatherMapShell";

import styles from "./App.module.css";

export function App() {
  const scenario = useMemo(() => parseFoundationScenario(foundationScenario), []);

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Forecast desk · foundation build</p>
        <h1>Weather Command</h1>
        <p className={styles.lede}>
          Read changing atmospheric evidence, make a forecast, then compare it with what the simulated system does.
        </p>
      </header>

      <section className={styles.notice} aria-labelledby="simulation-heading">
        <h2 id="simulation-heading">Simulation, not live weather</h2>
        <p>This build contains no live forecast, location, account, analytics, or remote learner data.</p>
      </section>

      <section className={styles.workspace} aria-labelledby="workspace-heading">
        <div>
          <p className={styles.eyebrow}>WC-02 architecture smoke</p>
          <h2 id="workspace-heading">{scenario.title}</h2>
          <p>
            This is the accessible rendering seam only. Scientific transition rules and production missions begin in later Jira gates.
          </p>
        </div>
        <WeatherMapShell scenario={scenario} />
      </section>
    </main>
  );
}
