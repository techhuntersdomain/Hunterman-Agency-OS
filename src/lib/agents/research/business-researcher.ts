import type { Json } from "@/types/database";
import type { Lead } from "@/lib/leads";
import type { ResearchFindings, ResearchProvider } from "./types";
import { websiteProvider } from "./website-probe";

/**
 * Active research providers, in run order. New real-data sources (Google
 * Places, SERP research, website audits, browser automation) plug in here by
 * implementing ResearchProvider and gating on isConfigured. A provider that
 * isn't configured (e.g. missing API key) is skipped, not fatal.
 */
const providers: ResearchProvider[] = [websiteProvider];

/**
 * Gathers research for a lead from available data + configured providers.
 * Never invents review/rating/competitor data — those stay null until a real
 * provider is connected, and the absence is recorded in market_notes.
 */
export async function runBusinessResearch(
  lead: Lead
): Promise<ResearchFindings> {
  const findings: ResearchFindings = {
    has_website: Boolean(lead.website && lead.website.trim()),
    current_website: lead.website,
    google_rating: null,
    review_count: null,
    competitors: [] as Json,
    tech_stack: [],
    market_notes: "",
    website_reachable: null,
    website_mobile_friendly: null,
    data_sources: [],
  };

  const noteLines: string[] = [];

  for (const provider of providers) {
    if (!provider.isConfigured(lead)) {
      noteLines.push(`${provider.name}: skipped (not applicable or not configured).`);
      continue;
    }
    try {
      const result = await provider.run(lead);
      Object.assign(findings, result.patch);
      noteLines.push(...result.notes);
      findings.data_sources.push(provider.name);
    } catch (e) {
      noteLines.push(
        `${provider.name}: error (${e instanceof Error ? e.message : "unknown"}).`
      );
    }
  }

  if (!findings.has_website) {
    noteLines.push("No website on file for this business.");
  }
  noteLines.push(
    "Google rating, review count, and competitors: no data source connected yet — left blank."
  );

  findings.market_notes = noteLines.join("\n");
  return findings;
}
