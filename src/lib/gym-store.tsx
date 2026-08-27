import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  emptyState,
  loadState,
  saveState,
  type GymState,
  type Schedule,
  type SetEntry,
} from "./gym";

type Ctx = {
  state: GymState;
  ready: boolean;
  addSet: (input: { exerciseId: string; muscleId: string; weight: number; reps: number }) => void;
  removeSet: (id: string) => void;
  addExercise: (muscleId: string, name: string) => void;
  setSchedule: (schedule: Schedule) => void;
};

const GymContext = createContext<Ctx | null>(null);

export function GymProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GymState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      addSet: ({ exerciseId, muscleId, weight, reps }) => {
        const entry: SetEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          exerciseId,
          muscleId,
          weight,
          reps,
          ts: Date.now(),
        };
        setState((s) => ({ ...s, sets: [...s.sets, entry] }));
      },
      removeSet: (id) => setState((s) => ({ ...s, sets: s.sets.filter((x) => x.id !== id) })),
      addExercise: (muscleId, name) =>
        setState((s) => ({
          ...s,
          exercises: [
            ...s.exercises,
            {
              id: `${muscleId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random()
                .toString(36)
                .slice(2, 5)}`,
              name,
              muscleId,
              custom: true,
            },
          ],
        })),
      setSchedule: (schedule) => setState((s) => ({ ...s, schedule })),
    }),
    [state, ready],
  );

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used inside GymProvider");
  return ctx;
}
