import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { haptic } from "@/lib/gym";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * One-tap date picker: a glass bottom sheet with a custom month grid.
 * Future days are disabled, today and the selected day are highlighted.
 */
export function CalendarSheet({
  open,
  value,
  title = "Pick a date",
  onClose,
  onSelect,
}: {
  open: boolean;
  value: number;
  title?: string;
  onClose: () => void;
  onSelect: (ts: number) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date(value));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setCursor(new Date(value));
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(false);
  }, [open, value]);

  const today = startOfDay(new Date());
  const selected = startOfDay(new Date(value));

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const lead = first.getDay();
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1)),
    ];
  }, [cursor]);

  if (!open) return null;

  const shift = (n: number) => {
    haptic();
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));
  };

  const nextMonthDisabled = startOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) > today;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close date picker"
        onClick={onClose}
        className={`absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`glass relative m-3 w-full max-w-md rounded-[28px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] transition-all duration-300 ease-out ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-foreground/20" />
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="press glass-soft grid size-9 shrink-0 place-items-center rounded-full active:scale-90"
          >
            <ChevronLeft className="size-4" strokeWidth={1.75} />
          </button>
          <div className="min-w-0 text-center">
            <div className="truncate text-[15px] font-semibold">
              {MONTH[cursor.getMonth()]} {cursor.getFullYear()}
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
          </div>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={nextMonthDisabled}
            aria-label="Next month"
            className="press glass-soft grid size-9 shrink-0 place-items-center rounded-full active:scale-90 disabled:opacity-30"
          >
            <ChevronRight className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {DOW.map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const ts = startOfDay(d);
            const future = ts > today;
            const isSel = ts === selected;
            return (
              <button
                key={ts}
                type="button"
                disabled={future}
                onClick={() => {
                  haptic(16);
                  onSelect(ts + 18 * 3600 * 1000);
                  onClose();
                }}
                className={`tabnum grid aspect-square place-items-center rounded-2xl text-sm transition-all duration-200 active:scale-90 disabled:opacity-20 ${
                  isSel
                    ? "bg-primary font-semibold text-primary-foreground"
                    : ts === today
                      ? "glass-soft font-medium"
                      : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => {
              haptic(16);
              onSelect(Date.now());
              onClose();
            }}
            className="press flex-1 rounded-2xl bg-secondary py-3 text-sm font-medium active:scale-95"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onClose}
            className="press glass-soft flex-1 rounded-2xl py-3 text-sm text-muted-foreground active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
