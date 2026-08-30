import { useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { haptic } from "@/lib/gym";

export function Screen({
  title,
  subtitle,
  back,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const goBack = () => {
    haptic();
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else if (back) router.navigate({ to: back });
  };

  return (
    <main className="page-enter mx-auto min-h-screen w-full max-w-md px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mb-6 flex items-start gap-3">
        {back && (
          <button
            type="button"
            onClick={goBack}
            className="press glass-soft mt-1 flex size-9 shrink-0 items-center justify-center rounded-full active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[28px] font-semibold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </main>
  );
}
