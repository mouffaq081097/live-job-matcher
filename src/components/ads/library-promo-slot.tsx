import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function LibraryPromoSlot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-blue-500/20 bg-blue-500/5 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-blue-400">
        <Sparkles className="h-4 w-4" />
        <span className="text-xs font-semibold">Premium font pack</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
        Unlock executive typefaces tuned for ATS-friendly PDF export.
      </p>
    </div>
  );
}
