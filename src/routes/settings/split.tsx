import { createFileRoute } from "@tanstack/react-router";
import { Screen } from "@/components/Screen";
import { DAYS, MUSCLES, haptic } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/settings/split")({
  head: () => ({
    meta: [
      { title: "Weekly Split — Gym Memory" },
      { name: "description", content: "Set which muscle groups you train on each day of the week." },
      { property: "og:title", content: "Weekly Split — Gym Memory" },
      { property: "og:description", content: "Configure your weekly training split once." },
    ],
  }),
  component: SplitScreen,
});

function SplitScreen() {
  const { state, setSchedule } = useGym();
  const today = new Date().getDay();

  const toggle = (day: number, muscleId: string) => {
    haptic();
    const current = state.schedule[day] ?? [];
    const next = current.includes(muscleId)
      ? current.filter((m) => m !== muscleId)
      : [...current, muscleId];
    setSchedule({ ...state.schedule, [day]: next });
  };

  return (
    <Screen title="Weekly split" subtitle="Tap to assign muscle groups" back="/settings">
      <div className="grid gap-3">
        {DAYS.map((day, i) => (
          <section key={day} className="glass rounded-3xl p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold">{day}</h2>
              {i === today && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Today
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {MUSCLES.map((m) => {
                const on = (state.schedule[i] ?? []).includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(i, m.id)}
                    className={`press rounded-full px-3 py-1.5 text-sm active:scale-95 ${
                      on
                        ? "bg-primary font-medium text-primary-foreground"
                        : "glass-soft text-muted-foreground"
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Screen>
  );
}
