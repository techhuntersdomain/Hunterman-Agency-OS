import type { Lead } from "@/lib/leads";
import type { LeadStatus } from "@/types/database";
import type { ResearchFindings } from "./types";

/** Target cities from the ICP (lowercased, incl. common spellings). */
const TARGET_CITIES = [
  "berlin",
  "hamburg",
  "munich",
  "münchen",
  "muenchen",
  "cologne",
  "köln",
  "koeln",
  "düsseldorf",
  "dusseldorf",
  "duesseldorf",
  "frankfurt",
  "stuttgart",
  "leipzig",
  "dortmund",
  "essen",
];

/** Target industry keywords (German + English) from the ICP. */
const TARGET_INDUSTRY_KEYWORDS = [
  "clean",
  "reinigung",
  "paint",
  "maler",
  "electr",
  "elektr",
  "plumb",
  "sanitär",
  "sanitar",
  "heizung",
  "hvac",
  "garten",
  "landscap",
  "umzug",
  "moving",
  "dach",
  "roof",
  "contractor",
  "handwerk",
];

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export type ScoreResult = {
  score: number;
  status: LeadStatus;
  rationale: string[];
};

/**
 * Deterministic v1 lead score (0–100), based ONLY on data we actually have.
 * Easy to adjust: each rule adds a fixed number of points with a rationale.
 *
 * Status mapping:
 *   >= 70  -> qualified
 *   40–69  -> researching
 *   < 40   -> new (kept visible for human review; never auto-archived/deleted)
 */
export function scoreLead(lead: Lead, f: ResearchFindings): ScoreResult {
  const rationale: string[] = [];
  let score = 0;

  // Website state — the core opportunity signal for this business model.
  if (!f.has_website) {
    score += 35;
    rationale.push("No website (+35)");
  } else if (f.website_reachable === false) {
    score += 25;
    rationale.push("Website present but unreachable (+25)");
  } else if (f.website_mobile_friendly === false) {
    score += 20;
    rationale.push("Website reachable but not mobile-friendly (+20)");
  } else if (f.website_reachable === true) {
    score += 5;
    rationale.push("Website reachable & modern (+5)");
  } else {
    score += 10;
    rationale.push("Website on file but not probed (+10)");
  }

  // Contact info — can we actually reach them?
  if (lead.phone) {
    score += 10;
    rationale.push("Has phone (+10)");
  }
  if (lead.email) {
    score += 5;
    rationale.push("Has email (+5)");
  }

  // Target fit — industry.
  const industry = (lead.industry ?? "").toLowerCase();
  if (industry && includesAny(industry, TARGET_INDUSTRY_KEYWORDS)) {
    score += 20;
    rationale.push("Target industry (+20)");
  } else if (industry) {
    score += 5;
    rationale.push("Industry present, non-target (+5)");
  }

  // Target fit — location.
  const location = (lead.location ?? "").toLowerCase();
  if (location && includesAny(location, TARGET_CITIES)) {
    score += 15;
    rationale.push("Target city (+15)");
  } else if (location) {
    score += 5;
    rationale.push("Location present, non-target (+5)");
  }

  // Existing notes hinting at a weak/missing site.
  const notes = (lead.notes ?? "").toLowerCase();
  if (
    notes &&
    /(no website|without (a )?website|outdated|old site|weak|veraltet|keine website)/.test(
      notes
    )
  ) {
    score += 5;
    rationale.push("Notes indicate weak/missing site (+5)");
  }

  // Review data — ONLY counts if real data exists in research (null until a
  // reviews provider is connected).
  if (f.google_rating != null && f.google_rating > 4.0) {
    score += 10;
    rationale.push("Google rating > 4.0 (+10)");
  }
  if (f.review_count != null && f.review_count >= 20 && f.review_count <= 200) {
    score += 10;
    rationale.push("Review count in 20–200 (+10)");
  }

  score = Math.min(100, score);

  let status: LeadStatus;
  if (score >= 70) status = "qualified";
  else if (score >= 40) status = "researching";
  else status = "new";

  return { score, status, rationale };
}
