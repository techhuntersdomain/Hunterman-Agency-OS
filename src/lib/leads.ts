import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type BusinessResearch =
  Database["public"]["Tables"]["business_research"]["Row"];
export type DemoSite = Database["public"]["Tables"]["demo_sites"]["Row"];
export type OutreachMessage =
  Database["public"]["Tables"]["outreach_messages"]["Row"];
export type Workflow = Database["public"]["Tables"]["workflows"]["Row"];
export type ActivityEntry =
  Database["public"]["Tables"]["activity_log"]["Row"];

export type LeadsResult = {
  data: Lead[];
  /** Exact error message when the read fails; null on success. */
  error: string | null;
};

/**
 * Reads all leads, newest first. Never throws — failures (missing env vars,
 * network, RLS, SQL) are returned as `error` so the page can render an
 * error state instead of crashing.
 */
export async function getLeads(): Promise<LeadsResult> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }
    return { data: data ?? [], error: null };
  } catch (e) {
    return {
      data: [],
      error: e instanceof Error ? e.message : "Unknown error reading leads.",
    };
  }
}

export type LeadDetail = {
  /** null when no lead exists for the given id (and no error occurred). */
  lead: Lead | null;
  research: BusinessResearch[];
  demoSites: DemoSite[];
  outreachMessages: OutreachMessage[];
  workflows: Workflow[];
  activity: ActivityEntry[];
  /** Exact error message when the lead read fails; null otherwise. */
  error: string | null;
};

const EMPTY_DETAIL: Omit<LeadDetail, "lead" | "error"> = {
  research: [],
  demoSites: [],
  outreachMessages: [],
  workflows: [],
  activity: [],
};

/**
 * Reads a single lead by id plus its related records (research, demo sites,
 * outreach messages, workflows, activity). Related records are fetched in
 * parallel. Never throws — read failures are returned as `error`.
 *
 * Returns `lead: null` with `error: null` when the id does not exist.
 */
export async function getLeadDetail(id: string): Promise<LeadDetail> {
  try {
    const supabase = createAdminClient();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (leadError) {
      return { lead: null, ...EMPTY_DETAIL, error: leadError.message };
    }
    if (!lead) {
      return { lead: null, ...EMPTY_DETAIL, error: null };
    }

    const [research, demoSites, outreach, workflows, activity] =
      await Promise.all([
        supabase
          .from("business_research")
          .select("*")
          .eq("lead_id", id)
          .order("researched_at", { ascending: false }),
        supabase
          .from("demo_sites")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("outreach_messages")
          .select("*")
          .eq("lead_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("workflows")
          .select("*")
          .eq("lead_id", id)
          .order("started_at", { ascending: false }),
        supabase
          .from("activity_log")
          .select("*")
          .eq("entity_type", "lead")
          .eq("entity_id", id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    return {
      lead,
      research: research.data ?? [],
      demoSites: demoSites.data ?? [],
      outreachMessages: outreach.data ?? [],
      workflows: workflows.data ?? [],
      activity: activity.data ?? [],
      error: null,
    };
  } catch (e) {
    return {
      lead: null,
      ...EMPTY_DETAIL,
      error: e instanceof Error ? e.message : "Unknown error reading lead.",
    };
  }
}
