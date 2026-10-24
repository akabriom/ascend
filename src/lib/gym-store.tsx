import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/components/AuthGate";
import {
  DEFAULT_EXERCISES,
  EMPTY_SCHEDULE,
  emptyState,
  loadState,
  sanitizeState,
  saveState,
  type GymState,
  modeFlags,
  type ExerciseMode,
  type Schedule,
  type SetEntry,
} from "./gym";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

type Ctx = {
  state: GymState;
  ready: boolean;
  /** True once the first cloud check for this account has finished. */
  bootstrapped: boolean;
  sync: SyncStatus;
  addSet: (input: { exerciseId: string; muscleId: string; weight: number; reps: number; ts?: number; drop?: boolean }) => void;
  removeSet: (id: string) => void;
  setSetDate: (id: string, ts: number) => void;
  addExercise: (muscleId: string, name: string, mode?: ExerciseMode) => void;
  removeExercise: (id: string) => void;
  setExerciseMode: (id: string, mode: ExerciseMode) => void;
  setSchedule: (schedule: Schedule) => void;
  confirmSplit: () => void;
};

const GymContext = createContext<Ctx | null>(null);

function normalize(raw: unknown): GymState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as Partial<GymState>;
  if (!Array.isArray(parsed.sets)) return null;
  return sanitizeState({
    sets: parsed.sets,
    exercises: parsed.exercises?.length ? parsed.exercises : DEFAULT_EXERCISES,
    schedule: { ...EMPTY_SCHEDULE, ...(parsed.schedule ?? {}) },
    splitChosen: parsed.splitChosen ?? true,
  });
}

/** Cloud copy wins, but keep sets/exercises logged locally while the fetch was in flight. */
function mergeStates(remote: GymState, local: GymState): GymState {
  const remoteExerciseIds = new Set(remote.exercises.map((e) => e.id));
  const remoteSetIds = new Set(remote.sets.map((s) => s.id));
  return sanitizeState({
    ...remote,
    sets: [...remote.sets, ...local.sets.filter((s) => !remoteSetIds.has(s.id))],
    exercises: [
      ...remote.exercises,
      ...local.exercises.filter((e) => !remoteExerciseIds.has(e.id)),
    ],
  });
}

export function GymProvider({ children }: { children: ReactNode }) {
  const { userId } = useAccount();
  // Local-first: paint the on-device snapshot synchronously, sync the cloud quietly.
  const [state, setState] = useState<GymState>(() => loadState(userId));
  const [ready] = useState(true);
  const [sync, setSync] = useState<SyncStatus>("syncing");
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const dirtyRef = useRef(false);
  const pulledRef = useRef(false);

  // First cloud check per account: its result is the source of truth. Runs in
  // the background — the screen is already showing the local snapshot.
  useEffect(() => {
    let cancelled = false;
    pulledRef.current = false;
    dirtyRef.current = false;
    setSync("syncing");

    (async () => {
      const { data, error } = await supabase
        .from("gym_state")
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;
      pulledRef.current = true;
      const remote = error ? null : normalize(data?.data);

      if (remote) {
        const merged = dirtyRef.current ? mergeStates(remote, stateRef.current) : remote;
        dirtyRef.current = false;
        setState(merged);
        saveState(merged, userId);
        setSync(error ? "error" : "synced");
      } else if (!error) {
        // Brand-new account: seed the cloud with the (empty) on-device copy so
        // a previous account's history on this device never bleeds in.
        await supabase.from("gym_state").upsert({
          user_id: userId,
          data: stateRef.current as never,
          updated_at: new Date().toISOString(),
        });
        dirtyRef.current = false;
        setSync("synced");
      } else {
        // Offline or failed check: keep serving the local snapshot.
        dirtyRef.current = false;
        setSync("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Push local changes (debounced) once the first cloud check has landed, so a
  // slow network can't clobber the cloud copy with a stale snapshot.
  useEffect(() => {
    if (!pulledRef.current) {
      dirtyRef.current = true;
      return;
    }
    saveState(state, userId);
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
  }, [state, userId]);

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
      setExerciseMode: (id, mode) =>
        setState((s) => ({
          ...s,
          exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...modeFlags(mode) } : e)),
        })),
      addExercise: (muscleId, name, mode) =>
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
              ...modeFlags(mode ?? "weighted"),
            },
          ],
        })),
      setSchedule: (schedule) => setState((s) => ({ ...s, schedule })),
      confirmSplit: () => setState((s) => ({ ...s, splitChosen: true })),
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
