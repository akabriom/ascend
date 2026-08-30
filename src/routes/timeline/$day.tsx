import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import {
  daysAgoLabel,
  formatDay,
  groupedMuscleNames,
  sessionByKey,
  setLabel,
  sessionSummary,
  weekdayName,
} from "@/lib/gym";
import { useGym } from "@/lib/gym-store";


export const Route = createFileRoute("/timeline/$day")({
  head: () => ({
    meta: [
      { title: "Session Detail — Ascend" },
      {
        name: "description",
        content: "Every exercise, weight and rep you logged in this training session.",
      },
      { property: "og:title", content: "Session Detail — Ascend" },
      { property: "og:description", content: "A full breakdown of one training day." },
    ],
  }),
  component: SessionScreen,
});

function SessionScreen() {
  const { day } = Route.useParams();
  const { state } = useGym();
  const session = sessionByKey(state, day);

  if (!session) {
    return (
      <Screen title="Session not found" back="/timeline">
        <p className="px-1 text-sm text-muted-foreground">Nothing was logged on this day.</p>
      </Screen>
    );
  }

  const s = sessionSummary(session);

  return (
    <Screen
      title={`${weekdayName(session.ts)}, ${formatDay(session.ts)}`}
      subtitle={`${daysAgoLabel(session.ts)} · ${groupedMuscleNames(session.muscles).join(" · ")}`}
      back="/timeline"
    >
      <div className="glass glow-ring mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-[26px]">
        {[
          ["Exercises", String(s.exercises)],
          ["Sets", String(s.sets)],
        ].map(([label, value]) => (
          <div key={label} className="px-5 py-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {label}
            </div>
            <div className="tabnum mt-0.5 text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>


      <div className="grid gap-5">
        {groupByMuscle(session.exercises).map((g, gi) => (
          <section
            key={g.label}
            className="rise fluid glass glow-ring sheen rounded-[30px] p-4"
            style={{ animationDelay: `${gi * 70}ms` }}
          >
            <div className="sheen-line" />
            <div className="mb-3 flex items-center gap-3 px-2 pt-1">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {g.label}
              </h2>
              <span className="hairline h-px flex-1" />
              <span className="tabnum text-[11px] text-muted-foreground">{g.items.length}</span>
            </div>
            <div className="grid gap-3">
              {g.items.map((e, i) => (
                <article
                  key={e.id}
                  className="rise press fluid glass-soft glow-ring rounded-3xl p-4"
                  style={{ animationDelay: `${gi * 70 + i * 50}ms` }}
                >
                  <h3 className="text-base font-medium">{e.name}</h3>
                  <ul className="mt-2 grid gap-1">
                    {e.sets.map((set, si) => (
                      <li
                        key={set.id}
                        className="tabnum flex justify-between text-[15px] text-muted-foreground"
                      >
                        <span>Set {si + 1}</span>
                        <span>{setLabel(e.bodyweight, set)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

    </Screen>
  );
}
