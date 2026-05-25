"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { statusColors, STATUS_OPTIONS, formatStatus } from "@/lib/lead-status";
import type { Lead } from "@/lib/leads";
import type { LeadStatus } from "@/types/database";
import { updateLeadStatus } from "../leads/actions";

export function PipelineBoard({
  leads,
  loadError,
}: {
  leads: Lead[];
  loadError: string | null;
}) {
  if (loadError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-6 space-y-2">
          <p className="text-sm font-medium text-red-700">
            Could not load the pipeline
          </p>
          <pre className="rounded-md bg-red-100 p-3 text-xs text-red-800 whitespace-pre-wrap">
            {loadError}
          </pre>
          <p className="text-sm text-red-700">
            Check the{" "}
            <a href="/health" className="font-medium underline">
              database health page
            </a>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped = STATUS_OPTIONS.reduce(
    (acc, status) => {
      acc[status] = leads.filter((l) => l.status === status);
      return acc;
    },
    {} as Record<LeadStatus, Lead[]>
  );

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUS_OPTIONS.map((status) => (
        <div key={status} className="w-72 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded",
                statusColors[status]
              )}
            >
              {formatStatus(status)}
            </span>
            <span className="text-xs text-muted-foreground">
              {grouped[status].length}
            </span>
          </div>
          <div className="space-y-2">
            {grouped[status].length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-3">No leads</p>
            ) : (
              grouped[status].map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(next: LeadStatus) {
    if (next === lead.status) return;
    setError(null);
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, next);
      if (!result.ok) setError(result.error ?? "Update failed.");
    });
  }

  const meta = [lead.industry, lead.location].filter(Boolean).join(" · ");

  return (
    <Card className={cn("gap-2 py-3", isPending && "opacity-50")}>
      <CardContent className="px-3 space-y-2">
        <Link
          href={`/leads/${lead.id}`}
          className="font-medium text-sm hover:underline block"
        >
          {lead.business_name}
        </Link>
        <div className="text-xs text-muted-foreground space-y-0.5">
          {meta && <p>{meta}</p>}
          {lead.contact_name && <p>{lead.contact_name}</p>}
          {lead.email && <p className="truncate">{lead.email}</p>}
          {lead.phone && <p>{lead.phone}</p>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {lead.score !== null ? `${lead.score}/100` : "—"}
          </span>
          <Select
            value={lead.status}
            onValueChange={(v) => v && handleStatusChange(v as LeadStatus)}
          >
            <SelectTrigger size="sm" disabled={isPending} className="h-7 w-[132px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {formatStatus(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
