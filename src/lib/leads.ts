import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];

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
