"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { runBusinessResearch } from "@/lib/agents/research/business-researcher";
import { scoreLead } from "@/lib/agents/research/lead-scorer";
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
  revalidatePath("/pipeline");
  revalidatePath("/workflows");
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
 * Updates a lead's editable details from the lead detail edit form.
 * `business_name` is intentionally not editable here. Validates status and
 * score before writing so the user gets a clean message instead of a DB error.
 */
export async function updateLead(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };

  const status = formData.get("status");
  if (typeof status !== "string" || !LEAD_STATUSES.includes(status as LeadStatus)) {
    return { ok: false, error: "Invalid or missing status." };
  }

  let score: number | null = null;
  const scoreRaw = formData.get("score");
  if (typeof scoreRaw === "string" && scoreRaw.trim() !== "") {
    const n = Number(scoreRaw);
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      return {
        ok: false,
        error: "Score must be a whole number between 0 and 100.",
      };
    }
    score = n;
  }

  const updates: Database["public"]["Tables"]["leads"]["Update"] = {
    contact_name: field(formData, "contact_name"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    website: field(formData, "website"),
    industry: field(formData, "industry"),
    location: field(formData, "location"),
    status: status as LeadStatus,
    score,
    notes: field(formData, "notes"),
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").update(updates).eq("id", id);
    if (error) return { ok: false, error: error.message };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update lead.",
    };
  }

  revalidatePath(`/leads/${id}`);
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

/**
 * Runs the business-researcher + lead-scorer for a single lead, then persists
 * the results: replaces the lead's business_research record, updates
 * leads.score and leads.status, and logs the run to activity_log.
 * Internal-only — no external contact, no approval gate.
 */
export async function runLeadResearch(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing lead id." };

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Supabase is not configured.",
    };
  }

  // 1. Fetch the lead.
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (leadError) return { ok: false, error: leadError.message };
  if (!lead) return { ok: false, error: "Lead not found." };

  // 2. Research + score (deterministic, available-data only).
  const findings = await runBusinessResearch(lead);
  const { score, status, rationale } = scoreLead(lead, findings);

  // 3. Replace the lead's research record (one current record per lead).
  const researchRow: Database["public"]["Tables"]["business_research"]["Insert"] =
    {
      lead_id: id,
      current_website: findings.current_website,
      has_website: findings.has_website,
      google_rating: findings.google_rating,
      review_count: findings.review_count,
      competitors: findings.competitors,
      market_notes: findings.market_notes,
      tech_stack: findings.tech_stack,
    };
  await supabase.from("business_research").delete().eq("lead_id", id);
  const { error: researchError } = await supabase
    .from("business_research")
    .insert(researchRow);
  if (researchError) return { ok: false, error: researchError.message };

  // 4. Update the lead's score + status.
  const { error: updateError } = await supabase
    .from("leads")
    .update({ score, status })
    .eq("id", id);
  if (updateError) return { ok: false, error: updateError.message };

  // 5. Log the run (best-effort; a logging failure shouldn't fail the action).
  const activityRow: Database["public"]["Tables"]["activity_log"]["Insert"] = {
    entity_type: "lead",
    entity_id: id,
    action: "research_completed",
    actor: "business-researcher",
    details: { score, status, rationale, data_sources: findings.data_sources },
  };
  await supabase.from("activity_log").insert(activityRow);

  revalidatePath(`/leads/${id}`);
  refreshLeadsViews();
  return { ok: true };
}
