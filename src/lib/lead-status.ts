import type { LeadStatus } from "@/types/database";

/** Tailwind classes for each lead status badge. Shared by the leads table and
 * the lead detail page so statuses always render identically. */
export const statusColors: Record<LeadStatus, string> = {
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

export const STATUS_OPTIONS: LeadStatus[] = [
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

/** "demo_ready" -> "demo ready" for display. */
export function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}
