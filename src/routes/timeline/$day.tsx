import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Dumbbell, Flame, Trophy } from "lucide-react";
import { Screen } from "@/components/Screen";
import {
  formatDay,
  groupedMuscleNames,
  sessionByKey,
  sessionSummary,
  setLabel,
  weekdayName,
} from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/timeline/$day")({
  head: () => ({
    meta: [
      { title: "Session Details — Ascend" },
      {
        name: "description",
        content: "Detailed breakdown of exercises, total sets, and volume for this workout session.",
      },
      { property: "og:title", content: "Session Details — Ascend" },
      { property: "og:description", content: "Detailed breakdown of your completed workout session." },
    ],
  }),
  component: TimelineDayScreen,
});

function TimelineDayScreen() {
  const { day } = Route.useParams();
  const { state } = useGym();
  const session = sessionByKey(state, day);

  if (!session) {
    return (
      <Screen title="Session Not Found" back="/timeline">
        <div className="glass flex flex-col items-center justify-center rounded-3xl p-8 text-center">
          <Calendar className="mb-3 size-10 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            No workout data was logged for this date.
          </p>
          <Link
            to="/timeline"
            className="press mt-4 rounded-2xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
          >
            Back to Timeline
          </Link>
        </div>
      </Screen>
    );
  }

  const summary = sessionSummary(session);
  const muscleGroups = groupedMuscleNames(session.muscles);

  return (
    <Screen
      title={`${weekdayName(session.ts)}, ${formatDay(session.ts)}`}
      back="/timeline"
      subtitle={muscleGroups.join(" · ")}
    >
      {/* Session Overview Stats */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Exercises
          </span>
          <span className="tabnum text-lg font-semibold">{summary.exercises}</span>
        </div>
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Total Sets
          </span>
          <span className="tabnum text-lg font-semibold">{summary.sets}</span>
        </div>
        <div className="glass flex flex-col items-center justify-center rounded-2xl p-3 text-center">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Volume
          </span>
          <span className="tabnum text-lg font-semibold">
            {summary.volume > 0 ? `${summary.volume}kg` : "BW"}
          </span>
        </div>
      </div>

      {/* Top Lift Highlight */}
      {summary.top && summary.top.best > 0 && (
        <div className="glass mb-6 flex items-center justify-between rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Trophy className="size-4 text-amber-500" strokeWidth={2} />
            <span className="text-xs font-medium text-muted-foreground">Heavy Set</span>
          </div>
          <span className="tabnum text-xs font-semibold">
            {summary.top.name} @ {summary.top.best}kg
          </span>
        </div>
      )}

      {/* Exercise List Breakdown */}
      <h2 className="mb-3 px-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Exercises Logged
      </h2>

      <div className="grid gap-3 pb-12">
        {session.exercises.map((e, index) => (
          <div
            key={e.id}
            className="glass animate-fade-in rounded-3xl p-5"
            style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
          >
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/40 pb-2.5">
              <Link
                to="/exercise/$exerciseId"
                params={{ exerciseId: e.id }}
                className="flex items-center gap-2 font-medium hover:underline"
              >
                <Dumbbell className="size-4 text-muted-foreground" strokeWidth={1.75} />
                <span>{e.name}</span>
              </Link>
              <span className="tabnum text-xs text-muted-foreground">
                {e.sets.length} {e.sets.length === 1 ? "set" : "sets"}
              </span>
            </div>

            <ul className="grid gap-2">
              {e.sets.map((set, si) => (
                <li
                  key={set.id}
                  className="tabnum flex items-center justify-between text-[15px] text-muted-foreground"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/70">Set {si + 1}</span>
                    {set.drop && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                        <Flame className="size-3" strokeWidth={2} />
                        Drop
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {setLabel(e.bodyweight, set)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Screen>
  );
}
