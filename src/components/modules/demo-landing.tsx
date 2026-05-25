import type { DemoContent } from "@/lib/demo-templates";

/**
 * Presentational render of a v1 demo-site draft. Pure layout over `DemoContent`
 * — it renders only the real values and generic template copy passed in, and
 * invents nothing (no reviews, awards, team, guarantees, or specific claims).
 * Service items are explicitly framed as industry-typical and "to be
 * confirmed", never as confirmed offerings of this business. Contact links use
 * the real phone/email when present — they are standard affordances, not
 * outreach; nothing is sent automatically.
 */
export function DemoLanding({ content }: { content: DemoContent }) {
  const {
    businessName,
    location,
    eyebrow,
    heroHeadline,
    heroPitch,
    valueProps,
    serviceIntro,
    services,
    trustHeading,
    trustPoints,
    ctaHeading,
    ctaBody,
    contact,
  } = content;

  const hasContact = Boolean(contact.phone || contact.email);

  return (
    <div className="bg-white text-slate-900">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {heroHeadline}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            {heroPitch}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Jetzt anrufen
              </a>
            )}
            <a
              href="#kontakt"
              className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Kontakt aufnehmen
            </a>
          </div>

          {/* Generic, location-aware value chips */}
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
            {valueProps.map((prop) => (
              <li key={prop} className="flex items-center gap-2">
                <span aria-hidden className="text-slate-500">
                  ✓
                </span>
                {prop}
              </li>
            ))}
          </ul>
        </div>
      </header>

      {/* Services — industry-typical, framed as to-confirm */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="text-2xl font-bold sm:text-3xl">Leistungen</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
          {serviceIntro}
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <li
              key={service}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 text-sm font-medium"
            >
              {service}
            </li>
          ))}
        </ul>
      </section>

      {/* Trust / professionalism — generic, process-focused, no fabrication */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <h2 className="text-2xl font-bold sm:text-3xl">{trustHeading}</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {trustPoints.map((point) => (
              <div key={point.title}>
                <h3 className="text-base font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {point.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA — only real values; placeholders are clearly marked */}
      <section id="kontakt" className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{ctaHeading}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              {ctaBody}
            </p>
            {hasContact && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Anrufen
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    E-Mail schreiben
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <p className="text-sm font-semibold">
              {businessName}
              {location ? ` · ${location}` : ""}
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">Telefon</dt>
                <dd>
                  {contact.phone ? (
                    <a
                      className="underline"
                      href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                    >
                      {contact.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400">
                      wird nach Freigabe ergänzt
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">E-Mail</dt>
                <dd>
                  {contact.email ? (
                    <a className="underline" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-slate-400">
                      wird nach Freigabe ergänzt
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-24 shrink-0 text-slate-500">Website</dt>
                <dd className="break-all">
                  {contact.website ?? (
                    <span className="text-slate-400">
                      wird nach Freigabe ergänzt
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Footer with the required draft disclaimers (verbatim) */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl space-y-1 px-6 py-8 text-xs text-slate-500">
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
