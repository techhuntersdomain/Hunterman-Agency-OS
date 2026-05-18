import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-only Supabase client using the service-role key.
 *
 * Phase 1.5 has no auth/login yet, and the schema's RLS policies only grant
 * access to the `authenticated` role. Reads/writes therefore go through the
 * server with the service-role key, which bypasses RLS. This key must never
 * reach the browser — only import this module from Server Components, Server
 * Actions, or Route Handlers.
 */

const URL_VAR = "NEXT_PUBLIC_SUPABASE_URL";
const SERVICE_KEY_VAR = "SUPABASE_SERVICE_ROLE_KEY";

export type SupabaseEnvStatus = {
  ok: boolean;
  missing: string[];
  url: string | undefined;
};

/** Reports which Supabase env vars are present, without throwing. */
export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const missing: string[] = [];
  if (!process.env[URL_VAR]) missing.push(URL_VAR);
  if (!process.env[SERVICE_KEY_VAR]) missing.push(SERVICE_KEY_VAR);
  return {
    ok: missing.length === 0,
    missing,
    url: process.env[URL_VAR],
  };
}

/**
 * Creates the service-role Supabase client.
 * Throws a clear, actionable error if env vars are missing.
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() was called in the browser. The service-role key " +
        "must stay server-side — only use it in Server Components or Server Actions."
    );
  }

  const { ok, missing } = getSupabaseEnvStatus();
  if (!ok) {
    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}. ` +
        `Add them to .env.local and restart the dev server. See SUPABASE_SETUP.md.`
    );
  }

  return createClient<Database>(
    process.env[URL_VAR]!,
    process.env[SERVICE_KEY_VAR]!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export type ConnectionCheck = {
  connected: boolean;
  /** Human-readable detail: success summary or the exact failure reason. */
  detail: string;
  leadCount: number | null;
};

/**
 * Tests connectivity to Supabase by counting rows in the `leads` table.
 * Never throws — returns a structured result for the diagnostics page.
 */
export async function checkSupabaseConnection(): Promise<ConnectionCheck> {
  const env = getSupabaseEnvStatus();
  if (!env.ok) {
    return {
      connected: false,
      detail: `Missing environment variable(s): ${env.missing.join(", ")}`,
      leadCount: null,
    };
  }

  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });

    if (error) {
      return {
        connected: false,
        detail: `${error.message}${error.hint ? ` — ${error.hint}` : ""}`,
        leadCount: null,
      };
    }

    return {
      connected: true,
      detail: `Connected to Supabase. The "leads" table is reachable.`,
      leadCount: count ?? 0,
    };
  } catch (e) {
    return {
      connected: false,
      detail: e instanceof Error ? e.message : "Unknown error",
      leadCount: null,
    };
  }
}
