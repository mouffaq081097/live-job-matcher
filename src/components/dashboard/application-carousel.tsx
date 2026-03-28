"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ApplicationStatus = "Interviewing" | "Applied" | "Screening" | "Offer";

export interface ApplicationCardItem {
  id: string;
  title: string;
  company: string;
  location: string;
  status: ApplicationStatus;
  atsScore?: number | null;
}

const statusStyles: Record<ApplicationStatus, string> = {
  Interviewing: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  Applied: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  Screening: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25",
  Offer: "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30",
};

function scoreColor(score: number) {
  if (score >= 75) return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  if (score >= 50) return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25";
  return "bg-red-500/15 text-red-300 ring-1 ring-red-500/30";
}

export function ApplicationCarousel({ items }: { items: ApplicationCardItem[] }) {
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateArrows() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateArrows();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [items]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 z-10 -translate-x-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120] shadow-lg transition hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 z-10 translate-x-3 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120] shadow-lg transition hover:bg-slate-100 dark:hover:bg-white/10"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-slate-600 dark:text-zinc-300" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="w-full overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-0 gap-4 snap-x snap-mandatory px-1">
          {items.map((app, i) => (
            <motion.div
              key={app.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.35 }}
              className="w-[min(280px,85vw)] shrink-0 snap-start"
            >
              <Card className="h-full border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.04]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-zinc-100 truncate">{app.title}</p>
                      <p className="text-sm text-zinc-500 truncate">{app.company}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        statusStyles[app.status],
                      )}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-zinc-500">{app.location}</p>
                    {app.atsScore != null && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          scoreColor(app.atsScore),
                        )}
                      >
                        {app.atsScore}% ATS
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
