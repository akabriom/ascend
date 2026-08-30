import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useGym } from "@/lib/gym-store";
import {
  DAYS,
  daysAgoLabel,
  formatDay,
  groupedMuscleNames,
  haptic,
  lastTrained,
  muscleName,
  sessionSummary,
  timeline,
  weekdayName,
} from "@/lib/gym";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Training — Ascend" },
      {
        name: "description",
        content:
          "Your gym second brain: today's muscle groups, last session weights and reps, and personal records at a glance.",
      },
      { property: "og:title", content: "Today's Training — Ascend" },
      {
        property: "og:description",
        content: "See what to train today, what you lifted last time, and what to beat.",
      },
    ],
  }),
  component: Today,
});

function Today() {
  const { state, ready } = useGym();
  const dow = new Date().getDay();
  const todayMuscles = state.schedule[dow] ?? [];
  const recent = timeline(state).slice(0, 4);


  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {new Date().toLocaleDateString(undefined, { day: "numeric", month: "long" })}
      </p>

      <section className="glass glow sheen mt-3 overflow-hidden rounded-[30px] p-6">
        <div className="sheen-line" />
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Today</div>
        <h1 className="mt-3 text-[36px] font-semibold leading-none tracking-tight">{DAYS[dow]}</h1>
        <p className="mt-3 text-[17px] text-muted-foreground">
          {todayMuscles.length ? groupedMuscleNames(todayMuscles).join(" · ") : "Rest day"}
        </p>
      </section>


      {todayMuscles.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 px-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Today's muscle groups
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {todayMuscles.map((id) => {
              const last = ready ? lastTrained(state.sets, id) : null;
              return (
                <Link
                  key={id}
                  to="/muscles/$muscleId"
                  params={{ muscleId: id }}
                  onClick={() => haptic()}
                  className="press glass glow-ring sheen flex flex-col justify-between gap-4 overflow-hidden rounded-[26px] px-4 py-4 active:scale-[0.97]"
                >
                  <div className="sheen-line" />
                  <div className="text-[17px] font-medium leading-tight">{muscleName(id)}</div>
                  <div className="flex items-end justify-between gap-2">
                    <span className="tabnum text-[11px] text-muted-foreground">
                      {last ? daysAgoLabel(last) : "Never"}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" strokeWidth={1.75} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <h2 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Recent timeline
          </h2>
          <Link
            to="/timeline"
            onClick={() => haptic()}
            className="press inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground active:scale-95"
          >
            All <ChevronRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-1 text-sm text-muted-foreground">No sessions logged yet.</p>
        ) : (
          <div className="relative pl-6">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-transparent via-foreground/25 to-transparent" />
            <div className="grid gap-3">
              {recent.map((d) => {
                const s = sessionSummary(d);
                return (
                  <div key={d.key} className="relative">
                    <span className="absolute -left-[19px] top-6 size-[7px] rounded-full bg-foreground/70 shadow-[0_0_10px_2px_oklch(1_0_0/25%)]" />
                    <span className="absolute -left-[13px] top-[26px] h-px w-3 bg-foreground/25" />
                    <Link
                      to="/timeline/$day"
                      params={{ day: d.key }}
                      onClick={() => haptic()}
                      className="press glass glow-ring flex items-center justify-between gap-3 rounded-[24px] px-5 py-4 active:scale-[0.985]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[15px] font-medium">{weekdayName(d.ts)}</span>
                          <span className="tabnum text-[11px] text-muted-foreground">
                            {formatDay(d.ts)} · {daysAgoLabel(d.ts)}
                          </span>
                        </div>
                        <div className="truncate text-sm text-muted-foreground">
                          {groupedMuscleNames(d.muscles).join(" · ")}
                        </div>
                        <div className="tabnum mt-0.5 text-[11px] text-muted-foreground/75">
                          {s.exercises} exercises · {s.sets} sets
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
