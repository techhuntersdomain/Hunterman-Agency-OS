import type { Lead, BusinessResearch } from "@/lib/leads";

/**
 * v1 demo-site template registry.
 *
 * Each template is a thin, niche-specific scaffold — German trade label, a
 * generic tagline, and *industry-typical* service categories. It deliberately
 * does NOT assert facts about a specific business: services are framed as
 * "typical for this trade, to be confirmed", and any real values (name,
 * location, contact) are filled from lead/research data only. There is no AI
 * generation and no production site here yet.
 */
export type DemoTemplate = {
  /** Stable key, also stored in demo_sites.template. */
  slug: string;
  /** Internal label for the dashboard UI (English). */
  label: string;
  /** German trade noun used in headings, e.g. "Malerbetrieb". */
  trade: string;
  /** Industry keywords (DE + EN) used to auto-select this template. */
  keywords: string[];
  /** Generic German tagline for the hero subhead. */
  tagline: string;
  /**
   * Industry-typical service categories (German). These are NOT claims that
   * this specific business offers them — the preview renders them under a
   * "typical for this trade, confirmed after approval" framing.
   */
  typicalServices: string[];
};

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    slug: "cleaning",
    label: "Cleaning / Gebäudereinigung",
    trade: "Reinigungsbetrieb",
    keywords: ["clean", "reinigung", "gebäudereinigung", "gebaeudereinigung"],
    tagline: "Zuverlässige Reinigung für Gewerbe und Privat.",
    typicalServices: [
      "Unterhaltsreinigung",
      "Grundreinigung",
      "Fensterreinigung",
      "Büro- und Praxisreinigung",
    ],
  },
  {
    slug: "painting",
    label: "Painting / Maler",
    trade: "Malerbetrieb",
    keywords: ["paint", "maler", "malerei", "anstrich", "lackier"],
    tagline: "Saubere Malerarbeiten für innen und außen.",
    typicalServices: [
      "Innenanstrich",
      "Fassadenanstrich",
      "Tapezierarbeiten",
      "Lackierarbeiten",
    ],
  },
  {
    slug: "electrician",
    label: "Electrician / Elektro",
    trade: "Elektrobetrieb",
    keywords: ["electr", "elektr"],
    tagline: "Elektrotechnik vom Fachbetrieb.",
    typicalServices: [
      "Elektroinstallation",
      "Reparaturen & Störungsdienst",
      "Beleuchtung",
      "Zählerschrank & Verteiler",
    ],
  },
  {
    slug: "moving",
    label: "Moving / Umzug",
    trade: "Umzugsunternehmen",
    keywords: ["umzug", "moving", "transport", "spedition"],
    tagline: "Stressfrei umziehen – privat und gewerblich.",
    typicalServices: [
      "Privatumzüge",
      "Firmenumzüge",
      "Möbelmontage",
      "Ein- und Auspackservice",
    ],
  },
  {
    slug: "roofing",
    label: "Roofing / Dachdecker",
    trade: "Dachdeckerbetrieb",
    keywords: ["roof", "dach", "dachdecker", "bedachung"],
    tagline: "Dacharbeiten vom Meisterbetrieb.",
    typicalServices: [
      "Dacheindeckung",
      "Dachreparatur",
      "Abdichtung",
      "Dachrinnen & Spenglerarbeiten",
    ],
  },
  {
    slug: "landscaping",
    label: "Landscaping / Garten",
    trade: "Garten- und Landschaftsbau",
    keywords: ["garten", "landscap", "galabau", "gala-bau"],
    tagline: "Gartengestaltung und -pflege aus einer Hand.",
    typicalServices: [
      "Gartenpflege",
      "Pflasterarbeiten",
      "Bepflanzung",
      "Zaun- und Wegebau",
    ],
  },
  {
    slug: "plumbing-hvac",
    label: "Plumbing / HVAC – Sanitär & Heizung",
    trade: "Sanitär- und Heizungsbetrieb",
    keywords: [
      "plumb",
      "sanitär",
      "sanitar",
      "heizung",
      "hvac",
      "klima",
      "shk",
    ],
    tagline: "Sanitär, Heizung und Klima vom Fachbetrieb.",
    typicalServices: [
      "Sanitärinstallation",
      "Heizungsinstallation",
      "Badsanierung",
      "Wartung & Notdienst",
    ],
  },
  {
    slug: "generic",
    label: "Generic service business",
    trade: "Dienstleistungsbetrieb",
    keywords: [],
    tagline: "Ihr zuverlässiger Partner aus der Region.",
    typicalServices: ["Beratung", "Ausführung", "Service & Wartung"],
  },
];

const GENERIC_TEMPLATE = DEMO_TEMPLATES.find((t) => t.slug === "generic")!;

/** Looks up a template by its slug; falls back to the generic template. */
export function getTemplate(slug: string | null | undefined): DemoTemplate {
  return DEMO_TEMPLATES.find((t) => t.slug === slug) ?? GENERIC_TEMPLATE;
}

/**
 * Picks the best template for a lead by matching its (free-text) industry
 * against each template's keywords. Falls back to the generic template when
 * nothing matches — never guesses a specific trade.
 */
export function chooseTemplate(industry: string | null): DemoTemplate {
  const hay = (industry ?? "").toLowerCase();
  if (!hay.trim()) return GENERIC_TEMPLATE;
  for (const template of DEMO_TEMPLATES) {
    if (template.keywords.some((k) => hay.includes(k))) return template;
  }
  return GENERIC_TEMPLATE;
}

/**
 * Structured, render-ready content for a demo draft. Every field is either
 * generic template copy or a real value from the lead/research — nothing about
 * the specific business is invented (no reviews, awards, team, guarantees).
 */
export type DemoContent = {
  template: DemoTemplate;
  businessName: string;
  location: string | null;
  heroHeadline: string;
  heroSubhead: string;
  /** Industry-typical services (template-provided, framed as "to confirm"). */
  services: string[];
  contact: {
    phone: string | null;
    email: string | null;
    website: string | null;
  };
  /** Whether a website was found in research (used for an honest "online" note). */
  hasExistingWebsite: boolean;
};

/** Builds render-ready draft content from real lead/research data + a template. */
export function buildDemoContent(
  lead: Lead,
  research: BusinessResearch | null,
  template: DemoTemplate
): DemoContent {
  const location = lead.location?.trim() || null;
  const heroSubhead = location
    ? `Ihr ${template.trade} in ${location}. ${template.tagline}`
    : `${template.trade} aus der Region. ${template.tagline}`;

  return {
    template,
    businessName: lead.business_name,
    location,
    heroHeadline: lead.business_name,
    heroSubhead,
    services: template.typicalServices,
    contact: {
      phone: lead.phone?.trim() || null,
      email: lead.email?.trim() || null,
      website: lead.website?.trim() || null,
    },
    hasExistingWebsite: Boolean(research?.has_website ?? lead.website),
  };
}
