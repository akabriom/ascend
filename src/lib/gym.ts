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

const ex = (muscleId: string, names: string[]): Exercise[] =>
  names.map((name) => ({
    id: `${muscleId}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    muscleId,
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

/** Sample history so the app looks alive before you log anything. */
export function demoSets(): SetEntry[] {
  const day = 86400000;
  const startOfToday = new Date().setHours(18, 30, 0, 0);
  const plan: { ago: number; items: [string, [number, number][]][] }[] = [
    { ago: 1, items: [
      ["chest-flat-bench-press", [[60, 10], [70, 8], [70, 7]]],
      ["chest-incline-bench-press", [[45, 10], [50, 8]]],
      ["triceps-triceps-pushdown", [[30, 12], [35, 10]]],
    ]},
    { ago: 2, items: [
      ["back-lat-pulldown", [[55, 10], [60, 9]]],
      ["back-barbell-row", [[60, 10], [65, 8]]],
      ["biceps-dumbbell-curl", [[14, 12], [16, 9]]],
    ]},
    { ago: 4, items: [
      ["quads-back-squat", [[80, 8], [90, 6], [90, 5]]],
      ["hamstrings-romanian-deadlift", [[70, 10], [75, 8]]],
      ["calves-standing-calf-raise", [[40, 15], [40, 14]]],
    ]},
    { ago: 6, items: [
      ["chest-dumbbell-press", [[26, 10], [28, 8]]],
      ["chest-cable-crossover", [[15, 14], [17, 12]]],
      ["chest-dips", [[0, 12], [0, 10]]],
      ["abs-hanging-leg-raise", [[0, 12], [0, 10]]],
    ]},
    { ago: 8, items: [
      ["shoulders-overhead-press", [[40, 8], [42, 7]]],
      ["shoulders-lateral-raise", [[10, 15], [12, 12]]],
      ["forearms-hammer-curl", [[14, 12]]],
    ]},
    { ago: 11, items: [
      ["chest-flat-bench-press", [[60, 9], [65, 8]]],
      ["chest-chest-fly", [[14, 12], [16, 10]]],
      ["triceps-skullcrusher", [[25, 10], [27, 8]]],
    ]},
  ];
  const out: SetEntry[] = [];
  for (const s of plan) {
    let i = 0;
    for (const [exerciseId, sets] of s.items) {
      const muscleId = exerciseId.split("-")[0]!;
      for (const [weight, reps] of sets) {
        out.push({
          id: `demo-${s.ago}-${i}`,
          exerciseId,
          muscleId,
          weight,
          reps,
          ts: startOfToday - s.ago * day + i * 240000,
        });
        i++;
      }
    }
  }
  return out;
}

export const demoState = (): GymState => ({ ...emptyState(), sets: demoSets() });

export function loadState(): GymState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return demoState();
    const parsed = JSON.parse(raw) as Partial<GymState>;
    return {
      sets: parsed.sets ?? [],
      exercises: parsed.exercises?.length ? parsed.exercises : DEFAULT_EXERCISES,
      schedule: { ...DEFAULT_SCHEDULE, ...(parsed.schedule ?? {}) },
    };
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

/**
 * Exercises ordered by training session, not by individual set:
 * every variation used in the same session sinks together, so the
 * variations you haven't touched in the longest surface first.
 */
export function rotatedExercises(state: GymState, muscleId: string) {
  const list = state.exercises.filter((e) => e.muscleId === muscleId);
  const lastDay = new Map<string, number>();
  for (const s of state.sets) {
    const dayStart = new Date(s.ts).setHours(0, 0, 0, 0);
    const prev = lastDay.get(s.exerciseId) ?? 0;
    if (dayStart > prev) lastDay.set(s.exerciseId, dayStart);
  }
  const lastUse = new Map<string, number>();
  for (const s of state.sets) {
    const prev = lastUse.get(s.exerciseId) ?? 0;
    if (s.ts > prev) lastUse.set(s.exerciseId, s.ts);
  }
  return list
    .map((e) => ({ exercise: e, lastTs: lastUse.get(e.id) ?? 0, lastDay: lastDay.get(e.id) ?? 0 }))
    .sort((a, b) => a.lastDay - b.lastDay || a.exercise.name.localeCompare(b.exercise.name));
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

export type PR = { exerciseId: string; name: string; muscleId: string; bestWeight: SetEntry; bestReps: SetEntry };

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
    prs.push({ exerciseId, name: meta.name, muscleId: meta.muscleId, bestWeight, bestReps });
  }
  return prs.sort((a, b) => b.bestWeight.ts - a.bestWeight.ts);
}

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
      exercises: [...new Set(sets.map((s) => s.exerciseId))].map((id) => ({
        id,
        name: state.exercises.find((e) => e.id === id)?.name ?? id,
        sets: sets.filter((s) => s.exerciseId === id).sort((a, b) => a.ts - b.ts),
      })),
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

export const weekdayName = (ts: number) => DAYS[new Date(ts).getDay()]!;
