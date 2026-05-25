import type { Lead, BusinessResearch } from "@/lib/leads";

/**
 * v1 demo-site template registry.
 *
 * Each template is a niche-specific scaffold — German trade label, a generic
 * persuasive pitch, and *industry-typical* service categories. It deliberately
 * does NOT assert facts about a specific business: services are framed as
 * "typical for this trade, to be confirmed", and any real values (name,
 * location, contact) are filled from lead/research data only. There is no AI
 * generation and no production site here yet.
 *
 * Copy guardrails — generic copy may sell trust, professionalism, local
 * authority and easy contact, but must never invent: years in business, team
 * size, certifications, ratings, reviews, awards, guarantees, or specific
 * services not supported by the data.
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
  /** Short generic German tagline (eyebrow / supporting line). */
  tagline: string;
  /** Stronger generic German hero pitch — persuasive, no fabricated facts. */
  heroPitch: string;
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
    heroPitch:
      "Saubere Räume ohne Aufwand – zuverlässige Reinigung für Gewerbe und Privat, persönlich abgestimmt.",
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
    heroPitch:
      "Frische Farbe, sauber umgesetzt – für Innenräume und Fassaden, mit Sorgfalt und festem Ansprechpartner.",
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
    heroPitch:
      "Elektroarbeiten vom Fachbetrieb – sicher und fachgerecht umgesetzt, von der Anfrage bis zur Abnahme.",
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
    heroPitch:
      "Entspannt umziehen – sorgfältig geplant und zuverlässig umgesetzt, für Privat und Gewerbe.",
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
    tagline: "Dacharbeiten vom Fachbetrieb.",
    heroPitch:
      "Ein dichtes Dach in guten Händen – Eindeckung, Reparatur und Wartung vom Fachbetrieb.",
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
    heroPitch:
      "Ihr Garten in guten Händen – Gestaltung und Pflege aus einer Hand, von der Planung bis zur Umsetzung.",
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
    heroPitch:
      "Wärme und Wasser, auf die Sie sich verlassen können – Sanitär und Heizung vom Fachbetrieb.",
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
    heroPitch:
      "Ein verlässlicher Partner aus Ihrer Region – persönlich, professionell und gut erreichbar.",
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

export type TrustPoint = { title: string; body: string };

/**
 * Structured, render-ready content for a demo draft. Every field is either
 * generic template copy or a real value from the lead/research — nothing about
 * the specific business is invented (no reviews, awards, team, guarantees).
 */
export type DemoContent = {
  template: DemoTemplate;
  businessName: string;
  location: string | null;
  /** Eyebrow line above the headline, e.g. "Malerbetrieb · Düsseldorf". */
  eyebrow: string;
  heroHeadline: string;
  heroPitch: string;
  /** Short generic, location-aware value chips shown under the hero. */
  valueProps: string[];
  serviceIntro: string;
  /** Industry-typical services (template-provided, framed as "to confirm"). */
  services: string[];
  trustHeading: string;
  /** Generic, process-focused trust points — never fabricated credentials. */
  trustPoints: TrustPoint[];
  ctaHeading: string;
  ctaBody: string;
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
  const regionLabel = location ? `${location} und Umgebung` : "Ihre Region";

  const valueProps = [
    location ? `Aus ${location} und Umgebung` : "Aus Ihrer Region",
    "Persönliche Beratung",
    "Unkomplizierte Terminabsprache",
  ];

  const trustPoints: TrustPoint[] = [
    {
      title: "Direkter Kontakt",
      body: "Ihre Anfrage geht direkt an den Betrieb – persönlich und ohne Umwege.",
    },
    {
      title: "Klare Absprachen",
      body: "Ablauf, Termine und Umfang besprechen wir vorab verständlich und transparent.",
    },
    {
      title: "Lokal verankert",
      body: location
        ? `Ein Betrieb aus ${location}, der die Region und ihre Anforderungen kennt.`
        : "Ein regionaler Betrieb, der Ihre Region und ihre Anforderungen kennt.",
    },
  ];

  return {
    template,
    businessName: lead.business_name,
    location,
    eyebrow: location ? `${template.trade} · ${location}` : template.trade,
    heroHeadline: lead.business_name,
    heroPitch: template.heroPitch,
    valueProps,
    serviceIntro: `Branchentypische Leistungen eines ${template.trade}s in ${regionLabel}. Die konkreten Angebote stimmen wir nach Freigabe gemeinsam ab.`,
    services: template.typicalServices,
    trustHeading: "Was Sie erwarten können",
    trustPoints,
    ctaHeading: "Jetzt unverbindlich anfragen",
    ctaBody:
      "Schildern Sie kurz Ihr Anliegen – Sie erhalten eine persönliche Rückmeldung.",
    contact: {
      phone: lead.phone?.trim() || null,
      email: lead.email?.trim() || null,
      website: lead.website?.trim() || null,
    },
    hasExistingWebsite: Boolean(research?.has_website ?? lead.website),
  };
}
