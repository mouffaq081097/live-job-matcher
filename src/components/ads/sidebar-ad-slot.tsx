import { cn } from "@/lib/utils";

export function SidebarAdSlot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mt-auto rounded-xl border border-dashed border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/[0.02] p-4 text-center",
        className,
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        Sponsored
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
        Premium templates for UAE executive roles.
      </p>
      <div className="mt-3 h-16 rounded-lg bg-gradient-to-br from-blue-500/20 to-emerald-500/10" />
    </div>
  );
}
