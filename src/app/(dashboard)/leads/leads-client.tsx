"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/database";
import type { Lead } from "@/lib/leads";
import { createLead, updateLeadStatus, deleteLead } from "./actions";

const statusColors: Record<LeadStatus, string> = {
  new: "bg-slate-100 text-slate-700",
  researching: "bg-blue-100 text-blue-700",
  qualified: "bg-indigo-100 text-indigo-700",
  demo_ready: "bg-violet-100 text-violet-700",
  outreach: "bg-amber-100 text-amber-700",
  negotiating: "bg-orange-100 text-orange-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
  dormant: "bg-gray-100 text-gray-700",
};

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "researching",
  "qualified",
  "demo_ready",
  "outreach",
  "negotiating",
  "won",
  "lost",
  "dormant",
];

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function LeadsClient({
  leads,
  loadError,
}: {
  leads: Lead[];
  loadError: string | null;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus =
      filterStatus === "all" || lead.status === filterStatus;
    const matchesSearch =
      !search ||
      lead.business_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.location?.toLowerCase().includes(search.toLowerCase()) ||
      lead.industry?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground mt-1">
            Manage local business leads
          </p>
        </div>
        <AddLeadDialog />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search business, location, industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v ?? "all")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {formatStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loadError ? (
        <ErrorState message={loadError} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {filteredLeads.length} Lead
              {filteredLeads.length !== 1 ? "s" : ""}
              {leads.length !== filteredLeads.length && (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  of {leads.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <EmptyState
                title="No leads yet"
                hint="Add your first lead to start the Local Growth Pipeline, or load the sample data from supabase/seed.sql."
              />
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                title="No matching leads"
                hint="No leads match your current search or status filter."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-base text-red-700">
          Could not load leads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-red-700">
          Supabase returned an error while reading the leads table:
        </p>
        <pre className="rounded-md bg-red-100 p-3 text-xs text-red-800 whitespace-pre-wrap">
          {message}
        </pre>
        <p className="text-sm text-red-700">
          Check the{" "}
          <a href="/health" className="font-medium underline">
            database health page
          </a>{" "}
          and see SUPABASE_SETUP.md.
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1 max-w-md mx-auto">{hint}</p>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
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

  function handleDelete() {
    if (
      !window.confirm(
        `Delete "${lead.business_name}"? This cannot be undone. ` +
          `To archive instead, set the status to "dormant".`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteLead(lead.id);
      if (!result.ok) setError(result.error ?? "Delete failed.");
    });
  }

  return (
    <>
      <TableRow className={cn(isPending && "opacity-50")}>
        <TableCell>
          <div>
            <p className="font-medium">{lead.business_name}</p>
            {lead.contact_name && (
              <p className="text-xs text-muted-foreground">
                {lead.contact_name}
              </p>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm">{lead.location || "—"}</TableCell>
        <TableCell className="text-sm">{lead.industry || "—"}</TableCell>
        <TableCell>
          <Select
            value={lead.status}
            onValueChange={(v) => v && handleStatusChange(v as LeadStatus)}
          >
            <SelectTrigger
              size="sm"
              disabled={isPending}
              className={cn("border-transparent", statusColors[lead.status])}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-sm">
          {lead.score !== null ? `${lead.score}/100` : "—"}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {new Date(lead.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete
          </Button>
        </TableCell>
      </TableRow>
      {error && (
        <TableRow>
          <TableCell colSpan={7} className="py-1">
            <p className="text-xs text-red-600">{error}</p>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function AddLeadDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createLead(formData);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to create lead.");
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button>+ Add Lead</Button>} />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Business Name *</label>
              <Input
                name="business_name"
                required
                placeholder="e.g. Joe's Plumbing"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Name</label>
              <Input
                name="contact_name"
                placeholder="Owner/manager"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                name="email"
                type="email"
                placeholder="email@business.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                name="phone"
                placeholder="+49 ..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input name="website" placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Industry</label>
              <Input
                name="industry"
                placeholder="e.g. Cleaning, Painting"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Location</label>
              <Input
                name="location"
                placeholder="City, Country"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                name="notes"
                placeholder="Initial notes..."
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
              {isPending ? "Adding..." : "Add Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
