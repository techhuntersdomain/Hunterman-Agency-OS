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
import type { OutreachMessage } from "@/lib/leads";
import { updateOutreachDraft, approveOutreachDraft } from "../actions";

const CHANNELS: OutreachMessage["channel"][] = [
  "email",
  "sms",
  "linkedin",
  "phone",
  "other",
];

/**
 * Edit + Approve controls for a single outreach message. Both actions only
 * apply while the message is a `draft`; once approved (`scheduled`) or beyond,
 * nothing is rendered. Neither action sends anything — approval just moves the
 * draft to the "ready to send later" state.
 */
export function OutreachDraftActions({ message }: { message: OutreachMessage }) {
  if (message.status !== "draft") return null;
  return (
    <div className="mt-3 flex items-center gap-2">
      <EditOutreachDraftDialog message={message} />
      <ApproveOutreachDraftButton messageId={message.id} />
    </div>
  );
}

function EditOutreachDraftDialog({ message }: { message: OutreachMessage }) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<OutreachMessage["channel"]>(
    message.channel
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("channel", channel); // base-ui Select isn't a native form field
    setError(null);
    startTransition(async () => {
      const result = await updateOutreachDraft(message.id, formData);
      if (result.ok) setOpen(false);
      else setError(result.error ?? "Failed to update draft.");
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setChannel(message.channel); // reset to current values on open
    if (!next) setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Edit
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Outreach Draft</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-muted-foreground">
            This is a draft. Editing changes the saved draft only — nothing is
            sent.
          </p>
          <div>
            <label className="text-sm font-medium">Channel</label>
            <Select
              value={channel}
              onValueChange={(v) =>
                v && setChannel(v as OutreachMessage["channel"])
              }
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Subject</label>
            <Input
              name="subject"
              defaultValue={message.subject ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Body</label>
            <Textarea
              name="body"
              defaultValue={message.body}
              rows={12}
              className="mt-1 font-sans"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ApproveOutreachDraftButton({ messageId }: { messageId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveOutreachDraft(messageId);
      if (!result.ok) setError(result.error ?? "Could not approve draft.");
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" onClick={handleApprove} disabled={isPending}>
        {isPending ? "Approving…" : "Approve Draft"}
      </Button>
      {error && <p className="text-xs text-red-600 max-w-[16rem]">{error}</p>}
    </div>
  );
}
