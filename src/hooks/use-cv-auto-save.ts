"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCvBuilderStore } from "@/stores/cv-builder-store";

export function useCvAutoSave(debounceMs = 900) {
  const blockIds = useCvBuilderStore((s) => s.blockIds);
  const blocks = useCvBuilderStore((s) => s.blocks);
  const layout = useCvBuilderStore((s) => s.layout);
  const stylePreset = useCvBuilderStore((s) => s.stylePreset);
  const rolePreset = useCvBuilderStore((s) => s.rolePreset);
  const compactSpacing = useCvBuilderStore((s) => s.compactSpacing);
  const documentId = useCvBuilderStore((s) => s.documentId);
  const setDocumentId = useCvBuilderStore((s) => s.setDocumentId);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const document = {
        documentId: documentId ?? undefined,
        blockIds,
        blocks,
        layout,
        stylePreset,
        rolePreset,
        compactSpacing,
      };
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("cv-document-id")
          : null;

      const id = stored ?? documentId ?? undefined;
      const url = id ? `/api/cv/${id}` : "/api/cv";
      const method = id ? "PUT" : "POST";

      void fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          id
            ? { document }
            : { document, name: "Master CV" },
        ),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as {
            documentId?: string;
            saved?: boolean;
          };
          if (data.documentId) {
            localStorage.setItem("cv-document-id", data.documentId);
            setDocumentId(data.documentId);
          }
          if (data.saved) {
            toast.success("CV saved to workspace", { duration: 1800 });
          }
        })
        .catch(() => {});
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [
    blockIds,
    blocks,
    layout,
    stylePreset,
    rolePreset,
    compactSpacing,
    documentId,
    setDocumentId,
    debounceMs,
  ]);
}
