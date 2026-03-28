import type { ProfileContent } from "@/lib/cv-content";

export function ProfileSection({ data }: { data: ProfileContent }) {
  const hasContact =
    data.email || data.phone || data.location || data.linkedin || data.website;

  return (
    <header className="mb-5">
      {data.fullName && (
        <h1 className="text-[26px] font-bold leading-tight tracking-tight text-gray-900">
          {data.fullName}
        </h1>
      )}
      {data.jobTitle && (
        <p className="mt-0.5 text-base font-medium text-gray-600">{data.jobTitle}</p>
      )}
      {hasContact && (
        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-gray-500">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
          {data.linkedin && (
            <span className="print:underline">{data.linkedin}</span>
          )}
          {data.website && (
            <span className="print:underline">{data.website}</span>
          )}
        </p>
      )}
      {data.summary && (
        <p className="mt-3 text-[13px] leading-relaxed text-gray-700">
          {data.summary}
        </p>
      )}
    </header>
  );
}
