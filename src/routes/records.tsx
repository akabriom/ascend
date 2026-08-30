import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import { daysAgoLabel, groupByMuscle, personalRecords, setLabel, weekdayName } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/records")({
  head: () => ({
    meta: [
      { title: "Personal Records — Ascend" },
      { name: "description", content: "Automatically detected best weight and best reps for every exercise you log." },
      { property: "og:title", content: "Personal Records — Ascend" },
      { property: "og:description", content: "Your PRs, detected automatically from logged sets." },
    ],
  }),
  component: Records,
});

function Records() {
  const { state } = useGym();
  const groups = groupByMuscle(personalRecords(state));

  return (
    <Screen title="Personal records" subtitle="Detected automatically">
      {groups.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">Log a set to create your first PR.</p>
      )}
      <div className="grid gap-5">
        {groups.map((group, gi) => (
          <section
            key={group.label}
            className="rise fluid glass glow-ring sheen rounded-[30px] p-4"
            style={{ animationDelay: `${gi * 70}ms` }}
          >
            <div className="sheen-line" />
            <div className="mb-3 flex items-center gap-3 px-2 pt-1">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {group.label}
              </h2>
              <span className="hairline h-px flex-1" />
              <span className="tabnum text-[11px] text-muted-foreground">{group.items.length}</span>
            </div>
            <div className="grid gap-3">
              {group.items.map((pr, i) => (
                <article
                  key={pr.exerciseId}
                  className="rise press fluid glass-soft glow-ring rounded-3xl p-4 active:scale-[0.985]"
                  style={{ animationDelay: `${gi * 70 + i * 50}ms` }}
                >
                  <h3 className="truncate text-base font-medium">{pr.name}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="tabnum">
                      {weekdayName(pr.bestWeight.ts)} · {daysAgoLabel(pr.bestWeight.ts)}
                    </span>
                  </div>
                  <div className="fluid mt-3 flex items-baseline justify-between rounded-2xl bg-foreground/[0.04] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {pr.bodyweight ? "Best reps" : "Best weight"}
                    </div>
                    <div className="tabnum text-xl font-semibold">
                      {pr.bodyweight ? setLabel(true, pr.bestReps) : setLabel(false, pr.bestWeight)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Screen>
  );
}
