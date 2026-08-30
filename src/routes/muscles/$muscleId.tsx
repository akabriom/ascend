import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { Screen } from "@/components/Screen";
import { daysAgoLabel, exercisesFor, haptic, lastTrained, muscleName } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/muscles/$muscleId")({
  head: ({ params }) => {
    const name = muscleName(params.muscleId);
    return {
      meta: [
        { title: `${name} Exercises — Ascend` },
        {
          name: "description",
          content: `${name} exercises with weighted or bodyweight tracking and full set history.`,
        },
        { property: "og:title", content: `${name} Exercises — Ascend` },
        { property: "og:description", content: `Log and review your ${name.toLowerCase()} training.` },
      ],
    };
  },
  component: MuscleScreen,
});

function MuscleScreen() {
  const { muscleId } = Route.useParams();
  const { state, ready, addExercise, removeExercise, setExerciseBodyweight } = useGym();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [bodyweight, setBodyweight] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const rows = exercisesFor(state, muscleId);
  const last = ready ? lastTrained(state.sets, muscleId) : null;

  return (
    <div className="page-transition">
      <Screen
        title={muscleName(muscleId)}
        subtitle={last ? `Last trained ${daysAgoLabel(last).toLowerCase()}` : "Never trained"}
        back="/muscles"
        action={
          <button
            onClick={() => {
              haptic();
              setAdding((v) => !v);
            }}
            className="press glass-soft mt-1 flex size-9 items-center justify-center rounded-full active:scale-95"
            aria-label="Add exercise"
          >
            <Plus className="size-5" strokeWidth={1.75} />
          </button>
        }
      >
        {adding && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              addExercise(muscleId, name.trim(), bodyweight);
              setName("");
              setBodyweight(false);
              setAdding(false);
              haptic(12);
            }}
            className="glass mb-4 grid gap-2 rounded-3xl p-2"
          >
            <div className="flex gap-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New exercise"
                className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground"
              />
              <button className="press rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground active:scale-95">
                Add
              </button>
            </div>
            <div className="flex gap-2 px-1 pb-1">
              {[false, true].map((bw) => (
                <button
                  key={String(bw)}
                  type="button"
                  onClick={() => {
                    haptic();
                    setBodyweight(bw);
                  }}
                  className={`press rounded-full px-3 py-1.5 text-xs font-medium active:scale-95 ${
                    bodyweight === bw ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground"
                  }`}
                >
                  {bw ? "Bodyweight" : "Weighted"}
                </button>
              ))}
            </div>
          </form>
        )}

        <div className="grid gap-2.5">
          {rows.map(({ exercise, lastTs }) => (
            <div key={exercise.id} className="glass flex items-center rounded-3xl pr-3">
              <Link
                to="/exercise/$exerciseId"
                params={{ exerciseId: exercise.id }}
                onClick={() => haptic()}
                className="press min-w-0 flex-1 px-5 py-4 active:scale-[0.985]"
              >
                <div className="truncate text-base font-medium">{exercise.name}</div>
                <div className="text-xs text-muted-foreground">
                  {lastTs ? daysAgoLabel(lastTs) : "Not used yet"}
                </div>
              </Link>

              <button
                type="button"
                onClick={() => {
                  haptic();
                  setExerciseBodyweight(exercise.id, !exercise.bodyweight);
                }}
                className={`press mr-1 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] active:scale-95 ${
                  exercise.bodyweight ? "bg-primary text-primary-foreground" : "glass-soft text-muted-foreground"
                }`}
                aria-label={`Mark ${exercise.name} as ${exercise.bodyweight ? "weighted" : "bodyweight"}`}
              >
                {exercise.bodyweight ? "BW" : "KG"}
              </button>

              {confirmId === exercise.id ? (
                <button
                  type="button"
                  onClick={() => {
                    haptic(16);
                    removeExercise(exercise.id);
                    setConfirmId(null);
                  }}
                  className="press shrink-0 rounded-full bg-destructive px-3 py-1 text-[11px] font-semibold text-destructive-foreground active:scale-95"
                >
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    haptic();
                    setConfirmId(exercise.id);
                  }}
                  className="press shrink-0 rounded-full p-1.5 text-muted-foreground/70 active:scale-90"
                  aria-label={`Delete ${exercise.name}`}
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              )}

              <ChevronRight className="ml-1 size-4 shrink-0 text-muted-foreground/50" strokeWidth={1.75} />
            </div>
          ))}
        </div>
      </Screen>
    </div>
  );
}
