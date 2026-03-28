import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cvDocumentSchema } from "@/lib/cv-document";
import { CvDocument } from "@/components/cv-render/cv-document";
import { PrintButton } from "@/components/cv-render/print-button";

export default async function CvPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return notFound();

  const { id } = await params;
  const row = await prisma.cvDocument.findFirst({
    where: { id, userId: session.user.id },
    select: { name: true, payload: true, updatedAt: true },
  });
  if (!row) return notFound();

  const parsed = cvDocumentSchema.safeParse(row.payload);
  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-3xl bg-white p-10 text-black">
        <h1 className="text-xl font-bold text-red-600">CV data error</h1>
        <p className="mt-2 text-sm text-gray-500">
          The stored CV data could not be parsed. Please open the CV builder and
          re-save the document.
        </p>
      </div>
    );
  }

  const isHybridSidebar = parsed.data.template === "hybrid-sidebar";

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style>{`
        @page { size: A4; margin: 15mm 15mm; }
        @media print {
          body { background: white !important; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print flex items-center justify-between bg-white px-6 py-3 shadow-sm print:hidden">
        <p className="text-sm font-medium text-gray-700">{row.name}</p>
        <PrintButton />
      </div>

      {isHybridSidebar && (
        <div className="no-print mx-auto max-w-[760px] mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 print:hidden">
          <span className="font-semibold">⚠ ATS Warning:</span> This template uses a sidebar layout. Automated applicant tracking systems (ATS) may misread the column order. Consider switching to the{" "}
          <span className="font-semibold">ATS-Optimized</span> template for automated screening submissions.
        </div>
      )}

      <div className="mx-auto max-w-[760px] py-6 print:py-0">
        <CvDocument payload={parsed.data} forPrint />
      </div>
    </div>
  );
}
