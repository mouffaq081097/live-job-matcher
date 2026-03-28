import { CoverLetterGenerator } from "@/components/cover-letter/generator";

export const metadata = {
  title: "Cover Letter Generator — Live Job Match",
};

export default function CoverLetterPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-4xl">
          Smart Cover Letter Generator
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          Create highly personalized cover letters that match specific job descriptions using AI.
        </p>
      </div>
      <CoverLetterGenerator />
    </div>
  );
}
