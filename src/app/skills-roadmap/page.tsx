import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SkillsRoadmapPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/90">
        Skill roadmap
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
        Coming soon
      </h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        Personalized upskilling paths for UAE competitive sets will plug in here.
      </p>
      <Button asChild variant="secondary">
        <Link href="/">Return home</Link>
      </Button>
    </div>
  );
}
