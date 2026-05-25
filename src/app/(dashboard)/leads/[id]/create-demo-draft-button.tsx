"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createDemoDraft } from "../actions";

export function CreateDemoDraftButton({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createDemoDraft(leadId);
      if (!result.ok) setError(result.error ?? "Could not create demo draft.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" onClick={handleCreate} disabled={isPending}>
        {isPending ? "Creating…" : "Create Demo Draft"}
      </Button>
      {error && (
        <p className="text-xs text-red-600 max-w-[16rem] text-right">{error}</p>
      )}
    </div>
  );
}
