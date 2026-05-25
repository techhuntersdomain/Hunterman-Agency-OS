import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json, WorkflowStatus } from "@/types/database";

export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type WorkflowStep = Database["public"]["Tables"]["workflow_steps"]["Row"];

type Db = SupabaseClient<Database>;

export const WORKFLOW_STATUSES: WorkflowStatus[] = [
  "pending",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
];

export type WorkflowsOverview = {
  workflows: Workflow[];
  byStatus: Record<WorkflowStatus, number>;
  total: number;
  /** Exact error message when the read fails; null on success. */
  error: string | null;
};

/**
 * Reads all workflows (newest first), with counts by status. Never throws.
 * Volume is low in v1, so we read all rows and count in memory.
 */
export async function getWorkflowsOverview(): Promise<WorkflowsOverview> {
  const byStatus = Object.fromEntries(
    WORKFLOW_STATUSES.map((s) => [s, 0])
  ) as Record<WorkflowStatus, number>;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) return { workflows: [], byStatus, total: 0, error: error.message };

    const rows = data ?? [];
    for (const w of rows) {
      if (w.status in byStatus) byStatus[w.status as WorkflowStatus] += 1;
    }
    return { workflows: rows, byStatus, total: rows.length, error: null };
  } catch (e) {
    return {
      workflows: [],
      byStatus,
      total: 0,
      error:
        e instanceof Error ? e.message : "Unknown error reading workflows.",
    };
  }
}

/**
 * Resolves the DB id of a module by its slug. Workflows require a module_id
 * (FK to modules), so callers look it up at runtime rather than hardcoding the
 * UUID. Returns null if the module isn't seeded — callers treat workflow
 * tracking as best-effort and continue without it.
 */
export async function getModuleIdBySlug(
  supabase: Db,
  slug: string
): Promise<string | null> {
  const { data } = await supabase
    .from("modules")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Creates a workflow row in `running` state and returns its id (null on
 * failure, so callers can degrade gracefully). Workflow tracking is an
 * observability layer — a failure here must never abort the underlying work.
 */
export async function createWorkflow(
  supabase: Db,
  args: { moduleId: string; leadId: string; name: string; metadata?: Json }
): Promise<string | null> {
  const row: Database["public"]["Tables"]["workflows"]["Insert"] = {
    module_id: args.moduleId,
    lead_id: args.leadId,
    name: args.name,
    status: "running",
    completed_at: null,
    metadata: args.metadata ?? {},
  };
  const { data, error } = await supabase
    .from("workflows")
    .insert(row)
    .select("id")
    .single();
  if (error || !data) return null;
  return data.id;
}

/** Inserts a single workflow_step record. Best-effort (errors are swallowed). */
export async function addWorkflowStep(
  supabase: Db,
  args: {
    workflowId: string;
    stepName: string;
    stepOrder: number;
    agentType: string;
    status: WorkflowStep["status"];
    input?: Json;
    output?: Json;
    startedAt: string;
    completedAt: string | null;
  }
): Promise<void> {
  const row: Database["public"]["Tables"]["workflow_steps"]["Insert"] = {
    workflow_id: args.workflowId,
    step_name: args.stepName,
    step_order: args.stepOrder,
    status: args.status,
    agent_type: args.agentType,
    input: args.input ?? {},
    output: args.output ?? {},
    started_at: args.startedAt,
    completed_at: args.completedAt,
  };
  await supabase.from("workflow_steps").insert(row);
}

/** Marks a workflow finished (completed/failed) with completion time + metadata. */
export async function finishWorkflow(
  supabase: Db,
  workflowId: string,
  status: Extract<WorkflowStatus, "completed" | "failed">,
  metadata?: Json
): Promise<void> {
  const update: Database["public"]["Tables"]["workflows"]["Update"] = {
    status,
    completed_at: new Date().toISOString(),
  };
  if (metadata !== undefined) update.metadata = metadata;
  await supabase.from("workflows").update(update).eq("id", workflowId);
}
