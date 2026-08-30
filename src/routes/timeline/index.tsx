import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import {
  daysAgoLabel,
  formatDay,
  groupedMuscleNames,
  haptic,
  setLabel,
  timeline,
  weekdayName,
} from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/timeline/")({
  head: () => ({
    meta: [
      { title: "Training Timeline — Ascend" },
      { name: "description", content: "A chronological record of every session, exercise and set you logged." },
      { property: "og:title", content: "Training Timeline — Ascend" },
      { property: "og:description", content: "Your complete training memory, day by day." },
    ],
  }),
  component: TimelineScreen,
});

function TimelineScreen() {
  const { state } = useGym();
  const days = timeline(state);

  return (
    <Screen title="Timeline" subtitle="Everything you've trained">
      {days.length === 0 && (
        <p className="px-1 text-sm text-muted-foreground">No sessions logged yet.</p>
      )}
      <div className="relative pl-6">
        <div className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-transparent via-foreground/25 to-transparent" />
        <div className="grid gap-4">
          {days.map((d) => (
            <div key={d.key} className="relative">
              <span className="absolute -left-[19px] top-7 size-[7px] rounded-full bg-foreground/70 shadow-[0_0_10px_2px_oklch(1_0_0/25%)]" />
              <span className="absolute -left-[13px] top-[30px] h-px w-3 bg-foreground/25" />
              <Link
                to="/timeline/$day"
                params={{ day: d.key }}
                onClick={() => haptic()}
                className="press glass glow-ring sheen block overflow-hidden rounded-[26px] p-5 active:scale-[0.985]"
              >
                <div className="sheen-line" />
                <div className="flex items-baseline justify-between">
                  <h2 className="text-[17px] font-semibold">{weekdayName(d.ts)}</h2>
                  <span className="tabnum text-[11px] text-muted-foreground">
                    {formatDay(d.ts)} · {daysAgoLabel(d.ts)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {groupedMuscleNames(d.muscles).join(" · ")}
                </p>
                <div className="mt-4 grid gap-3">
                  {groupByMuscle(d.exercises).map((g) => (
                    <div key={g.label} className="fluid glass-soft rounded-2xl p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          {g.label}
                        </span>
                        <span className="hairline h-px flex-1" />
                      </div>
                      <div className="grid gap-2">
                        {g.items.map((e) => (
                          <div key={e.id}>
                            <div className="text-sm font-medium">{e.name}</div>
                            <div className="tabnum mt-0.5 text-sm text-muted-foreground">
                              {e.sets.map((s) => setLabel(e.bodyweight, s)).join("   ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
