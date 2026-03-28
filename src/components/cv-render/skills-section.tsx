import type { SkillCategory } from "@/lib/cv-content";

export function SkillsSection({ categories }: { categories: SkillCategory[] }) {
  if (!categories.length) return null;
  return (
    <section className="mb-5">
      <h2 className="mb-2 border-b border-gray-300 pb-1 text-[11px] font-bold uppercase tracking-widest text-gray-500">
        Skills
      </h2>
      <div className="space-y-1.5">
        {categories.map((cat) => (
          <div key={cat.id} className="flex gap-2 text-[13px]">
            {cat.name && (
              <span className="shrink-0 font-semibold text-gray-700">{cat.name}:</span>
            )}
            <span className="text-gray-600">{cat.skills.join(", ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
