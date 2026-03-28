import { cn } from "@/lib/utils";

export function AnalysisAdCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-b from-blue-500/10 to-transparent p-8 text-center",
        className,
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-400/90">
        Partner
      </span>
      <p className="mt-3 max-w-xs text-sm font-medium text-slate-700 dark:text-zinc-200">
        Sharpen your profile with a certified career coach session.
      </p>
      <div className="mt-4 h-24 w-full max-w-[200px] rounded-xl bg-slate-100 dark:bg-white/5 ring-1 ring-slate-200 dark:ring-white/10" />
    </div>
  );
}
