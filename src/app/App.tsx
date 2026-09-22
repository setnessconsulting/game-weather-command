import { useMemo, useState } from "react";

import { missionByMissionType, scenarioByMissionType, type MissionType } from "@/game";

import styles from "./App.module.css";
import { MissionScreen } from "./MissionScreen";
import { MissionSelect } from "./MissionSelect";

export function App() {
  const [openMissionType, setOpenMissionType] = useState<MissionType | null>(null);

  const opened = useMemo(() => {
    if (!openMissionType) return undefined;
    const mission = missionByMissionType(openMissionType);
    const scenario = scenarioByMissionType(openMissionType);
    if (!mission || !scenario) return undefined;
    return { mission, scenario };
  }, [openMissionType]);

  return (
    <main className={styles.shell}>
      <div className={styles.shellHeader}>
        <p className={styles.brand}>Weather Command</p>
        <p className={styles.brandNote}>Deterministic forecast training · simulation only</p>
      </div>
      {opened ? (
        <MissionScreen
          key={opened.mission.scenarioId}
          scenario={opened.scenario}
          mission={opened.mission}
          onExit={() => setOpenMissionType(null)}
        />
      ) : (
        <MissionSelect onOpenMission={setOpenMissionType} />
      )}
    </main>
  );
}
