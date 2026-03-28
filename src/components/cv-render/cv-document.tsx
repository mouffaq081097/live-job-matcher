import type { CvDocumentPayload } from "@/lib/cv-document";
import { ModernProfessional } from "./templates/modern-professional";
import { ClassicExecutive } from "./templates/classic-executive";
import { CreativeMinimalist } from "./templates/creative-minimalist";
import { AtsOptimized } from "./templates/ats-optimized";
import { HybridSidebar } from "./templates/hybrid-sidebar";

interface CvDocumentProps {
  payload: CvDocumentPayload;
  forPrint?: boolean;
}

export function CvDocument({ payload, forPrint = false }: CvDocumentProps) {
  const template = payload.template ?? "modern-professional";

  switch (template) {
    case "classic-executive":
      return <ClassicExecutive payload={payload} forPrint={forPrint} />;
    case "creative-minimalist":
      return <CreativeMinimalist payload={payload} forPrint={forPrint} />;
    case "ats-optimized":
      return <AtsOptimized payload={payload} forPrint={forPrint} />;
    case "hybrid-sidebar":
      return <HybridSidebar payload={payload} forPrint={forPrint} />;
    case "modern-professional":
    default:
      return <ModernProfessional payload={payload} forPrint={forPrint} />;
  }
}
