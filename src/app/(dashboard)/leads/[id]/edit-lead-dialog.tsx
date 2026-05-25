"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_OPTIONS, formatStatus } from "@/lib/lead-status";
import type { LeadStatus } from "@/types/database";
import type { Lead } from "@/lib/leads";
import { updateLead } from "../actions";

export function EditLeadDialog({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("status", status); // base-ui Select isn't a native form field
    setError(null);
    startTransition(async () => {
      const result = await updateLead(lead.id, formData);
      if (result.ok) setOpen(false);
      else setError(result.error ?? "Failed to update lead.");
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setStatus(lead.status); // reset to current values each time it opens
    if (!next) setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline">Edit</Button>} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-muted-foreground">
            Editing{" "}
            <span className="font-medium text-foreground">
              {lead.business_name}
            </span>{" "}
            (business name is not editable here)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Contact Name</label>
              <Input
                name="contact_name"
                defaultValue={lead.contact_name ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                defaultValue={lead.email ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="phone"
                defaultValue={lead.phone ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input
                name="website"
                defaultValue={lead.website ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Industry</label>
              <Input
                name="industry"
                defaultValue={lead.industry ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                defaultValue={lead.location ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(v) => v && setStatus(v as LeadStatus)}
              >
                <SelectTrigger className="mt-1 w-full">
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
            <div>
              <label className="text-sm font-medium">Score (0–100)</label>
              <Input
                name="score"
                type="number"
                min={0}
                max={100}
                defaultValue={lead.score ?? ""}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                name="notes"
                defaultValue={lead.notes ?? ""}
                className="mt-1"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
