import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Screen } from "@/components/Screen";
import { daysAgoLabel, haptic, lastTrained, muscleName, rotatedExercises } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/muscles/$muscleId")({
  head: ({ params }) => {
    const name = muscleName(params.muscleId);
    return {
      meta: [
        { title: `${name} Exercises — Gym Memory` },
        {
          name: "description",
          content: `${name} exercises sorted so least recently used variations surface first.`,
        },
        { property: "og:title", content: `${name} Exercises — Gym Memory` },
        { property: "og:description", content: `Log and review your ${name.toLowerCase()} training.` },
      ],
    };
  },
  component: MuscleScreen,
});

function MuscleScreen() {
  const { muscleId } = Route.useParams();
  const { state, ready, addExercise } = useGym();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const rows = rotatedExercises(state, muscleId);
  const last = ready ? lastTrained(state.sets, muscleId) : null;

  return (
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
            addExercise(muscleId, name.trim());
            setName("");
            setAdding(false);
            haptic(12);
          }}
          className="glass mb-4 flex gap-2 rounded-3xl p-2"
        >
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
        </form>
      )}

      <p className="mb-3 px-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Least recently used first
      </p>
      <div className="grid gap-2.5">
        {rows.map(({ exercise, lastTs }) => (
          <Link
            key={exercise.id}
            to="/exercise/$exerciseId"
            params={{ exerciseId: exercise.id }}
            onClick={() => haptic()}
            className="press glass flex items-center justify-between rounded-3xl px-5 py-4 active:scale-[0.985]"
          >
            <div className="min-w-0">
              <div className="truncate text-base font-medium">{exercise.name}</div>
              <div className="text-xs text-muted-foreground">
                {lastTs ? daysAgoLabel(lastTs) : "Not used yet"}
              </div>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </Screen>
  );
}
