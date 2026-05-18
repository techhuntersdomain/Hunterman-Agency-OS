"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, LeadStatus } from "@/types/database";

export type ActionResult = { ok: boolean; error?: string };

const LEAD_STATUSES: LeadStatus[] = [
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

/** Trims a FormData string field; returns null when empty. */
function field(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function refreshLeadsViews() {
  revalidatePath("/leads");
  revalidatePath("/health");
  revalidatePath("/");
}

/** Creates a lead from the Add Lead form. */
export async function createLead(formData: FormData): Promise<ActionResult> {
  const business_name = field(formData, "business_name");
  if (!business_name) {
    return { ok: false, error: "Business name is required." };
  }

  const lead: Database["public"]["Tables"]["leads"]["Insert"] = {
    business_name,
    contact_name: field(formData, "contact_name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    website: field(formData, "website"),
    industry: field(formData, "industry"),
    location: field(formData, "location"),
    notes: field(formData, "notes"),
    source: "manual",
    status: "new",
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").insert(lead);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create lead.",
    };
  }

  refreshLeadsViews();
  return { ok: true };
}

/** Updates a single lead's pipeline status. */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };
  if (!LEAD_STATUSES.includes(status)) {
    return { ok: false, error: `Invalid status: ${status}` };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update status.",
    };
  }

  refreshLeadsViews();
  return { ok: true };
}

/**
 * Permanently deletes a lead. The schema has no soft-delete/`archived` column;
 * to archive instead of delete, set the lead's status to `dormant`.
 */
export async function deleteLead(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to delete lead.",
    };
  }

  refreshLeadsViews();
  return { ok: true };
}
