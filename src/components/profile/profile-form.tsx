"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import {
  newEntryId,
  type EducationEntry,
  type CertificationEntry,
  type ExperienceEntry,
  type SkillCategory,
} from "@/lib/cv-content";

function newEducation(): EducationEntry {
  return { id: newEntryId(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" };
}
function newCertification(): CertificationEntry {
  return { id: newEntryId(), name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "" };
}
function newExperience(): ExperienceEntry {
  return { id: newEntryId(), company: "", title: "", location: "", startDate: "", endDate: "", isCurrent: false, bullets: [""] };
}
function newSkillCategory(): SkillCategory {
  return { id: newEntryId(), name: "", skills: [] };
}

export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [personal, setPersonal] = useState({
    fullName: "", jobTitle: "", email: "", phone: "", location: "", linkedin: "", website: "",
  });
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>([]);
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [skills, setSkills] = useState<SkillCategory[]>([]);
  const [skillInputs, setSkillInputs] = useState<Record<string, string>>({});
  const [career, setCareer] = useState({
    targetRoles: "", industries: "", expectedSalary: "", workSetup: "Remote", currentSkills: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.profile) {
          const p = data.profile;
          setPersonal({
            fullName: p.fullName ?? "", jobTitle: p.jobTitle ?? "", email: p.email ?? "",
            phone: p.phone ?? "", location: p.location ?? "", linkedin: p.linkedin ?? "", website: p.website ?? "",
          });
          setEducation(Array.isArray(p.education) ? p.education : []);
          setCertifications(Array.isArray(p.certifications) ? p.certifications : []);
          setExperience(Array.isArray(p.experience) ? p.experience : []);
          setSkills(Array.isArray(p.skills) ? p.skills : []);
          setCareer({
            targetRoles: p.targetRoles?.join(", ") ?? "", industries: p.industries?.join(", ") ?? "",
            expectedSalary: p.expectedSalary?.toString() ?? "", workSetup: p.workSetup ?? "Remote",
            currentSkills: p.currentSkills?.join(", ") ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...personal, education, certifications, experience, skills,
        targetRoles: career.targetRoles.split(",").map((s) => s.trim()).filter(Boolean),
        industries: career.industries.split(",").map((s) => s.trim()).filter(Boolean),
        expectedSalary: career.expectedSalary ? parseInt(career.expectedSalary, 10) : null,
        workSetup: career.workSetup,
        currentSkills: career.currentSkills.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch("/api/profile", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile saved — new CVs will be pre-filled with this data.");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Education helpers
  const updateEdu = (id: string, patch: Partial<EducationEntry>) =>
    setEducation((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeEdu = (id: string) => setEducation((prev) => prev.filter((e) => e.id !== id));

  // Certification helpers
  const updateCert = (id: string, patch: Partial<CertificationEntry>) =>
    setCertifications((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCert = (id: string) => setCertifications((prev) => prev.filter((c) => c.id !== id));

  // Experience helpers
  const updateExp = (id: string, patch: Partial<ExperienceEntry>) =>
    setExperience((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const removeExp = (id: string) => setExperience((prev) => prev.filter((e) => e.id !== id));
  const updateBullet = (entryId: string, idx: number, value: string) => {
    setExperience((prev) =>
      prev.map((e) => e.id !== entryId ? e : { ...e, bullets: e.bullets.map((b, i) => (i === idx ? value : b)) })
    );
  };
  const addBullet = (entryId: string) =>
    setExperience((prev) => prev.map((e) => e.id !== entryId ? e : { ...e, bullets: [...e.bullets, ""] }));
  const removeBullet = (entryId: string, idx: number) =>
    setExperience((prev) =>
      prev.map((e) => e.id !== entryId ? e : { ...e, bullets: e.bullets.filter((_, i) => i !== idx) })
    );

  // Skills helpers
  const updateCat = (id: string, patch: Partial<SkillCategory>) =>
    setSkills((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCat = (id: string) => setSkills((prev) => prev.filter((c) => c.id !== id));
  const addSkill = (catId: string) => {
    const raw = (skillInputs[catId] ?? "").trim();
    if (!raw) return;
    const newSkills = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setSkills((prev) =>
      prev.map((c) => c.id !== catId ? c : { ...c, skills: [...c.skills, ...newSkills] })
    );
    setSkillInputs((p) => ({ ...p, [catId]: "" }));
  };
  const removeSkill = (catId: string, skill: string) =>
    setSkills((prev) =>
      prev.map((c) => c.id !== catId ? c : { ...c, skills: c.skills.filter((s) => s !== skill) })
    );

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-zinc-400" /></div>;
  }

  const lbl = "text-xs font-medium text-slate-500 dark:text-zinc-400";
  const inp = "mt-1 h-9 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Personal Info ─────────────────────────────── */}
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Personal Info</CardTitle>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Pre-filled into every new CV you create.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><label className={lbl}>Full Name</label><Input className={inp} value={personal.fullName} onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} placeholder="John Smith" /></div>
            <div><label className={lbl}>Job Title</label><Input className={inp} value={personal.jobTitle} onChange={(e) => setPersonal({ ...personal, jobTitle: e.target.value })} placeholder="Software Engineer" /></div>
            <div><label className={lbl}>Email</label><Input className={inp} type="email" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} placeholder="john@example.com" /></div>
            <div><label className={lbl}>Phone</label><Input className={inp} value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} placeholder="+44 7700 000000" /></div>
            <div><label className={lbl}>Location</label><Input className={inp} value={personal.location} onChange={(e) => setPersonal({ ...personal, location: e.target.value })} placeholder="London, UK" /></div>
            <div><label className={lbl}>LinkedIn URL</label><Input className={inp} value={personal.linkedin} onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })} placeholder="linkedin.com/in/johnsmith" /></div>
            <div className="sm:col-span-2"><label className={lbl}>Website / Portfolio</label><Input className={inp} value={personal.website} onChange={(e) => setPersonal({ ...personal, website: e.target.value })} placeholder="johnsmith.dev" /></div>
          </div>
        </CardContent>
      </Card>

      {/* ── Experience ────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Experience</CardTitle>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Pre-filled into new CVs that have an empty experience block.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.map((entry, ei) => (
            <div key={entry.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Position {ei + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={() => removeExp(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div><label className={lbl}>Job Title</label><Input className={inp} value={entry.title} onChange={(e) => updateExp(entry.id, { title: e.target.value })} placeholder="Software Engineer" /></div>
                <div><label className={lbl}>Company</label><Input className={inp} value={entry.company} onChange={(e) => updateExp(entry.id, { company: e.target.value })} placeholder="Acme Corp" /></div>
                <div><label className={lbl}>Location</label><Input className={inp} value={entry.location} onChange={(e) => updateExp(entry.id, { location: e.target.value })} placeholder="London, UK" /></div>
                <div className="flex gap-2">
                  <div className="flex-1"><label className={lbl}>Start</label><Input className={inp} value={entry.startDate} onChange={(e) => updateExp(entry.id, { startDate: e.target.value })} placeholder="Jan 2022" /></div>
                  <div className="flex-1"><label className={lbl}>End</label><Input className={inp} value={entry.endDate} onChange={(e) => updateExp(entry.id, { endDate: e.target.value })} placeholder="Present" disabled={entry.isCurrent} /></div>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <input type="checkbox" checked={entry.isCurrent} onChange={(e) => updateExp(entry.id, { isCurrent: e.target.checked })} className="rounded" />
                Currently working here
              </label>
              <div>
                <label className={lbl}>Achievement bullets</label>
                <div className="mt-1 space-y-1.5">
                  {entry.bullets.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-1.5">
                      <span className="shrink-0 text-zinc-500">•</span>
                      <Input className="h-8 flex-1 text-sm" value={b} onChange={(e) => updateBullet(entry.id, bi, e.target.value)} placeholder="Shipped X, resulting in Y% improvement in Z" />
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-zinc-500 hover:text-red-400" onClick={() => removeBullet(entry.id, bi)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" className="mt-1 h-7 text-xs text-zinc-500 hover:text-zinc-200" onClick={() => addBullet(entry.id)}><Plus className="mr-1 h-3 w-3" /> Add bullet</Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setExperience((prev) => [...prev, newExperience()])}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add position
          </Button>
        </CardContent>
      </Card>

      {/* ── Skills ───────────────────────────────────── */}
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Skills</CardTitle>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Pre-filled into new CVs that have an empty skills block.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.map((cat, ci) => (
            <div key={cat.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Category {ci + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={() => removeCat(cat.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div><label className={lbl}>Category name</label><Input className={inp} value={cat.name} onChange={(e) => updateCat(cat.id, { name: e.target.value })} placeholder="Languages, Frameworks, Tools…" /></div>
              <div>
                <label className={lbl}>Skills</label>
                {cat.skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {cat.skills.map((skill) => (
                      <span key={skill} className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-medium text-blue-300 ring-1 ring-blue-500/25">
                        {skill}
                        <button type="button" onClick={() => removeSkill(cat.id, skill)} className="ml-0.5 text-blue-400 hover:text-blue-200"><X className="h-2.5 w-2.5" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1.5 flex gap-2">
                  <Input className="h-8 flex-1 text-sm" value={skillInputs[cat.id] ?? ""} onChange={(e) => setSkillInputs((p) => ({ ...p, [cat.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(cat.id); } }}
                    placeholder="Type skill, press Enter or comma…" />
                  <Button type="button" variant="secondary" size="sm" className="h-8 px-3 text-xs" onClick={() => addSkill(cat.id)}>Add</Button>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setSkills((prev) => [...prev, newSkillCategory()])}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add category
          </Button>
        </CardContent>
      </Card>

      {/* ── Education & Certifications ───────────────── */}
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Education &amp; Certifications</CardTitle>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Pre-filled into new CVs — no need to re-enter each time.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Education */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Education</p>
            {education.map((entry, i) => (
              <div key={entry.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Entry {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={() => removeEdu(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className={lbl}>Institution</label><Input className={inp} value={entry.institution} onChange={(e) => updateEdu(entry.id, { institution: e.target.value })} placeholder="University of London" /></div>
                  <div><label className={lbl}>Degree</label><Input className={inp} value={entry.degree} onChange={(e) => updateEdu(entry.id, { degree: e.target.value })} placeholder="BSc / MSc / PhD" /></div>
                  <div><label className={lbl}>Field of Study</label><Input className={inp} value={entry.field} onChange={(e) => updateEdu(entry.id, { field: e.target.value })} placeholder="Computer Science" /></div>
                  <div><label className={lbl}>Start Year</label><Input className={inp} value={entry.startDate} onChange={(e) => updateEdu(entry.id, { startDate: e.target.value })} placeholder="2019" /></div>
                  <div><label className={lbl}>End Year</label><Input className={inp} value={entry.endDate} onChange={(e) => updateEdu(entry.id, { endDate: e.target.value })} placeholder="2023" /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setEducation((prev) => [...prev, newEducation()])}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add education
            </Button>
          </div>
          {/* Certifications */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Certifications</p>
            {certifications.map((entry, i) => (
              <div key={entry.id} className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Entry {i + 1}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-red-400" onClick={() => removeCert(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="sm:col-span-2"><label className={lbl}>Certification Name</label><Input className={inp} value={entry.name} onChange={(e) => updateCert(entry.id, { name: e.target.value })} placeholder="AWS Solutions Architect" /></div>
                  <div className="sm:col-span-2"><label className={lbl}>Issuing Organisation</label><Input className={inp} value={entry.issuer} onChange={(e) => updateCert(entry.id, { issuer: e.target.value })} placeholder="Amazon Web Services" /></div>
                  <div><label className={lbl}>Issue Date</label><Input className={inp} value={entry.issueDate} onChange={(e) => updateCert(entry.id, { issueDate: e.target.value })} placeholder="2023" /></div>
                  <div><label className={lbl}>Expiry Date</label><Input className={inp} value={entry.expiryDate} onChange={(e) => updateCert(entry.id, { expiryDate: e.target.value })} placeholder="2026" /></div>
                  <div className="sm:col-span-2"><label className={lbl}>Credential ID (optional)</label><Input className={inp} value={entry.credentialId} onChange={(e) => updateCert(entry.id, { credentialId: e.target.value })} placeholder="ABC-123456" /></div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" className="w-full text-xs" onClick={() => setCertifications((prev) => [...prev, newCertification()])}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add certification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Career Preferences ───────────────────────── */}
      <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">Career Preferences</CardTitle>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Used to personalise job matches and dashboard insights.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><label className={lbl}>Target Roles (comma separated)</label><Input value={career.targetRoles} onChange={(e) => setCareer({ ...career, targetRoles: e.target.value })} placeholder="e.g. Software Engineer, Product Manager" /></div>
          <div className="space-y-2"><label className={lbl}>Industries (comma separated)</label><Input value={career.industries} onChange={(e) => setCareer({ ...career, industries: e.target.value })} placeholder="e.g. FinTech, Healthcare" /></div>
          <div className="space-y-2"><label className={lbl}>Expected Salary (Annual)</label><Input type="number" value={career.expectedSalary} onChange={(e) => setCareer({ ...career, expectedSalary: e.target.value })} placeholder="e.g. 120000" /></div>
          <div className="space-y-2">
            <label className={lbl}>Work Setup</label>
            <select value={career.workSetup} onChange={(e) => setCareer({ ...career, workSetup: e.target.value })}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="Remote" className="bg-slate-50 dark:bg-[#080d18]">Remote</option>
              <option value="Hybrid" className="bg-slate-50 dark:bg-[#080d18]">Hybrid</option>
              <option value="On-site" className="bg-slate-50 dark:bg-[#080d18]">On-site</option>
            </select>
          </div>
          <div className="space-y-2"><label className={lbl}>Current Skills (comma separated)</label><Input value={career.currentSkills} onChange={(e) => setCareer({ ...career, currentSkills: e.target.value })} placeholder="e.g. React, Node.js, Python" /></div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : "Save Profile"}
      </Button>
    </form>
  );
}
