import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getLeadDetail } from "@/lib/leads";
import { statusColors, formatStatus } from "@/lib/lead-status";
import { EditLeadDialog } from "./edit-lead-dialog";

// Read live from Supabase on every request.
export const dynamic = "force-dynamic";

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function BackLink() {
  return (
    <Link
      href="/leads"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      ← Back to Leads
    </Link>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5 break-words">{empty ? "—" : value}</dd>
    </div>
  );
}

/** Card wrapper for a related-records section with a built-in empty state. */
function RelatedCard({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count: number;
  empty: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title}
          {count > 0 ? ` (${count})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <p className="text-sm text-muted-foreground py-1">{empty}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getLeadDetail(id);

  if (detail.error) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-700">
              Could not load lead
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-red-700">Supabase returned an error:</p>
            <pre className="rounded-md bg-red-100 p-3 text-xs text-red-800 whitespace-pre-wrap">
              {detail.error}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detail.lead) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="text-lg font-medium">Lead not found</p>
            <p className="text-sm mt-1">
              This lead does not exist or may have been deleted.
            </p>
            <Link href="/leads" className="text-sm underline mt-3 inline-block">
              Back to Leads
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { lead, research, demoSites, outreachMessages, workflows, activity } =
    detail;

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">
              {lead.business_name}
            </h2>
            <Badge className={cn(statusColors[lead.status])} variant="secondary">
              {formatStatus(lead.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {lead.industry || "—"}
            {lead.location ? ` · ${lead.location}` : ""}
            {lead.score !== null ? ` · Score ${lead.score}/100` : ""}
          </p>
        </div>
        <EditLeadDialog lead={lead} />
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Field label="Business Name" value={lead.business_name} />
            <Field label="Status" value={formatStatus(lead.status)} />
            <Field
              label="Score"
              value={lead.score !== null ? `${lead.score}/100` : null}
            />
            <Field label="Industry" value={lead.industry} />
            <Field label="Location" value={lead.location} />
            <Field label="Contact Name" value={lead.contact_name} />
            <Field
              label="Email"
              value={
                lead.email ? (
                  <a className="underline" href={`mailto:${lead.email}`}>
                    {lead.email}
                  </a>
                ) : null
              }
            />
            <Field label="Phone" value={lead.phone} />
            <Field
              label="Website"
              value={
                lead.website ? (
                  <a
                    className="underline"
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {lead.website}
                  </a>
                ) : null
              }
            />
            <Field label="Source" value={lead.source} />
            <Field label="Created" value={fmtDate(lead.created_at)} />
            <Field label="Updated" value={fmtDate(lead.updated_at)} />
          </dl>
          {lead.notes && (
            <div className="mt-4">
              <dt className="text-xs text-muted-foreground">Notes</dt>
              <dd className="text-sm mt-0.5 whitespace-pre-wrap">
                {lead.notes}
              </dd>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Research */}
      <RelatedCard
        title="Business Research"
        count={research.length}
        empty="No research recorded for this lead yet. (The research agent isn't built yet.)"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Website</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Researched</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {research.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">
                  {r.has_website ? r.current_website || "Yes" : "No"}
                </TableCell>
                <TableCell className="text-sm">
                  {r.google_rating ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {r.review_count ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {r.market_notes || "—"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(r.researched_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RelatedCard>

      {/* Demo Sites */}
      <RelatedCard
        title="Demo Sites"
        count={demoSites.length}
        empty="No demo sites for this lead yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demoSites.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-sm">{d.template || "—"}</TableCell>
                <TableCell className="text-sm">{d.status}</TableCell>
                <TableCell className="text-sm">
                  {d.url ? (
                    <a
                      className="underline"
                      href={d.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {d.url}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(d.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RelatedCard>

      {/* Outreach Messages */}
      <RelatedCard
        title="Outreach Messages"
        count={outreachMessages.length}
        empty="No outreach messages for this lead yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Channel</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outreachMessages.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm">{m.channel}</TableCell>
                <TableCell className="text-sm">{m.subject || "—"}</TableCell>
                <TableCell className="text-sm">{m.status}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {fmtDate(m.created_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </RelatedCard>

      {/* Workflows & Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflows &amp; Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Workflows</h4>
            {workflows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No workflows for this lead yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm">{w.name}</TableCell>
                      <TableCell className="text-sm">{w.status}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fmtDate(w.started_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity logged for this lead yet.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {activity.map((a) => (
                  <li key={a.id} className="flex justify-between gap-4">
                    <span>
                      {a.action}
                      {a.actor ? ` · ${a.actor}` : ""}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {fmtDate(a.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
