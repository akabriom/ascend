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


      <div className="relative grid gap-3 pl-6">
        <div className="absolute bottom-3 left-[7px] top-3 w-px bg-gradient-to-b from-transparent via-foreground/25 to-transparent" />
        {session.exercises.map((e) => (
          <section key={e.id} className="glass glow-ring sheen relative rounded-[26px] p-5">
            <span className="absolute -left-[19px] top-7 size-[7px] rounded-full bg-foreground/70 shadow-[0_0_10px_2px_oklch(1_0_0/25%)]" />
            <div className="sheen-line" />
            <h2 className="text-base font-medium">{e.name}</h2>
            <ul className="mt-2 grid gap-1">
              {e.sets.map((set, i) => (
                <li key={set.id} className="tabnum flex justify-between text-[15px] text-muted-foreground">
                  <span>Set {i + 1}</span>
                  <span>{setLabel(e.bodyweight, set)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

    </Screen>
  );
}
