import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead, BusinessResearch, DemoSite } from "@/lib/leads";

export type DemoSiteDetail = {
  /** null when no demo site exists for the given id (and no error occurred). */
  demoSite: DemoSite | null;
  lead: Lead | null;
  /** Most recent research record for the lead, if any. */
  research: BusinessResearch | null;
  /** Exact error message when a read fails; null otherwise. */
  error: string | null;
};

/**
 * Reads a single demo site by id, plus its lead and latest research. Used by
 * the private internal preview page. Never throws — read failures come back as
 * `error`. Returns `demoSite: null` with `error: null` when the id is unknown.
 */
export async function getDemoSiteDetail(id: string): Promise<DemoSiteDetail> {
  try {
    const supabase = createAdminClient();

    const { data: demoSite, error: demoError } = await supabase
      .from("demo_sites")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (demoError) {
      return { demoSite: null, lead: null, research: null, error: demoError.message };
    }
    if (!demoSite) {
      return { demoSite: null, lead: null, research: null, error: null };
    }

    const [leadRes, researchRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", demoSite.lead_id).maybeSingle(),
      supabase
        .from("business_research")
        .select("*")
        .eq("lead_id", demoSite.lead_id)
        .order("researched_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    return {
      demoSite,
      lead: leadRes.data ?? null,
      research: researchRes.data ?? null,
      error: null,
    };
  } catch (e) {
    return {
      demoSite: null,
      lead: null,
      research: null,
      error: e instanceof Error ? e.message : "Unknown error reading demo site.",
    };
  }
}
