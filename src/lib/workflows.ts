import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, WorkflowStatus } from "@/types/database";

export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];

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
