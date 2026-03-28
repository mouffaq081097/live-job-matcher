import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { exportRecommendations } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ExportSuccessPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-400" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
          PDF exported
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-zinc-400">
          Your executive layout is ready. Below are partner picks that pair well
          with your next interview loop.
        </p>
        <Button asChild className="mt-6" variant="secondary">
          <Link href="/">Back to command center</Link>
        </Button>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recommended for you</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sponsored placements — certifications, courses, and gear.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {exportRecommendations.map((item) => (
            <Card
              key={item.id}
              className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] transition hover:border-slate-300 dark:hover:border-white/20"
            >
              <CardContent className="p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {item.kind === "cert" ? "Certification" : "Gear"}
                </span>
                <p className="mt-2 font-medium text-slate-800 dark:text-zinc-100">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
                <div className="mt-4 h-20 rounded-lg bg-gradient-to-br from-blue-500/10 to-emerald-500/5 ring-1 ring-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
