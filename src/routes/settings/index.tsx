import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, ChevronRight, Copy, LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Screen } from "@/components/Screen";
import { useAccount } from "@/components/AuthGate";
import { useGym } from "@/lib/gym-store";
import { DAYS, groupedMuscleNames, haptic } from "@/lib/gym";
import { formatCode } from "@/lib/account";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Ascend" },
      {
        name: "description",
        content: "Manage your weekly split, account code, and cloud sync for Ascend.",
      },
      { property: "og:title", content: "Settings — Ascend" },
      { property: "og:description", content: "Weekly split, account code, and sync status." },
    ],
  }),
  component: SettingsScreen,
});

function SettingsScreen() {
  const { code, signOut } = useAccount();
  const { state, sync } = useGym();
  const [copied, setCopied] = useState(false);
  const today = new Date().getDay();
  const todayMuscles = state.schedule[today] ?? [];

  return (
    <Screen title="Settings" subtitle="Account, sync and your split">
      <section className="glass rounded-[26px] p-5">
        <h2 className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Account code</h2>
        <div className="tabnum mt-3 text-[22px] font-semibold tracking-[0.14em]">
          {code ? formatCode(code) : "Hidden on this device"}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Enter this code on another device to sync the same training history.
        </p>
        {code && (
          <button
            type="button"
            onClick={async () => {
              haptic();
              await navigator.clipboard?.writeText(code);
              setCopied(true);
            }}
            className="press glass-soft mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-medium active:scale-[0.98]"
          >
            <Copy className="size-4" strokeWidth={1.75} />
            {copied ? "Copied" : "Copy code"}
          </button>
        )}
      </section>

      <section className="glass mt-3 flex items-center justify-between rounded-[26px] px-5 py-4">
        <div>
          <div className="text-[15px] font-medium">Cloud sync</div>
          <p className="text-xs text-muted-foreground">
            {sync === "error" ? "Offline — changes stay on this device" : "Every set is saved to your account"}
          </p>
        </div>
        {sync === "syncing" ? (
          <RefreshCw className="size-4 animate-spin text-muted-foreground" strokeWidth={1.75} />
        ) : (
          <CheckCircle2
            className={`size-5 ${sync === "error" ? "text-destructive" : "text-muted-foreground"}`}
            strokeWidth={1.75}
          />
        )}
      </section>

      <h2 className="mb-3 mt-8 px-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        Training
      </h2>
      <Link
        to="/settings/split"
        onClick={() => haptic()}
        className="press glass glow-ring flex items-center justify-between gap-3 rounded-[26px] px-5 py-4 active:scale-[0.985]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <CalendarDays className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[15px] font-medium">Weekly split</div>
            <div className="truncate text-xs text-muted-foreground">
              {DAYS[today]}: {todayMuscles.length ? groupedMuscleNames(todayMuscles).join(" · ") : "Rest day"}
            </div>
          </div>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      </Link>

      <button
        type="button"
        onClick={async () => {
          haptic();
          await signOut();
        }}
        className="press glass-soft mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-medium text-destructive active:scale-[0.98]"
      >
        <LogOut className="size-4" strokeWidth={1.75} />
        Sign out
      </button>
      <p className="mt-3 px-1 text-center text-xs text-muted-foreground">
        Make sure your code is saved before signing out.
      </p>
    </Screen>
  );
}
