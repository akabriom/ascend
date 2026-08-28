import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, Trash2, Trophy } from "lucide-react";
import { Screen } from "@/components/Screen";
import { daysAgoLabel, exerciseHistory, formatDay, haptic } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/exercise/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Exercise History — Gym Memory" },
      {
        name: "description",
        content: "Past sets, weights and reps for this exercise, plus quick logging on any date.",
      },
      { property: "og:title", content: "Exercise History — Gym Memory" },
      { property: "og:description", content: "See last session's numbers before you lift." },
    ],
  }),
  component: ExerciseScreen,
});

const toInputDate = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Keep the clock time of the original entry when only the day changes. */
const withDate = (value: string, ts: number) => {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return ts;
  const next = new Date(ts);
  next.setFullYear(y, m - 1, d);
  return next.getTime();
};

function ExerciseScreen() {
  const { exerciseId } = Route.useParams();
  const { state, addSet, removeSet, setSetDate, setExerciseBodyweight } = useGym();
  const exercise = state.exercises.find((e) => e.id === exerciseId);
  const groups = exerciseHistory(state.sets, exerciseId);
  const mine = state.sets.filter((s) => s.exerciseId === exerciseId);
  const bestWeight = mine.length ? Math.max(...mine.map((s) => s.weight)) : null;
  const bestReps = mine.length ? Math.max(...mine.map((s) => s.reps)) : null;
  const lastSet = groups[0]?.sets.at(-1);

  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [date, setDate] = useState<string>(() => toInputDate(Date.now()));
  const [showDate, setShowDate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  if (!exercise) return <Screen title="Not found" back="/muscles">{null}</Screen>;

  const bw = !!exercise.bodyweight;
  const today = toInputDate(Date.now());

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = bw ? 0 : parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || r <= 0) return;
    const ts = date === today ? Date.now() : withDate(date, new Date().setHours(18, 0, 0, 0));
    addSet({ exerciseId, muscleId: exercise.muscleId, weight: w, reps: r, ts });
    setReps("");
    if (bw) setWeight("");
    haptic(16);
  };

  return (
    <Screen
      title={exercise.name}
      back="/muscles"
      subtitle={
        lastSet ? `Beat ${bw ? `${lastSet.reps} reps` : `${lastSet.weight}kg × ${lastSet.reps}`}` : "No history yet"
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            haptic();
            setExerciseBodyweight(exercise.id, !bw);
          }}
          className={`press rounded-full px-4 py-2 text-xs font-medium active:scale-95 ${
            bw ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground"
          }`}
        >
          {bw ? "Bodyweight" : "Weighted"}
        </button>
        {bestWeight !== null && (
          <div className="glass-soft flex items-center gap-3 rounded-full px-4 py-2">
            <Trophy className="size-4 text-muted-foreground" strokeWidth={1.75} />
            {!bw && <span className="tabnum text-sm">Best {bestWeight}kg</span>}
            <span className="tabnum text-sm text-muted-foreground">Best {bestReps} reps</span>
          </div>
        )}
      </div>

      <form
        onSubmit={submit}
        className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md px-4"
      >
        <div className="glass grid gap-2 rounded-3xl p-2">
          <div className="flex items-center gap-2">
            {!bw && (
              <>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={lastSet ? `${lastSet.weight} kg` : "kg"}
                  aria-label="Weight in kg"
                  className="tabnum min-w-0 flex-1 rounded-2xl bg-secondary px-4 py-3 text-center text-base outline-none placeholder:text-muted-foreground"
                />
                <span className="text-sm text-muted-foreground">×</span>
              </>
            )}
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={lastSet ? `${lastSet.reps} reps` : "reps"}
              aria-label="Reps"
              className="tabnum min-w-0 flex-1 rounded-2xl bg-secondary px-4 py-3 text-center text-base outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              onClick={() => {
                haptic();
                setShowDate((v) => !v);
              }}
              aria-label="Change log date"
              className={`press shrink-0 rounded-2xl p-3 active:scale-95 ${
                date === today ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <CalendarDays className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="submit"
              className="press shrink-0 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground active:scale-95"
            >
              Log
            </button>
          </div>
          {showDate && (
            <div className="flex items-center gap-2 px-1 pb-1">
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                aria-label="Log date"
                className="tabnum flex-1 rounded-2xl bg-secondary px-4 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setDate(today)}
                className="press glass-soft rounded-full px-3 py-2 text-xs text-muted-foreground active:scale-95"
              >
                Today
              </button>
            </div>
          )}
        </div>
      </form>

      <h2 className="mb-3 px-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">History</h2>
      {groups.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">Nothing logged yet. Your first set starts the memory.</p>
      )}
      <div className="grid gap-3 pb-24">
        {groups.map((g) => (
          <div key={g.key} className="glass rounded-3xl p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-base font-medium">{formatDay(g.ts)}</span>
              <span className="text-xs text-muted-foreground">{daysAgoLabel(g.ts)}</span>
            </div>
            <ul className="grid gap-1">
              {g.sets.map((s) => (
                <li key={s.id} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <span className="tabnum text-[15px] text-muted-foreground">
                      {exercise.bodyweight ? `${s.reps} reps` : `${s.weight}kg × ${s.reps}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          haptic();
                          setEditing((id) => (id === s.id ? null : s.id));
                        }}
                        className="press rounded-full p-1.5 text-muted-foreground/60 active:scale-90"
                        aria-label="Edit set date"
                      >
                        <CalendarDays className="size-3.5" strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => {
                          haptic();
                          removeSet(s.id);
                        }}
                        className="press rounded-full p-1.5 text-muted-foreground/60 active:scale-90"
                        aria-label="Delete set"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                  {editing === s.id && (
                    <input
                      type="date"
                      value={toInputDate(s.ts)}
                      max={today}
                      onChange={(e) => setSetDate(s.id, withDate(e.target.value, s.ts))}
                      aria-label="Set date"
                      className="tabnum rounded-2xl bg-secondary px-4 py-2 text-sm outline-none"
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Screen>
  );
}
