import { Suspense } from "react";
import { CommandCenter } from "@/components/dashboard/command-center";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <CommandCenter />
    </Suspense>
  );
}
