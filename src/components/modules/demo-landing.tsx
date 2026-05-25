import type { DemoContent } from "@/lib/demo-templates";

/**
 * Presentational render of a v1 demo-site draft. Pure layout over `DemoContent`
 * — it renders only the real values and generic template copy passed in, and
 * invents nothing (no reviews, awards, team, guarantees, or specific claims).
 * Service items are explicitly framed as industry-typical and "to be
 * confirmed", never as confirmed offerings of this business.
 */
export function DemoLanding({ content }: { content: DemoContent }) {
  const { businessName, location, heroHeadline, heroSubhead, services, contact } =
    content;

  return (
    <div className="bg-white text-slate-900">
      {/* Hero */}
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-widest text-slate-400">
            {content.template.trade}
            {location ? ` · ${location}` : ""}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {heroSubhead}
          </p>
          <a
            href="#kontakt"
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Kontakt aufnehmen
          </a>
        </div>
      </header>

      {/* Services — industry-typical, framed as to-confirm */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h2 className="text-2xl font-bold">Leistungen</h2>
        <p className="mt-1 text-sm text-slate-500">
          Branchentypische Leistungen — die konkreten Angebote werden nach
          Freigabe gemeinsam abgestimmt.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <li
              key={service}
              className="rounded-lg border border-slate-200 p-4 text-sm font-medium"
            >
              {service}
            </li>
          ))}
        </ul>
      </section>

      {/* Contact — only real values; placeholders are clearly marked */}
      <section id="kontakt" className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-2xl font-bold">Kontakt</h2>
          <p className="mt-1 text-sm text-slate-500">
            {businessName}
            {location ? ` · ${location}` : ""}
          </p>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex gap-3">
              <dt className="w-24 text-slate-500">Telefon</dt>
              <dd>{contact.phone ?? "wird nach Freigabe ergänzt"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 text-slate-500">E-Mail</dt>
              <dd>{contact.email ?? "wird nach Freigabe ergänzt"}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-24 text-slate-500">Website</dt>
              <dd>{contact.website ?? "wird nach Freigabe ergänzt"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Footer with the required draft disclaimers */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl space-y-1 px-6 py-8 text-xs text-slate-500">
          <p>
            Dies ist ein unverbindlicher, privater Website-Entwurf und keine
            offizielle Website des Unternehmens.
          </p>
          <p>
            Impressum und Datenschutzerklärung werden nach Freigabe final
            ergänzt.
          </p>
        </div>
      </footer>
    </div>
  );
}
