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
import { chooseTemplate, buildDemoContent } from "@/lib/demo-templates";
import { buildOutreachDraft } from "@/lib/outreach-writer";
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

type OutreachChannel =
  Database["public"]["Tables"]["outreach_messages"]["Row"]["channel"];

const OUTREACH_CHANNELS: OutreachChannel[] = [
  "email",
  "sms",
  "linkedin",
  "phone",
  "other",
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
  let researcherStepId: string | null = null;
  if (workflowId) {
    researcherStepId = await addWorkflowStep(supabase, {
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
      // Queryable link to the run that produced this record (null if untracked).
      workflow_id: workflowId,
      workflow_step_id: researcherStepId,
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

/**
 * Creates a v1 demo-site *draft* for a lead: picks a niche template from the
 * lead's industry, records a `demo_sites` row (status `ready`, no external
 * deployment), and tracks the run in the workflow layer (workflow + a
 * demo-site-generator step) plus activity_log. Internal-only — nothing is sent
 * to the lead and no public site is published. No business facts are invented;
 * the draft renders from real lead/research data + generic template copy.
 */
export async function createDemoDraft(id: string): Promise<ActionResult> {
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

  // 1. Fetch the lead + its latest research (research is optional context).
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (leadError) return { ok: false, error: leadError.message };
  if (!lead) return { ok: false, error: "Lead not found." };

  const { data: research } = await supabase
    .from("business_research")
    .select("*")
    .eq("lead_id", id)
    .order("researched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Choose a template and build draft content (real data + template copy).
  const template = chooseTemplate(lead.industry);
  const content = buildDemoContent(lead, research ?? null, template);

  // 3. Open a workflow for this run (best-effort; null if it can't be created).
  const moduleId = await getModuleIdBySlug(supabase, "local-growth");
  const workflowId = moduleId
    ? await createWorkflow(supabase, {
        moduleId,
        leadId: id,
        name: `Demo Draft — ${lead.business_name}`,
        metadata: { trigger: "manual", pipeline: "demo-draft" },
      })
    : null;

  async function failWith(error: string): Promise<ActionResult> {
    if (workflowId) {
      await finishWorkflow(supabase, workflowId, "failed", {
        trigger: "manual",
        pipeline: "demo-draft",
        error,
      });
    }
    return { ok: false, error };
  }

  // 4. Step 1 — demo-site-generator.
  const s1Start = new Date().toISOString();
  let generatorStepId: string | null = null;
  if (workflowId) {
    generatorStepId = await addWorkflowStep(supabase, {
      workflowId,
      stepName: "demo-site-generator",
      stepOrder: 1,
      agentType: "demo-site-generator",
      status: "completed",
      input: {
        lead_id: id,
        industry: lead.industry,
        used_research: Boolean(research),
      },
      output: {
        template: template.slug,
        template_label: template.label,
        section_count: content.services.length,
        headline: content.heroHeadline,
      } as Json,
      startedAt: s1Start,
      completedAt: new Date().toISOString(),
    });
  }

  // 5. Create the demo_sites row (draft, ready, no external URL).
  const demoRow: Database["public"]["Tables"]["demo_sites"]["Insert"] = {
    lead_id: id,
    workflow_id: workflowId,
    url: null,
    template: template.slug,
    status: "ready",
    preview_image: null,
    generated_at: new Date().toISOString(),
    expires_at: null,
  };
  const { data: demoInserted, error: demoError } = await supabase
    .from("demo_sites")
    .insert(demoRow)
    .select("id")
    .single();
  if (demoError) return failWith(demoError.message);
  const demoSiteId = demoInserted?.id ?? null;

  // 6. Log the run (best-effort).
  const activityRow: Database["public"]["Tables"]["activity_log"]["Insert"] = {
    entity_type: "lead",
    entity_id: id,
    action: "demo_draft_created",
    actor: "demo-site-generator",
    details: {
      template: template.slug,
      demo_site_id: demoSiteId,
      workflow_id: workflowId,
      workflow_step_id: generatorStepId,
    },
  };
  await supabase.from("activity_log").insert(activityRow);

  // 7. Close the workflow, linking the produced draft.
  if (workflowId) {
    await finishWorkflow(supabase, workflowId, "completed", {
      trigger: "manual",
      pipeline: "demo-draft",
      template: template.slug,
      demo_site_id: demoSiteId,
    });
  }

  revalidatePath(`/leads/${id}`);
  refreshLeadsViews();
  return { ok: true };
}

/**
 * Creates a v1 outreach *draft* for a lead: writes a short, honest German email
 * from the lead's data, latest research, and latest ready demo draft, and saves
 * it to `outreach_messages` with status `draft`. Tracked in the workflow layer
 * (workflow + outreach-writer step) and activity_log. Internal-only — nothing
 * is sent, no email/Gmail integration, no follow-up. The draft stays a draft
 * until manually approved/sent later.
 */
export async function createOutreachDraft(id: string): Promise<ActionResult> {
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

  // 2. Fetch latest research + latest ready demo draft (both optional context).
  const { data: research } = await supabase
    .from("business_research")
    .select("*")
    .eq("lead_id", id)
    .order("researched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: demoSite } = await supabase
    .from("demo_sites")
    .select("*")
    .eq("lead_id", id)
    .eq("status", "ready")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Generate the draft (deterministic, honest, real-data only).
  const draft = buildOutreachDraft(lead, research ?? null, demoSite ?? null);

  // 4. Open a workflow for this run (best-effort; null if it can't be created).
  const moduleId = await getModuleIdBySlug(supabase, "local-growth");
  const workflowId = moduleId
    ? await createWorkflow(supabase, {
        moduleId,
        leadId: id,
        name: `Outreach Draft — ${lead.business_name}`,
        metadata: { trigger: "manual", pipeline: "outreach-draft" },
      })
    : null;

  async function failWith(error: string): Promise<ActionResult> {
    if (workflowId) {
      await finishWorkflow(supabase, workflowId, "failed", {
        trigger: "manual",
        pipeline: "outreach-draft",
        error,
      });
    }
    return { ok: false, error };
  }

  // 5. Step 1 — outreach-writer.
  const s1Start = new Date().toISOString();
  let writerStepId: string | null = null;
  if (workflowId) {
    writerStepId = await addWorkflowStep(supabase, {
      workflowId,
      stepName: "outreach-writer",
      stepOrder: 1,
      agentType: "outreach-writer",
      status: "completed",
      input: {
        lead_id: id,
        channel: "email",
        used_research: Boolean(research),
        used_demo: Boolean(demoSite),
      },
      output: {
        subject: draft.subject,
        channel: "email",
        based_on: draft.basedOn,
        demo_site_id: demoSite?.id ?? null,
      } as Json,
      startedAt: s1Start,
      completedAt: new Date().toISOString(),
    });
  }

  // 6. Insert the outreach message as a draft (no sending).
  const outreachRow: Database["public"]["Tables"]["outreach_messages"]["Insert"] =
    {
      lead_id: id,
      workflow_id: workflowId,
      channel: "email",
      subject: draft.subject,
      body: draft.body,
      status: "draft",
      scheduled_for: null,
      sent_at: null,
      opened_at: null,
      replied_at: null,
    };
  const { data: outreachInserted, error: outreachError } = await supabase
    .from("outreach_messages")
    .insert(outreachRow)
    .select("id")
    .single();
  if (outreachError) return failWith(outreachError.message);
  const outreachId = outreachInserted?.id ?? null;

  // 7. Log the run (best-effort).
  const activityRow: Database["public"]["Tables"]["activity_log"]["Insert"] = {
    entity_type: "lead",
    entity_id: id,
    action: "outreach_draft_created",
    actor: "outreach-writer",
    details: {
      channel: "email",
      subject: draft.subject,
      outreach_message_id: outreachId,
      demo_site_id: demoSite?.id ?? null,
      workflow_id: workflowId,
      workflow_step_id: writerStepId,
    },
  };
  await supabase.from("activity_log").insert(activityRow);

  // 8. Close the workflow, linking the produced draft.
  if (workflowId) {
    await finishWorkflow(supabase, workflowId, "completed", {
      trigger: "manual",
      pipeline: "outreach-draft",
      channel: "email",
      subject: draft.subject,
      outreach_message_id: outreachId,
    });
  }

  revalidatePath(`/leads/${id}`);
  refreshLeadsViews();
  return { ok: true };
}

/**
 * Edits an outreach *draft* in place (subject, body, channel). Only messages
 * still in `draft` status may be edited — once approved (`scheduled`) or beyond,
 * the content is frozen. Internal-only: this never sends anything. Body is
 * required; subject is optional; channel defaults to email.
 */
export async function updateOutreachDraft(
  messageId: string,
  formData: FormData
): Promise<ActionResult> {
  if (!messageId) return { ok: false, error: "Missing message id." };

  const body = field(formData, "body");
  if (!body) return { ok: false, error: "Message body is required." };
  const subject = field(formData, "subject");

  const channelRaw = formData.get("channel");
  const channel = typeof channelRaw === "string" ? channelRaw : "email";
  if (!OUTREACH_CHANNELS.includes(channel as OutreachChannel)) {
    return { ok: false, error: `Invalid channel: ${channel}` };
  }

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Supabase is not configured.",
    };
  }

  // Guard: only drafts are editable. Fetch current state first.
  const { data: message, error: fetchError } = await supabase
    .from("outreach_messages")
    .select("id, lead_id, status")
    .eq("id", messageId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!message) return { ok: false, error: "Outreach message not found." };
  if (message.status !== "draft") {
    return {
      ok: false,
      error: "Only draft messages can be edited. This one is already approved.",
    };
  }

  const updates: Database["public"]["Tables"]["outreach_messages"]["Update"] = {
    subject,
    body,
    channel: channel as OutreachChannel,
  };
  const { error: updateError } = await supabase
    .from("outreach_messages")
    .update(updates)
    .eq("id", messageId);
  if (updateError) return { ok: false, error: updateError.message };

  // Log the edit (best-effort).
  const activityRow: Database["public"]["Tables"]["activity_log"]["Insert"] = {
    entity_type: "lead",
    entity_id: message.lead_id,
    action: "outreach_draft_edited",
    actor: "user",
    details: {
      outreach_message_id: messageId,
      channel,
      subject,
    },
  };
  await supabase.from("activity_log").insert(activityRow);

  revalidatePath(`/leads/${message.lead_id}`);
  refreshLeadsViews();
  return { ok: true };
}

/**
 * Approves an outreach *draft*: moves it from `draft` to `scheduled`, the
 * "approved / ready to send later" state. This is an approval gate only — it
 * sends nothing, schedules no time (`scheduled_for` stays null), and adds no
 * Gmail/email integration. Idempotency-guarded so only drafts can be approved.
 *
 * The approval is recorded in the workflow layer (a dedicated approval workflow
 * + an `approval-gate` step) and activity_log, consistent with the other lead
 * actions. Workflow tracking is best-effort; a failure there never blocks the
 * approval.
 */
export async function approveOutreachDraft(
  messageId: string
): Promise<ActionResult> {
  if (!messageId) return { ok: false, error: "Missing message id." };

  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Supabase is not configured.",
    };
  }

  // 1. Fetch the message + guard that it's still a draft.
  const { data: message, error: fetchError } = await supabase
    .from("outreach_messages")
    .select("id, lead_id, status, subject, channel, workflow_id")
    .eq("id", messageId)
    .maybeSingle();
  if (fetchError) return { ok: false, error: fetchError.message };
  if (!message) return { ok: false, error: "Outreach message not found." };
  if (message.status !== "draft") {
    return {
      ok: false,
      error: `Only drafts can be approved (this one is "${message.status}").`,
    };
  }

  // 2. Fetch the lead (for the workflow name; lead must still exist).
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, business_name")
    .eq("id", message.lead_id)
    .maybeSingle();
  if (leadError) return { ok: false, error: leadError.message };
  if (!lead) return { ok: false, error: "Lead not found." };

  // 3. Approve: draft -> scheduled (approved, NOT sent). No time is set.
  const { error: updateError } = await supabase
    .from("outreach_messages")
    .update({ status: "scheduled" })
    .eq("id", messageId)
    .eq("status", "draft"); // re-assert the guard at write time
  if (updateError) return { ok: false, error: updateError.message };

  // 4. Track the approval in the workflow layer (best-effort).
  const moduleId = await getModuleIdBySlug(supabase, "local-growth");
  const workflowId = moduleId
    ? await createWorkflow(supabase, {
        moduleId,
        leadId: message.lead_id,
        name: `Outreach Approval — ${lead.business_name}`,
        metadata: { trigger: "manual", pipeline: "outreach-approval" },
      })
    : null;

  if (workflowId) {
    const now = new Date().toISOString();
    await addWorkflowStep(supabase, {
      workflowId,
      stepName: "approval-gate",
      stepOrder: 1,
      agentType: "user",
      status: "completed",
      input: {
        outreach_message_id: messageId,
        channel: message.channel,
        subject: message.subject,
        from_status: "draft",
      },
      output: {
        to_status: "scheduled",
        sent: false,
        note: "Approved for sending later. Nothing has been sent.",
      } as Json,
      startedAt: now,
      completedAt: now,
    });
    await finishWorkflow(supabase, workflowId, "completed", {
      trigger: "manual",
      pipeline: "outreach-approval",
      outreach_message_id: messageId,
      to_status: "scheduled",
    });
  }

  // 5. Log the approval (best-effort).
  const activityRow: Database["public"]["Tables"]["activity_log"]["Insert"] = {
    entity_type: "lead",
    entity_id: message.lead_id,
    action: "outreach_draft_approved",
    actor: "user",
    details: {
      outreach_message_id: messageId,
      channel: message.channel,
      subject: message.subject,
      to_status: "scheduled",
      sent: false,
      workflow_id: workflowId,
    },
  };
  await supabase.from("activity_log").insert(activityRow);

  revalidatePath(`/leads/${message.lead_id}`);
  refreshLeadsViews();
  return { ok: true };
}
