import type { Json } from "@/types/database";
import type { Lead } from "@/lib/leads";

/**
 * Findings produced by the business-researcher. The first group maps directly
 * to `business_research` columns; the helper signals below are used by the
 * scorer but are not persisted as their own columns.
 */
export type ResearchFindings = {
  has_website: boolean;
  current_website: string | null;
  google_rating: number | null;
  review_count: number | null;
  competitors: Json;
  tech_stack: string[];
  market_notes: string;

  // Helper signals (not stored as columns) — consumed by the scorer:
  website_reachable: boolean | null;
  website_mobile_friendly: boolean | null;
  /** Names of providers that actually contributed data this run. */
  data_sources: string[];
};

export type ProviderResult = {
  /** Partial findings this provider contributes (merged into the base). */
  patch: Partial<ResearchFindings>;
  /** Human-readable lines describing what was (or wasn't) found. */
  notes: string[];
};

/**
 * A research data source. v1 ships only the website probe. Future providers
 * (Google Places, SERP, website audits, browser automation) implement this
 * interface and gate on `isConfigured` — e.g. returning false when an API key
 * is missing, so the feature still runs on available data instead of blocking.
 */
export interface ResearchProvider {
  name: string;
  isConfigured(lead: Lead): boolean;
  run(lead: Lead): Promise<ProviderResult>;
}
