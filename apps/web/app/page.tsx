import { Button } from "@benefit/ui";
import type { BenefitKind } from "@benefit/types";

const KINDS: BenefitKind[] = ["medical", "dental", "vision"];

export default function Home() {
  return (
    <main className="flex flex-1 w-full max-w-3xl mx-auto flex-col items-start justify-center gap-6 py-32 px-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        Benefit Enrollment
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Monorepo scaffold is live. Available benefit kinds:{" "}
        {KINDS.join(", ")}.
      </p>
      <div className="flex gap-3">
        <Button>Start enrollment</Button>
        <Button variant="secondary">Upload file</Button>
      </div>
    </main>
  );
}
