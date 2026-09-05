import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Screen } from "@/components/Screen";
import { MUSCLES, daysAgoLabel, haptic, lastTrained } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/muscles/")({
  head: () => ({
    meta: [
      { title: "Muscle Groups — Ascend" },
      { name: "description", content: "Browse every muscle group and see when you last trained it." },
      { property: "og:title", content: "Muscle Groups — Ascend" },
      { property: "og:description", content: "Every muscle group with its last trained date." },
    ],
  }),
  component: Muscles,
});

function Muscles() {
  const { state, ready } = useGym();
  return (
    <Screen title="Muscle groups" subtitle="Pick a group to log or review">
      <div className="grid gap-3">
        {MUSCLES.map((m, i) => {
          const last = ready ? lastTrained(state.sets, m.id) : null;
          const recent = ready ? lastLogged(state, m.id) : null;
          return (
            <Link
              key={m.id}
              to="/muscles/$muscleId"
              params={{ muscleId: m.id }}
              onClick={() => haptic()}
              className="rise press fluid glass flex items-center justify-between rounded-3xl px-5 py-4 active:scale-[0.985]"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="min-w-0">
                <div className="text-lg font-medium">{m.name}</div>
                <div className="tabnum truncate text-xs text-muted-foreground">
                  {recent
                    ? `${recent.exercise?.name ?? "Set"} · ${setLabel(
                        !!recent.exercise?.bodyweight,
                        recent.set,
                        !!recent.exercise?.timed,
                      )} · ${daysAgoLabel(recent.set.ts).toLowerCase()}`
                    : last
                      ? `Last trained ${daysAgoLabel(last).toLowerCase()}`
                      : "Never trained"}
                </div>
              </div>

              <ChevronRight className="size-5 text-muted-foreground" strokeWidth={1.75} />
            </Link>
          );
        })}
      </div>
    </Screen>
  );
}
