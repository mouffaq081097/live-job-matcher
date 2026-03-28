import { CvBuilderWorkspace } from "@/components/cv-builder/cv-builder-workspace";

export default function CvBuilderPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400/90">
          CV Builder
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
          Drag-and-drop sections
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-zinc-400">
          Pull blocks from the parts store, reorder for your target role, and watch
          the ATS estimate react to layout and visibility.
        </p>
      </div>
      <CvBuilderWorkspace />
    </div>
  );
}
