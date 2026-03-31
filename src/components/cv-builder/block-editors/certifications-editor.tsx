"use client";

import { useCvBuilderStore } from "@/stores/cv-builder-store";
import { newEntryId, type CertificationEntry } from "@/lib/cv-content";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

function newEntry(): CertificationEntry {
  return { id: newEntryId(), name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "" };
}

export function CertificationsEditor({ blockId }: { blockId: string }) {
  const block = useCvBuilderStore((s) => s.blocks[blockId]);
  const updateBlockContent = useCvBuilderStore((s) => s.updateBlockContent);

  if (!block || block.content?.type !== "certifications") return null;
  const entries = block.content.data;

  function setEntries(next: CertificationEntry[]) {
    updateBlockContent(blockId, { type: "certifications", data: next });
  }
  function updateEntry(id: string, patch: Partial<CertificationEntry>) {
    setEntries(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeEntry(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
  }

  return (
    <div className="mt-3 space-y-4 border-t border-slate-200 dark:border-white/10 pt-3">
      {entries.map((entry, ei) => (
        <div key={entry.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Entry {ei + 1}</span>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={() => removeEntry(entry.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Certification name</p>
              <Input className="mt-1 h-8 text-sm" value={entry.name} onChange={(e) => updateEntry(entry.id, { name: e.target.value })} placeholder="AWS Solutions Architect" />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Issuing organisation</p>
              <Input className="mt-1 h-8 text-sm" value={entry.issuer} onChange={(e) => updateEntry(entry.id, { issuer: e.target.value })} placeholder="Amazon Web Services" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Issue date</p>
              <Input className="mt-1 h-8 text-sm" value={entry.issueDate} onChange={(e) => updateEntry(entry.id, { issueDate: e.target.value })} placeholder="2023" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Expiry date (optional)</p>
              <Input className="mt-1 h-8 text-sm" value={entry.expiryDate} onChange={(e) => updateEntry(entry.id, { expiryDate: e.target.value })} placeholder="2026" />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 dark:text-zinc-400">Credential ID (optional)</p>
              <Input className="mt-1 h-8 text-sm" value={entry.credentialId} onChange={(e) => updateEntry(entry.id, { credentialId: e.target.value })} placeholder="ABC-123456" />
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setEntries([...entries, newEntry()])}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add certification
      </Button>
    </div>
  );
}
