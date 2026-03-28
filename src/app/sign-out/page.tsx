"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function SignOutPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10 text-center">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Sign out</h1>
      <p className="text-sm text-slate-500 dark:text-zinc-400">
        End your session on this device.
      </p>
      <Button
        onClick={() => signOut({ callbackUrl: "/sign-in" })}
        variant="secondary"
      >
        Confirm sign out
      </Button>
    </div>
  );
}

