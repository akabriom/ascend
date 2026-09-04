import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Trash2, Trophy } from "lucide-react";
import { Screen } from "@/components/Screen";
import { CalendarSheet } from "@/components/CalendarSheet";
import {
  daysAgoLabel,
  exerciseHistory,
  exerciseMode,
  formatDuration,
  MODE_LABEL,
  formatDay,
  haptic,
  setLabel,
  stackSets,
  weekdayName,
  type ExerciseMode,
} from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/exercise/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Exercise History — Ascend" },
      {
        name: "description",
        content: "Past sets, weights and reps for this exercise, plus quick logging on any date.",
      },
      { property: "og:title", content: "Exercise History — Ascend" },
      { property: "og:description", content: "See last session's numbers before you lift." },
    ],
  }),
  component: ExerciseScreen,
});

const sameDay = (a: number, b: number) =>
  new Date(a).setHours(0, 0, 0, 0) === new Date(b).setHours(0, 0, 0, 0);

/** Keep the clock time of the original entry when only the day changes. */
const withDay = (dayTs: number, ts: number) => {
  const d = new Date(dayTs);
  const next = new Date(ts);
  next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
  return next.getTime();
};

function ExerciseScreen() {
  const { exerciseId } = Route.useParams();
  const { state, addSet, removeSet, setSetDate, setExerciseMode } = useGym();
  const exercise = state.exercises.find((e) => e.id === exerciseId);
  const groups = exerciseHistory(state.sets, exerciseId);
  const mine = state.sets.filter((s) => s.exerciseId === exerciseId);
  const bestWeight = mine.length ? Math.max(...mine.map((s) => s.weight)) : null;
  const bestReps = mine.length ? Math.max(...mine.map((s) => s.reps)) : null;
  const lastSet = groups[0]?.sets.at(-1);

  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");
  const [dropMode, setDropMode] = useState(false);
  const [logTs, setLogTs] = useState<number>(() => Date.now());
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!exercise) return <Screen title="Not found" back="/muscles">{null}</Screen>;

  const mode = exerciseMode(exercise);
  const timed = mode === "timed";
  const bw = !!exercise.bodyweight;
  const isToday = sameDay(logTs, Date.now());
  const editingSet = pickerFor && pickerFor !== "log" ? mine.find((s) => s.id === pickerFor) : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = bw || timed ? 0 : parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || r <= 0) return;
    const base = isToday ? Date.now() : logTs;
    addSet({
      exerciseId,
      muscleId: exercise.muscleId,
      weight: w,
      reps: r,
      ts: base,
      ...(dropMode ? { drop: true } : {}),
    });
    setReps("");
    if (bw) setWeight("");
    haptic(16);
  };


  return (
    <Screen
      title={exercise.name}
      back="/muscles"
      subtitle={lastSet ? `Beat ${setLabel(bw, lastSet, timed)}` : "No history yet"}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {(["weighted", "bodyweight", "timed"] as ExerciseMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              haptic();
              setExerciseMode(exercise.id, m);
            }}
            className={`press rounded-full px-4 py-2 text-xs font-medium transition-colors duration-200 active:scale-95 ${
              mode === m ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground"
            }`}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
        {bestWeight !== null && (
          <div className="glass-soft flex min-w-0 items-center gap-3 rounded-full px-4 py-2">
            <Trophy className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
            {timed ? (
              <span className="tabnum text-sm">Best {formatDuration(bestReps ?? 0)}</span>
            ) : (
              <>
                {!bw && <span className="tabnum text-sm">Best {bestWeight}kg</span>}
                <span className="tabnum text-sm text-muted-foreground">Best {bestReps} reps</span>
              </>
            )}
          </div>
        )}
      </div>

      {mounted &&
        createPortal(
        <form
          onSubmit={submit}
          className="pointer-events-auto fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-md px-4"
      >
        <div className="glass grid gap-2 rounded-3xl p-2">
          <div className="flex items-center gap-2">

            {!bw && !timed && (
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder={lastSet ? `${lastSet.weight} kg` : "kg"}
                aria-label="Weight in kg"
                className="tabnum w-full min-w-0 flex-1 rounded-2xl bg-secondary px-3 py-3 text-center text-base outline-none transition-shadow duration-200 placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
              />
            )}
            <input
              type="number"
              inputMode="numeric"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={
                timed
                  ? lastSet
                    ? `${lastSet.reps} sec`
                    : "seconds"
                  : lastSet
                    ? `${lastSet.reps} reps`
                    : "reps"
              }
              aria-label={timed ? "Duration in seconds" : "Reps"}
              className="tabnum w-full min-w-0 flex-1 rounded-2xl bg-secondary px-3 py-3 text-center text-base outline-none transition-shadow duration-200 placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                haptic();
                setPickerFor("log");
              }}
              aria-label="Change log date"
              className={`press flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-xs font-medium transition-colors duration-200 active:scale-95 ${
                isToday ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              <CalendarDays className="size-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{isToday ? "Today" : formatDay(logTs)}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                haptic();
                setDropMode((v) => !v);
              }}
              aria-label="Log as drop set"
              aria-pressed={dropMode}
              className={`press flex shrink-0 items-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-medium transition-colors duration-200 active:scale-95 ${
                dropMode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
            >
              Drop
            </button>

            <button
              type="submit"
              className="press flex-1 rounded-2xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground active:scale-95"
            >
              Log
            </button>
          </div>
        </div>
      </form>,
          document.body,
        )}

      <h2 className="mb-3 px-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">History</h2>
      {groups.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">Nothing logged yet. Your first set starts the memory.</p>
      )}
      <div className="grid gap-3 pb-36">
        {groups.map((g, gi) => (
          <div
            key={g.key}
            className="glass animate-fade-in rounded-3xl p-5"
            style={{ animationDelay: `${Math.min(gi, 6) * 40}ms`, animationFillMode: "backwards" }}
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="truncate text-base font-medium">{weekdayName(g.ts)}</span>
              <span className="tabnum shrink-0 text-xs text-muted-foreground">
                {daysAgoLabel(g.ts)} · {formatDay(g.ts)}
              </span>
            </div>
            <ul className="grid gap-2">
              {stackSets(g.sets).map(({ main: s, drops: ds }) => (
                <li key={s.id} className="grid gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="tabnum truncate text-[15px] text-muted-foreground">{setLabel(bw, s, timed)}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => {
                        haptic();
                        setPickerFor(s.id);
                      }}
                      className="press rounded-full p-1.5 text-muted-foreground/60 transition-colors duration-200 active:scale-90"
                      aria-label="Edit set date"
                    >
                      <CalendarDays className="size-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      onClick={() => {
                        haptic();
                        removeSet(s.id);
                      }}
                      className="press rounded-full p-1.5 text-muted-foreground/60 transition-colors duration-200 active:scale-90"
                      aria-label="Delete set"
                    >
                      <Trash2 className="size-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
                {ds.length > 0 && (
                  <ul className="grid gap-1 border-l border-foreground/10 pl-3">
                    {ds.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2">
                        <span className="tabnum truncate text-[13px] text-muted-foreground/70">
                          ↓ {setLabel(bw, d, timed)}
                        </span>
                        <button
                          onClick={() => {
                            haptic();
                            removeSet(d.id);
                          }}
                          className="press shrink-0 rounded-full p-1.5 text-muted-foreground/50 active:scale-90"
                          aria-label="Delete drop set"
                        >
                          <Trash2 className="size-3" strokeWidth={1.75} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <CalendarSheet
        open={pickerFor !== null}
        value={editingSet ? editingSet.ts : logTs}
        title={editingSet ? "Move this set" : "Log date"}
        onClose={() => setPickerFor(null)}
        onSelect={(ts) => {
          if (editingSet) setSetDate(editingSet.id, withDay(ts, editingSet.ts));
          else setLogTs(ts);
        }}
      />
    </Screen>
  );
}
