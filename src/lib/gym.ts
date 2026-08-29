export type SetEntry = {
  id: string;
  exerciseId: string;
  muscleId: string;
  weight: number;
  reps: number;
  ts: number; // epoch ms
};

export type Exercise = {
  id: string;
  name: string;
  muscleId: string;
  custom?: boolean;
  /** Bodyweight movements log reps only, no load. */
  bodyweight?: boolean;
};

export type Muscle = { id: string; name: string };

export const MUSCLES: Muscle[] = [
  { id: "chest", name: "Chest" },
  { id: "back", name: "Back" },
  { id: "shoulders", name: "Shoulders" },
  { id: "biceps", name: "Biceps" },
  { id: "triceps", name: "Triceps" },
  { id: "forearms", name: "Forearms" },
  { id: "abs", name: "Abs" },
  { id: "quads", name: "Quads" },
  { id: "hamstrings", name: "Hamstrings" },
  { id: "calves", name: "Calves" },
];

const BODYWEIGHT_DEFAULTS = new Set([
  "Pushups",
  "Dips",
  "Pull Ups",
  "Bench Dips",
  "Hanging Leg Raise",
  "Plank",
  "Ab Wheel",
  "Crunches",
  "Russian Twist",
  "Nordic Curl",
]);

const ex = (muscleId: string, names: string[]): Exercise[] =>
  names.map((name) => ({
    id: `${muscleId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    muscleId,
    ...(BODYWEIGHT_DEFAULTS.has(name) ? { bodyweight: true } : {}),
  }));

export const DEFAULT_EXERCISES: Exercise[] = [
  ...ex("chest", ["Flat Bench Press", "Incline Bench Press", "Dumbbell Press", "Chest Fly", "Cable Crossover", "Pushups", "Dips"]),
  ...ex("back", ["Lat Pulldown", "Pull Ups", "Barbell Row", "Seated Cable Row", "Dumbbell Row", "Deadlift", "Straight Arm Pulldown"]),
  ...ex("shoulders", ["Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Rear Delt Fly", "Front Raise", "Upright Row", "Face Pull"]),
  ...ex("biceps", ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Incline Curl", "Cable Curl"]),
  ...ex("triceps", ["Triceps Pushdown", "Overhead Extension", "Skullcrusher", "Close Grip Bench", "Bench Dips", "Rope Kickback"]),
  ...ex("forearms", ["Wrist Curl", "Reverse Wrist Curl", "Reverse Curl", "Farmer Carry"]),
  ...ex("abs", ["Hanging Leg Raise", "Cable Crunch", "Plank", "Russian Twist", "Ab Wheel", "Crunches"]),
  ...ex("quads", ["Back Squat", "Front Squat", "Leg Press", "Leg Extension", "Bulgarian Split Squat", "Walking Lunge"]),
  ...ex("hamstrings", ["Romanian Deadlift", "Leg Curl", "Good Morning", "Nordic Curl", "Hip Thrust"]),
  ...ex("calves", ["Standing Calf Raise", "Seated Calf Raise", "Leg Press Calf Raise"]),
];

export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type Schedule = Record<number, string[]>; // 0-6 -> muscle ids

export const DEFAULT_SCHEDULE: Schedule = {
  0: [],
  1: ["chest", "triceps", "abs"],
  2: ["back", "biceps"],
  3: ["quads", "hamstrings", "calves"],
  4: ["shoulders", "forearms", "abs"],
  5: ["chest", "back"],
  6: [],
};

export type GymState = {
  sets: SetEntry[];
  exercises: Exercise[];
  schedule: Schedule;
};

const KEY = "gym-memory-v2";

export const emptyState = (): GymState => ({
  sets: [],
  exercises: DEFAULT_EXERCISES,
  schedule: DEFAULT_SCHEDULE,
});

/** Drop legacy demo rows and sets pointing at exercises that no longer exist. */
export function sanitizeState(state: GymState): GymState {
  const ids = new Set(state.exercises.map((e) => e.id));
  return {
    ...state,
    sets: state.sets.filter((s) => !s.id.startsWith("demo-") && ids.has(s.exerciseId)),
  };
}

export function loadState(): GymState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<GymState>;
    return sanitizeState({
      sets: parsed.sets ?? [],
      exercises: parsed.exercises?.length ? parsed.exercises : DEFAULT_EXERCISES,
      schedule: { ...DEFAULT_SCHEDULE, ...(parsed.schedule ?? {}) },
    });
  } catch {
    return emptyState();
  }
}


export function saveState(state: GymState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export const muscleName = (id: string) => MUSCLES.find((m) => m.id === id)?.name ?? id;

export function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function formatDay(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function daysAgoLabel(ts: number) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  const startDiff = Math.round(
    (new Date().setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000,
  );
  if (startDiff <= 0) return "Today";
  if (startDiff === 1) return "Yesterday";
  return `${Math.max(days, startDiff)} days ago`;
}

export function haptic(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(ms);
}

export function lastTrained(sets: SetEntry[], muscleId: string): number | null {
  let last: number | null = null;
  for (const s of sets) if (s.muscleId === muscleId && (last === null || s.ts > last)) last = s.ts;
  return last;
}

/** Exercises for a muscle group, alphabetical, with their last-used timestamp. */
export function exercisesFor(state: GymState, muscleId: string) {
  const lastUse = new Map<string, number>();
  for (const s of state.sets) {
    const prev = lastUse.get(s.exerciseId) ?? 0;
    if (s.ts > prev) lastUse.set(s.exerciseId, s.ts);
  }
  return state.exercises
    .filter((e) => e.muscleId === muscleId)
    .map((e) => ({ exercise: e, lastTs: lastUse.get(e.id) ?? 0 }))
    .sort((a, b) => a.exercise.name.localeCompare(b.exercise.name));
}

export function exerciseHistory(sets: SetEntry[], exerciseId: string) {
  const rows = sets.filter((s) => s.exerciseId === exerciseId).sort((a, b) => b.ts - a.ts);
  const groups: { key: string; ts: number; sets: SetEntry[] }[] = [];
  for (const s of rows) {
    const k = dayKey(s.ts);
    let g = groups.find((x) => x.key === k);
    if (!g) {
      g = { key: k, ts: s.ts, sets: [] };
      groups.push(g);
    }
    g.sets.push(s);
  }
  for (const g of groups) g.sets.sort((a, b) => a.ts - b.ts);
  return groups;
}

export type PR = { exerciseId: string; name: string; muscleId: string; bodyweight: boolean; bestWeight: SetEntry; bestReps: SetEntry };

export function personalRecords(state: GymState): PR[] {
  const byEx = new Map<string, SetEntry[]>();
  for (const s of state.sets) {
    const arr = byEx.get(s.exerciseId) ?? [];
    arr.push(s);
    byEx.set(s.exerciseId, arr);
  }
  const prs: PR[] = [];
  for (const [exerciseId, arr] of byEx) {
    const meta = state.exercises.find((e) => e.id === exerciseId);
    if (!meta) continue;
    const bestWeight = arr.reduce((a, b) => (b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a));
    const bestReps = arr.reduce((a, b) => (b.reps > a.reps ? b : a));
    prs.push({ exerciseId, name: meta.name, muscleId: meta.muscleId, bodyweight: !!meta.bodyweight, bestWeight, bestReps });
  }
  return prs.sort((a, b) => b.bestWeight.ts - a.bestWeight.ts);
}

/** One line of set text, aware of bodyweight movements. */
export const setLabel = (bodyweight: boolean | undefined, s: SetEntry) =>
  bodyweight ? `${s.reps} reps` : `${s.weight}kg × ${s.reps}`;

export function timeline(state: GymState) {
  const days = new Map<string, SetEntry[]>();
  for (const s of state.sets) {
    const k = dayKey(s.ts);
    days.set(k, [...(days.get(k) ?? []), s]);
  }
  return [...days.entries()]
    .map(([key, sets]) => ({
      key,
      ts: Math.max(...sets.map((s) => s.ts)),
      muscles: [...new Set(sets.map((s) => s.muscleId))],
      exercises: [...new Set(sets.map((s) => s.exerciseId))].map((id) => {
        const meta = state.exercises.find((e) => e.id === id);
        return {
          id,
          name: meta?.name ?? id,
          muscleId: meta?.muscleId ?? sets.find((s) => s.exerciseId === id)?.muscleId ?? "",
          bodyweight: !!meta?.bodyweight,
          sets: sets.filter((s) => s.exerciseId === id).sort((a, b) => a.ts - b.ts),
        };
      }),
    }))
    .sort((a, b) => b.ts - a.ts);

}

export type TimelineDay = ReturnType<typeof timeline>[number];

export function sessionSummary(day: TimelineDay) {
  const sets = day.exercises.reduce((n, e) => n + e.sets.length, 0);
  const volume = day.exercises.reduce(
    (v, e) => v + e.sets.reduce((x, s) => x + s.weight * s.reps, 0),
    0,
  );
  const top = day.exercises
    .map((e) => ({ name: e.name, best: Math.max(...e.sets.map((s) => s.weight)) }))
    .sort((a, b) => b.best - a.best)[0];
  return { sets, volume, exercises: day.exercises.length, top };
}

export function sessionByKey(state: GymState, key: string) {
  return timeline(state).find((d) => d.key === key) ?? null;
}

/** Sub-groups that are logged separately but read as one group in the timeline. */
const GROUP_ALIAS: Record<string, string> = {
  quads: "Legs",
  hamstrings: "Legs",
  calves: "Legs",
};

/** Muscle labels for timeline display: leg sub-groups collapse into "Legs". */
export function groupedMuscleNames(ids: string[]): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const label = GROUP_ALIAS[id] ?? muscleName(id);
    if (!out.includes(label)) out.push(label);
  }
  return out;
}

/** Display label for one muscle id, with leg sub-groups collapsed. */
export const groupLabel = (id: string) => GROUP_ALIAS[id] ?? muscleName(id);

/** Group any muscle-tagged items under their display group, preserving order. */
export function groupByMuscle<T extends { muscleId: string }>(items: T[]) {
  const groups: { label: string; items: T[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.muscleId);
    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }
  return groups;
}


export const weekdayName = (ts: number) => DAYS[new Date(ts).getDay()]!;
