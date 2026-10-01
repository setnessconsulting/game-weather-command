import { useCallback, useEffect, useMemo, useReducer, useState } from "react";

import type { WeatherScenarioV1 } from "@/scenarios";
import {
  buildEvidenceCatalog,
  createSessionMachine,
  sessionSnapshot,
  type ForecastSessionState,
  type SessionAction
} from "@/game";
import { stateAtMinute } from "@/domain";

export interface MissionSession {
  readonly machine: ReturnType<typeof createSessionMachine>;
  readonly state: ForecastSessionState;
  readonly dispatch: (action: SessionAction) => void;
  readonly snapshot: ReturnType<typeof sessionSnapshot>;
  readonly evidence: ReturnType<typeof buildEvidenceCatalog>;
}

/**
 * Binds the pure session machine to React. All scientific truth is read from the canonical
 * kernel on demand; nothing derived from it is stored in component state, so a rendering bug
 * can never become a scientific claim.
 */
export function useMissionSession(scenario: WeatherScenarioV1): MissionSession {
  const machine = useMemo(() => createSessionMachine(scenario), [scenario]);
  const [state, dispatch] = useReducer(
    (current: ForecastSessionState, action: SessionAction) => machine.reduce(current, action),
    machine.initialState
  );

  const canonicalState = useMemo(() => stateAtMinute(machine.kernel, state.minute), [machine.kernel, state.minute]);
  const evidence = useMemo(
    () => buildEvidenceCatalog(scenario, machine.kernel, canonicalState),
    [scenario, machine.kernel, canonicalState]
  );
  const snapshot = useMemo(() => sessionSnapshot(state), [state]);

  return { machine, state, dispatch, snapshot, evidence };
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function systemPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(reducedMotionQuery).matches;
}

export interface MotionPreference {
  readonly reducedMotion: boolean;
  readonly toggleReducedMotion: () => void;
  readonly playing: boolean;
  readonly togglePlaying: () => void;
}

/**
 * Seeded from the operating-system setting and kept in sync with it, so a player who asked
 * their device to reduce motion never has to discover the in-app toggle to get it. The
 * in-app toggle still exists for a player who wants to change it mid-session.
 */
export function useMotionPreference(): MotionPreference {
  const [reducedMotion, setReducedMotion] = useState(systemPrefersReducedMotion);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(reducedMotionQuery);
    const sync = (event: MediaQueryList | MediaQueryListEvent) => {
      setReducedMotion(event.matches);
      if (event.matches) setPlaying(false);
    };
    sync(list);
    list.addEventListener("change", sync);
    return () => list.removeEventListener("change", sync);
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion((current) => {
      if (!current) setPlaying(false);
      return !current;
    });
  }, []);
  const togglePlaying = useCallback(() => setPlaying((current) => !current), []);
  return { reducedMotion, toggleReducedMotion, playing, togglePlaying };
}
