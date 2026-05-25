import Link from "next/link";
import { getDemoSiteDetail } from "@/lib/demo-sites";
import { getTemplate, buildDemoContent } from "@/lib/demo-templates";
import { DemoLanding } from "@/components/modules/demo-landing";

// Read live from Supabase on every request.
export const dynamic = "force-dynamic";

/**
 * Private, internal preview of a demo-site draft. This route lives outside the
 * (dashboard) group, so it renders without the app sidebar — a clean preview of
 * the draft landing page. It is for internal review only: not a published site,
 * nothing is sent to the lead, and the required draft disclaimers are shown.
 */
export default async function DemoSitePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { demoSite, lead, research, error } = await getDemoSiteDetail(id);

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="text-lg font-semibold text-red-700">
          Could not load demo draft
        </h1>
        <pre className="mt-3 whitespace-pre-wrap rounded-md bg-red-50 p-3 text-xs text-red-800">
          {error}
        </pre>
      </div>
    );
  }

  if (!demoSite || !lead) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <h1 className="text-lg font-semibold">Demo draft not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This draft does not exist or may have been deleted.
        </p>
      </div>
    );
  }

  const template = getTemplate(demoSite.template);
  const content = buildDemoContent(lead, research, template);

  return (
    <div className="min-h-full">
      {/* Internal preview banner — not part of the rendered site */}
      <div className="border-b border-amber-300 bg-amber-50 px-6 py-3 text-amber-900">
        <div className="mx-auto flex max-w-4xl flex-col gap-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold uppercase tracking-wide">
              Interner Entwurf · Private Preview · Vorlage: {template.label}
            </span>
            <Link
              href={`/leads/${lead.id}`}
              className="text-xs underline whitespace-nowrap"
            >
              ← Zurück zum Lead
            </Link>
          </div>
          <p className="text-xs">
            Dies ist ein unverbindlicher, privater Website-Entwurf und keine
            offizielle Website des Unternehmens.
          </p>
          <p className="text-xs">
            Impressum und Datenschutzerklärung werden nach Freigabe final
            ergänzt.
          </p>
        </div>
      </div>

      <DemoLanding content={content} />
    </div>
  );
}
