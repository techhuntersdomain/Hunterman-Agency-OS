import type { Lead, BusinessResearch, DemoSite } from "@/lib/leads";
import { chooseTemplate } from "@/lib/demo-templates";

/**
 * v1 outreach draft writer — deterministic, template-based, no AI API required.
 *
 * Produces an honest, short German draft email from real lead/research/demo
 * data only. It NEVER invents ratings, reviews, awards, revenue, guarantees, or
 * specific website problems: website observations are emitted only when the
 * research probe actually detected the corresponding signal. The demo is always
 * described as a private, non-official draft. Output stays a draft — nothing is
 * sent here.
 */
export type OutreachDraft = {
  subject: string;
  body: string;
  /** Which real data points the draft was built from (for step traceability). */
  basedOn: string[];
};

/** Reads the website-probe signals stored in business_research.tech_stack. */
function techSignals(research: BusinessResearch | null): string[] {
  if (!research || !Array.isArray(research.tech_stack)) return [];
  return research.tech_stack.filter((s): s is string => typeof s === "string");
}

export function buildOutreachDraft(
  lead: Lead,
  research: BusinessResearch | null,
  demoSite: DemoSite | null
): OutreachDraft {
  const name = lead.business_name;
  const location = lead.location?.trim() || null;
  const trade = chooseTemplate(lead.industry).trade;
  const basedOn: string[] = ["business_name"];
  if (location) basedOn.push("location");

  const tech = techSignals(research);
  const hasWebsite = research ? research.has_website : Boolean(lead.website);
  const unreachable = tech.includes("unreachable");
  const noViewport = tech.includes("no-viewport");
  const hasViewport = tech.includes("has-viewport");

  // Website observation — only from detected signals, never invented.
  let observation: string;
  if (!hasWebsite) {
    observation = `Uns ist aufgefallen, dass ${name} aktuell noch keine eigene Website hat. Schon ein klarer, mobiler Online-Auftritt sorgt erfahrungsgemäß für mehr Sichtbarkeit und Anfragen.`;
    basedOn.push("no_website");
  } else if (unreachable) {
    observation = `Beim Aufruf Ihrer aktuellen Website gab es technische Probleme – sie war für uns nicht erreichbar. Das kann potenzielle Kundinnen und Kunden kosten, die online nach einem ${trade} suchen.`;
    basedOn.push("website_unreachable");
  } else if (noViewport) {
    observation = `Ihre aktuelle Website ist auf dem Smartphone nur eingeschränkt nutzbar. Da heute ein Großteil der Anfragen mobil entsteht, lohnt sich hier eine Optimierung besonders.`;
    basedOn.push("website_not_mobile");
  } else if (hasViewport) {
    observation = `Ihre Website haben wir uns kurz angesehen – mit ein paar gezielten Anpassungen lässt sich daraus noch mehr herausholen, gerade bei der Kundengewinnung.`;
    basedOn.push("website_ok");
  } else {
    observation = `Gerne zeigen wir Ihnen, wie sich der Online-Auftritt von ${name} gezielt verbessern lässt, um mehr passende Anfragen zu gewinnen.`;
    basedOn.push("website_generic");
  }

  // Optional demo mention — always framed as a private, non-official draft.
  const demoParagraph = demoSite
    ? `Für ${name} haben wir bereits einen unverbindlichen, privaten Website-Entwurf vorbereitet. Es handelt sich dabei ausdrücklich um einen Entwurf und keine offizielle Website – gerne zeigen wir ihn Ihnen.`
    : null;
  if (demoSite) basedOn.push("demo_draft");

  const intro = `wir von der Hunterman Agency unterstützen lokale Betriebe${
    location ? ` in ${location}` : ""
  } dabei, online besser gefunden zu werden und mehr Anfragen zu erhalten. Dabei sind wir auf ${name} aufmerksam geworden.`;

  const close = `Wenn das für Sie interessant klingt, genügt eine kurze Rückmeldung. In einem unverbindlichen Gespräch zeigen wir Ihnen schnell, was möglich ist.`;

  const body = [
    "Guten Tag,",
    intro,
    observation,
    demoParagraph,
    close,
    "Mit freundlichen Grüßen\nHunterman Agency",
  ]
    .filter(Boolean)
    .join("\n\n");

  // Subject — short, honest, varies with the strongest available hook.
  let subject: string;
  if (demoSite) {
    subject = `Website-Entwurf für ${name}`;
  } else if (!hasWebsite) {
    subject = `Mehr Anfragen für ${name} – Idee für Ihre Website`;
  } else {
    subject = `Kurzer Vorschlag für die Website von ${name}`;
  }

  return { subject, body, basedOn };
}
