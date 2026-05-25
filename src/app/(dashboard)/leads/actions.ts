"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { runBusinessResearch } from "@/lib/agents/research/business-researcher";
import { scoreLead } from "@/lib/agents/research/lead-scorer";
import {
  getModuleIdBySlug,
  createWorkflow,
  addWorkflowStep,
  finishWorkflow,
} from "@/lib/workflows";
import type { Database, Json, LeadStatus } from "@/types/database";

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
 *
 * The run is also recorded in the OS workflow layer: a `workflows` row plus a
 * `workflow_steps` row per agent (business-researcher, lead-scorer). Workflow
 * tracking is best-effort observability — if any of it fails (e.g. module not
 * seeded), the core research/score/persist path still completes unchanged.
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

  // 2. Open a workflow for this run (best-effort; null if it can't be created).
  const moduleId = await getModuleIdBySlug(supabase, "local-growth");
  const workflowId = moduleId
    ? await createWorkflow(supabase, {
        moduleId,
        leadId: id,
        name: `Lead Research — ${lead.business_name}`,
        metadata: { trigger: "manual", pipeline: "research-only" },
      })
    : null;

  // Marks the workflow failed (if one exists) and returns the error result.
  async function failWith(error: string): Promise<ActionResult> {
    if (workflowId) {
      await finishWorkflow(supabase, workflowId, "failed", {
        trigger: "manual",
        pipeline: "research-only",
        error,
      });
    }
    return { ok: false, error };
  }

  // 3. Step 1 — business-researcher (deterministic, available-data only).
  const s1Start = new Date().toISOString();
  let findings: Awaited<ReturnType<typeof runBusinessResearch>>;
  try {
    findings = await runBusinessResearch(lead);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Research failed.";
    if (workflowId) {
      await addWorkflowStep(supabase, {
        workflowId,
        stepName: "business-researcher",
        stepOrder: 1,
        agentType: "business-researcher",
        status: "failed",
        input: { lead_id: id, website: lead.website },
        output: { error: msg },
        startedAt: s1Start,
        completedAt: new Date().toISOString(),
      });
    }
    return failWith(msg);
  }
  if (workflowId) {
    await addWorkflowStep(supabase, {
      workflowId,
      stepName: "business-researcher",
      stepOrder: 1,
      agentType: "business-researcher",
      status: "completed",
      input: {
        lead_id: id,
        business_name: lead.business_name,
        website: lead.website,
        has_website: findings.has_website,
      },
      output: {
        has_website: findings.has_website,
        current_website: findings.current_website,
        website_reachable: findings.website_reachable,
        website_mobile_friendly: findings.website_mobile_friendly,
        tech_stack: findings.tech_stack,
        google_rating: findings.google_rating,
        review_count: findings.review_count,
        data_sources: findings.data_sources,
      } as Json,
      startedAt: s1Start,
      completedAt: new Date().toISOString(),
    });
  }

  // 4. Step 2 — lead-scorer.
  const s2Start = new Date().toISOString();
  const { score, status, rationale } = scoreLead(lead, findings);
  if (workflowId) {
    await addWorkflowStep(supabase, {
      workflowId,
      stepName: "lead-scorer",
      stepOrder: 2,
      agentType: "lead-scorer",
      status: "completed",
      input: {
        has_website: findings.has_website,
        website_reachable: findings.website_reachable,
        website_mobile_friendly: findings.website_mobile_friendly,
        industry: lead.industry,
        location: lead.location,
        has_phone: Boolean(lead.phone),
        has_email: Boolean(lead.email),
      },
      output: { score, status, rationale } as Json,
      startedAt: s2Start,
      completedAt: new Date().toISOString(),
    });
  }

  // 5. Replace the lead's research record (one current record per lead).
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
  const { data: researchInserted, error: researchError } = await supabase
    .from("business_research")
    .insert(researchRow)
    .select("id")
    .single();
  if (researchError) return failWith(researchError.message);
  const researchId = researchInserted?.id ?? null;

  // 6. Update the lead's score + status.
  const { error: updateError } = await supabase
    .from("leads")
    .update({ score, status })
    .eq("id", id);
  if (updateError) return failWith(updateError.message);

  // 7. Log the run (best-effort; a logging failure shouldn't fail the action).
  //    business_research has no workflow_id column, so the link is carried in
  //    the activity details and the workflow metadata instead.
  const activityRow: Database["public"]["Tables"]["activity_log"]["Insert"] = {
    entity_type: "lead",
    entity_id: id,
    action: "research_completed",
    actor: "business-researcher",
    details: {
      score,
      status,
      rationale,
      data_sources: findings.data_sources,
      workflow_id: workflowId,
      research_id: researchId,
    },
  };
  await supabase.from("activity_log").insert(activityRow);

  // 8. Close the workflow, linking the produced records.
  if (workflowId) {
    await finishWorkflow(supabase, workflowId, "completed", {
      trigger: "manual",
      pipeline: "research-only",
      score,
      status,
      research_id: researchId,
      data_sources: findings.data_sources,
    });
  }

  revalidatePath(`/leads/${id}`);
  refreshLeadsViews();
  return { ok: true };
}
