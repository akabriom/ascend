import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/AuthGate";
import {
  DEFAULT_EXERCISES,
  DEFAULT_SCHEDULE,
  emptyState,
  loadState,
  sanitizeState,
  saveState,
  type GymState,
  type Schedule,
  type SetEntry,
} from "./gym";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

type Ctx = {
  state: GymState;
  ready: boolean;
  sync: SyncStatus;
  addSet: (input: { exerciseId: string; muscleId: string; weight: number; reps: number; ts?: number; drop?: boolean }) => void;
  removeSet: (id: string) => void;
  setSetDate: (id: string, ts: number) => void;
  addExercise: (muscleId: string, name: string, bodyweight?: boolean) => void;
  removeExercise: (id: string) => void;
  setExerciseBodyweight: (id: string, bodyweight: boolean) => void;
  setSchedule: (schedule: Schedule) => void;
};

const GymContext = createContext<Ctx | null>(null);

function normalize(raw: unknown): GymState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<GymState>;
  if (!Array.isArray(parsed.sets)) return null;
  return sanitizeState({
    sets: parsed.sets,
    exercises: parsed.exercises?.length ? parsed.exercises : DEFAULT_EXERCISES,
    schedule: { ...DEFAULT_SCHEDULE, ...(parsed.schedule ?? {}) },
  });
}

export function GymProvider({ children }: { children: ReactNode }) {
  const { userId } = useAccount();
  const [state, setState] = useState<GymState>(emptyState);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncStatus>("idle");
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull from the cloud once per account; fall back to the on-device copy.
  // Pull from the cloud once per account; seed empty state if brand new account
useEffect(() => {
  let cancelled = false;
  setReady(false);
  setSync("syncing");

  (async () => {
    const { data, error } = await supabase
      .from("gym_state")
      .select("data")
      .eq("user_id", userId)
      .maybeSingle();

    if (cancelled) return;

    const remote = error ? null : normalize(data?.data);

    if (remote) {
      // SCENARIO A: Existing code (e.g., Laptop signing into Phone's code)
      // Remote cloud data is the single source of truth!
      setState(remote);
      saveState(remote);
    } else {
      // SCENARIO B: Brand new code generated (no cloud record exists)
      // Start completely fresh so old device history doesn't bleed into the new code
      const fresh = emptyState();
      setState(fresh);
      saveState(fresh);

      if (!error && userId) {
        await supabase.from("gym_state").upsert({
          user_id: userId,
          data: fresh as never,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (cancelled) return;
    setSync(error ? "error" : "synced");
    setReady(true);
  })();

  return () => {
    cancelled = true;
  };
}, [userId]);

  // Push local changes (debounced) so every device stays in step.
  useEffect(() => {
    if (!ready) return;
    saveState(state);
    setSync("syncing");
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("gym_state")
        .upsert({ user_id: userId, data: state as never, updated_at: new Date().toISOString() });
      setSync(error ? "error" : "synced");
    }, 700);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [state, ready, userId]);

  const value = useMemo<Ctx>(
    () => ({
      state,
      ready,
      sync,
      addSet: ({ exerciseId, muscleId, weight, reps, ts, drop }) => {
        const entry: SetEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          exerciseId,
          muscleId,
          weight,
          reps,
          ts: ts ?? Date.now(),
          ...(drop ? { drop: true } : {}),
        };
        setState((s) => ({ ...s, sets: [...s.sets, entry] }));
      },
      removeSet: (id) => setState((s) => ({ ...s, sets: s.sets.filter((x) => x.id !== id) })),
      setSetDate: (id, ts) =>
        setState((s) => ({ ...s, sets: s.sets.map((x) => (x.id === id ? { ...x, ts } : x)) })),
      removeExercise: (id) =>
        setState((s) => ({
          ...s,
          exercises: s.exercises.filter((e) => e.id !== id),
          sets: s.sets.filter((x) => x.exerciseId !== id),
        })),
      setExerciseBodyweight: (id, bodyweight) =>
        setState((s) => ({
          ...s,
          exercises: s.exercises.map((e) => (e.id === id ? { ...e, bodyweight } : e)),
        })),
      addExercise: (muscleId, name, bodyweight) =>
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
              bodyweight: !!bodyweight,
            },
          ],
        })),
      setSchedule: (schedule) => setState((s) => ({ ...s, schedule })),
    }),
    [state, ready, sync],
  );

  return <GymContext.Provider value={value}>{children}</GymContext.Provider>;
}

export function useGym() {
  const ctx = useContext(GymContext);
  if (!ctx) throw new Error("useGym must be used inside GymProvider");
  return ctx;
}
