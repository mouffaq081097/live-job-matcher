"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ProfileForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    targetRoles: "",
    industries: "",
    expectedSalary: "",
    workSetup: "Remote",
    currentSkills: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data?.profile) {
          setFormData({
            targetRoles: data.profile.targetRoles?.join(", ") || "",
            industries: data.profile.industries?.join(", ") || "",
            expectedSalary: data.profile.expectedSalary?.toString() || "",
            workSetup: data.profile.workSetup || "Remote",
            currentSkills: data.profile.currentSkills?.join(", ") || "",
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
        targetRoles: formData.targetRoles.split(",").map(s => s.trim()).filter(Boolean),
        industries: formData.industries.split(",").map(s => s.trim()).filter(Boolean),
        expectedSalary: formData.expectedSalary ? parseInt(formData.expectedSalary, 10) : null,
        workSetup: formData.workSetup,
        currentSkills: formData.currentSkills.split(",").map(s => s.trim()).filter(Boolean),
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Profile saved successfully");
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-slate-500 dark:text-zinc-400" /></div>;
  }

  return (
    <Card className="border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-white">Your Profile</CardTitle>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Manage your career preferences to get personalized matches.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Target Roles (comma separated)</label>
            <Input
              value={formData.targetRoles}
              onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })}
              placeholder="e.g. Software Engineer, Product Manager"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Industries (comma separated)</label>
            <Input
              value={formData.industries}
              onChange={(e) => setFormData({ ...formData, industries: e.target.value })}
              placeholder="e.g. FinTech, Healthcare"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Expected Salary (Annual)</label>
            <Input
              type="number"
              value={formData.expectedSalary}
              onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
              placeholder="e.g. 120000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Work Setup</label>
            <select
              value={formData.workSetup}
              onChange={(e) => setFormData({ ...formData, workSetup: e.target.value })}
              className="flex h-10 w-full rounded-md border border-slate-200 dark:border-white/10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="Remote" className="bg-slate-50 dark:bg-[#080d18]">Remote</option>
              <option value="Hybrid" className="bg-slate-50 dark:bg-[#080d18]">Hybrid</option>
              <option value="On-site" className="bg-slate-50 dark:bg-[#080d18]">On-site</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 dark:text-zinc-400">Current Skills (comma separated)</label>
            <Input
              value={formData.currentSkills}
              onChange={(e) => setFormData({ ...formData, currentSkills: e.target.value })}
              placeholder="e.g. React, Node.js, Python"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
