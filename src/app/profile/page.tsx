import { ProfileForm } from "@/components/profile/profile-form";

export const metadata = {
  title: "Profile — Live Job Match",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-4xl">
          Profile Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          Personalize your dashboard, job matches, and career insights.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
