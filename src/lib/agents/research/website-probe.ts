import type { Lead } from "@/lib/leads";
import type { ProviderResult, ResearchProvider } from "./types";

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * The only real data source wired in v1. No API key required. It runs only when
 * the lead has a website, fetches it once (with a timeout), and reports basic,
 * easy-to-detect signals: reachability, mobile viewport, and obvious platform
 * markers. It does not invent reviews, ratings, or competitor data.
 */
export const websiteProvider: ResearchProvider = {
  name: "website-probe",
  isConfigured: (lead) => Boolean(lead.website && lead.website.trim()),
  run: async (lead: Lead): Promise<ProviderResult> => {
    const url = normalizeUrl(lead.website as string);
    const signals: string[] = [];
    const notes: string[] = [];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: { "user-agent": "HuntermanOS-ResearchBot/0.1" },
      });

      const reachable = res.ok;
      let mobileFriendly: boolean | null = null;

      if (reachable) {
        const html = (await res.text()).slice(0, 200_000);
        mobileFriendly = /<meta[^>]+name=["']viewport["']/i.test(html);
        signals.push(mobileFriendly ? "has-viewport" : "no-viewport");
        if (/wp-content|wp-includes|wordpress/i.test(html)) signals.push("wordpress");
        if (/wixstatic|wix\.com/i.test(html)) signals.push("wix");
        if (/squarespace/i.test(html)) signals.push("squarespace");
        if (/cdn\.shopify|shopify/i.test(html)) signals.push("shopify");
        const gen = html.match(
          /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i
        );
        if (gen) signals.push(`generator:${gen[1].split(/[\s\d]/)[0].toLowerCase()}`);

        const platform = signals.filter((s) => !s.includes("viewport"));
        notes.push(
          `Website reachable (HTTP ${res.status}); ${
            mobileFriendly ? "has" : "missing"
          } mobile viewport${platform.length ? `; signals: ${platform.join(", ")}` : ""}.`
        );
      } else {
        signals.push("unreachable");
        notes.push(`Website returned HTTP ${res.status} — treated as not reachable.`);
      }

      return {
        patch: {
          website_reachable: reachable,
          website_mobile_friendly: mobileFriendly,
          tech_stack: signals,
        },
        notes,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown error";
      return {
        patch: {
          website_reachable: false,
          website_mobile_friendly: null,
          tech_stack: ["unreachable"],
        },
        notes: [`Website probe failed for ${url}: ${msg}.`],
      };
    } finally {
      clearTimeout(timeout);
    }
  },
};
