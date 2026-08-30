import { Link } from "@tanstack/react-router";
import { CalendarDays, Home, Settings, Target, Trophy } from "lucide-react";
import { haptic } from "@/lib/gym";

const items = [
  { to: "/", icon: Home, label: "Today" },
  { to: "/muscles", icon: Target, label: "Muscles" },
  { to: "/timeline", icon: CalendarDays, label: "Timeline" },
  { to: "/records", icon: Trophy, label: "PRs" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-40 flex justify-center px-4">
      <div className="glass flex items-center gap-0.5 rounded-full p-1.5 shadow-lg">
        {items.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            onClick={() => haptic()}
            activeOptions={{ exact: to === "/" }}
            aria-label={label}
            className="nav-pill group relative flex items-center justify-center overflow-hidden rounded-full px-2.5 py-2.5 text-muted-foreground data-[status=active]:bg-secondary data-[status=active]:text-foreground"
          >
            <Icon className="nav-icon size-[20px] shrink-0" strokeWidth={1.75} />
            <span className="nav-label whitespace-nowrap text-[13px] font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
