import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import { daysAgoLabel, muscleName, personalRecords, setLabel, weekdayName } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Personal Records — Gym Memory" },
      { name: "description", content: "Automatically detected best weight and best reps for every exercise you log." },
      { property: "og:title", content: "Personal Records — Gym Memory" },
      { property: "og:description", content: "Your PRs, detected automatically from logged sets." },
    ],
  }),
  component: Records,
});

function Records() {
  const { state } = useGym();
  const prs = personalRecords(state);

  return (
    <Screen title="Personal records" subtitle="Detected automatically">
      {prs.length === 0 && <p className="px-1 text-sm text-muted-foreground">Log a set to create your first PR.</p>}
      <div className="grid gap-3">
        {prs.map((pr) => (
          <div key={pr.exerciseId} className="glass rounded-3xl p-5">
            <h2 className="truncate text-base font-medium">{pr.name}</h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate">{muscleName(pr.muscleId)}</span>
              <span aria-hidden>·</span>
              <span className="tabnum shrink-0">
                {weekdayName(pr.bestWeight.ts)} · {daysAgoLabel(pr.bestWeight.ts)}
              </span>
            </div>
            <div className="glass-soft mt-4 rounded-2xl px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {pr.bodyweight ? "Best reps" : "Best weight"}
              </div>
              <div className="tabnum text-xl font-semibold">
                {pr.bodyweight ? setLabel(true, pr.bestReps) : setLabel(false, pr.bestWeight)}
              </div>
            </div>
          </div>

        ))}
      </div>
    </Screen>
  );
}
