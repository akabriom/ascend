import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Trophy } from "lucide-react";
import { Screen } from "@/components/Screen";
import { daysAgoLabel, exerciseHistory, formatDay, haptic } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/exercise/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Exercise History — Gym Memory" },
      {
        name: "description",
        content: "Past sets, weights and reps for this exercise, plus one-tap logging of a new set.",
      },
      { property: "og:title", content: "Exercise History — Gym Memory" },
      { property: "og:description", content: "See last session's numbers before you lift." },
    ],
  }),
  component: ExerciseScreen,
});

function ExerciseScreen() {
  const { exerciseId } = Route.useParams();
  const { state, addSet, removeSet } = useGym();
  const exercise = state.exercises.find((e) => e.id === exerciseId);
  const groups = exerciseHistory(state.sets, exerciseId);
  const mine = state.sets.filter((s) => s.exerciseId === exerciseId);
  const bestWeight = mine.length ? Math.max(...mine.map((s) => s.weight)) : null;
  const bestReps = mine.length ? Math.max(...mine.map((s) => s.reps)) : null;
  const lastSet = groups[0]?.sets.at(-1);

  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");

  if (!exercise) return <Screen title="Not found" back="/muscles">{null}</Screen>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight || String(lastSet?.weight ?? ""));
    const r = parseInt(reps || String(lastSet?.reps ?? ""), 10);
    if (isNaN(w) || isNaN(r) || r <= 0) return;
    addSet({ exerciseId, muscleId: exercise.muscleId, weight: w, reps: r });
    setReps("");
    haptic(16);
  };

  return (
    <Screen title={exercise.name} back="/muscles" subtitle={lastSet ? `Beat ${lastSet.weight}kg × ${lastSet.reps}` : "No history yet"}>
      {bestWeight !== null && (
        <div className="glass-soft mb-6 flex items-center gap-4 rounded-3xl px-5 py-3">
          <Trophy className="size-4 text-muted-foreground" strokeWidth={1.75} />
          <span className="tabnum text-sm">Best {bestWeight}kg</span>
          <span className="tabnum text-sm text-muted-foreground">Best {bestReps} reps</span>
        </div>
      )}

      <form
        onSubmit={submit}
        className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md px-4"
      >
        <div className="glass flex items-center gap-2 rounded-3xl p-2">
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
            type="submit"
            className="press shrink-0 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground active:scale-95"
          >
            Log set
          </button>
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
                <li key={s.id} className="flex items-center justify-between">
                  <span className="tabnum text-[15px] text-muted-foreground">
                    {s.weight}kg × {s.reps}
                  </span>
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
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Screen>
  );
}
