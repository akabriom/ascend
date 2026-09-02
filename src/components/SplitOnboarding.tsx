import { Check, Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { DAYS, DEFAULT_SCHEDULE, MUSCLES, haptic } from "@/lib/gym";
import { useGym } from "@/lib/gym-store";

/** First-run gate: a brand-new account picks its own weekly split before entering the app. */
export function SplitGate({ children }: { children: ReactNode }) {
  const { state, ready } = useGym();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state.splitChosen === false) return <SplitOnboarding />;
  return <>{children}</>;
}

function SplitOnboarding() {
  const { state, setSchedule, confirmSplit } = useGym();
  const today = new Date().getDay();
  const any = Object.values(state.schedule).some((d) => d?.length);

  const toggle = (day: number, muscleId: string) => {
    haptic();
    const current = state.schedule[day] ?? [];
    setSchedule({
      ...state.schedule,
      [day]: current.includes(muscleId)
        ? current.filter((m) => m !== muscleId)
        : [...current, muscleId],
    });
  };

  return (
    <main className="page-enter mx-auto w-full max-w-md px-4 pb-36 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Ascend</p>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-tight">
          Build your split
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Pick the muscle groups you train each day. You can change this any time in Settings.
        </p>
        <button
          type="button"
          onClick={() => {
            haptic();
            setSchedule(DEFAULT_SCHEDULE);
          }}
          className="press glass-soft mt-4 rounded-full px-4 py-2 text-xs font-medium active:scale-[0.97]"
        >
          Use a suggested split
        </button>
      </header>

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
                    type="button"
                    onClick={() => toggle(i, m.id)}
                    className={`snap rounded-full px-3 py-1.5 text-sm ${
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

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] pt-6">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            disabled={!any}
            onClick={() => {
              haptic();
              confirmSplit();
            }}
            className="press liquid flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground active:scale-[0.98] disabled:opacity-50"
          >
            <Check className="size-4" strokeWidth={2} />
            {any ? "Start training" : "Pick at least one day"}
          </button>
        </div>
      </div>
    </main>
  );
}
