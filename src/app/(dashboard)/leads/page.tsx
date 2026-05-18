import { getLeads } from "@/lib/leads";
import { LeadsClient } from "./leads-client";

// Leads are read from Supabase on every request — never statically cached.
export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const { data, error } = await getLeads();

  return <LeadsClient leads={data} loadError={error} />;
}
