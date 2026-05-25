"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { runLeadResearch } from "../actions";

export function RunResearchButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const result = await runLeadResearch(leadId);
      if (!result.ok) setError(result.error ?? "Research failed.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleRun} disabled={isPending}>
        {isPending ? "Researching…" : "Run Research"}
      </Button>
      {error && (
        <p className="text-xs text-red-600 max-w-[16rem] text-right">{error}</p>
      )}
    </div>
  );
}
