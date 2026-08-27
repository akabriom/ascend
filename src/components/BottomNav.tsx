import { Link } from "@tanstack/react-router";
import { Dumbbell, Home, Settings, Trophy } from "lucide-react";
import { haptic } from "@/lib/gym";

const items = [
  { to: "/", icon: Home },
  { to: "/muscles", icon: Dumbbell },
  { to: "/records", icon: Trophy },
  { to: "/settings", icon: Settings },
] as const;


export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-40 flex justify-center px-4">
      <div className="glass flex items-center gap-1 rounded-full px-2 py-1.5 shadow-lg">
        {items.map(({ to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => haptic()}
            activeOptions={{ exact: to === "/" }}
            className="press group flex items-center justify-center rounded-full p-2.5 text-muted-foreground active:scale-95 data-[status=active]:bg-secondary data-[status=active]:text-foreground"
            aria-label={to === "/" ? "Today" : to === "/muscles" ? "Muscles" : to === "/records" ? "PRs" : "Settings"}
          >
            <Icon className="size-[20px]" strokeWidth={1.75} />
          </Link>
        ))}
      </div>
    </nav>
  );
}
