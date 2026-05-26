import type { LeadDetail } from "@/lib/leads";

/**
 * Pipeline readiness derived purely from a lead's existing records — no fake
 * data, no side effects. Drives the lead detail "Pipeline" panel: what's done,
 * what the current stage is, and the next recommended action.
 */

export type StageStatus = "done" | "approved" | "pending" | "missing";

export type NextActionKey =
  | "research"
  | "demo"
  | "outreach"
  | "approve"
  | "ready"
  | "none";

export type PipelineSummary = {
  research: StageStatus;
  demo: StageStatus;
  /** Whether an outreach draft has been written at all. */
  outreach: StageStatus;
  /** Approval gate: approved once a message moves past `draft`. */
  approval: StageStatus;
  next: { key: NextActionKey; label: string; description: string };
};

/** Lead statuses with no active pipeline next-action. */
const TERMINAL_STATUSES = new Set(["won", "lost", "dormant"]);

export function derivePipeline(detail: {
  lead: NonNullable<LeadDetail["lead"]>;
  research: LeadDetail["research"];
  demoSites: LeadDetail["demoSites"];
  outreachMessages: LeadDetail["outreachMessages"];
}): PipelineSummary {
  const hasResearch = detail.research.length > 0;
  const hasDemo = detail.demoSites.length > 0;
  const messages = detail.outreachMessages;
  const hasOutreach = messages.length > 0;
  // Any message past `draft` has cleared the approval gate (scheduled, etc.).
  const hasApproved = messages.some((m) => m.status !== "draft");
  const hasDraft = messages.some((m) => m.status === "draft");

  const research: StageStatus = hasResearch ? "done" : "missing";
  const demo: StageStatus = hasDemo ? "done" : "missing";
  const outreach: StageStatus = hasOutreach ? "done" : "missing";
  const approval: StageStatus = hasApproved
    ? "approved"
    : hasDraft
      ? "pending"
      : "missing";

  let next: PipelineSummary["next"];
  if (TERMINAL_STATUSES.has(detail.lead.status)) {
    next = {
      key: "none",
      label: "No active next action",
      description: `This lead is ${detail.lead.status}. The pipeline is closed for now.`,
    };
  } else if (!hasResearch) {
    next = {
      key: "research",
      label: "Run Research",
      description:
        "Gather business research and a lead score to qualify this lead.",
    };
  } else if (!hasDemo) {
    next = {
      key: "demo",
      label: "Create Demo Draft",
      description: "Generate a private demo-site draft from the research.",
    };
  } else if (!hasOutreach) {
    next = {
      key: "outreach",
      label: "Create Outreach Draft",
      description:
        "Write a first outreach draft based on the demo and research.",
    };
  } else if (!hasApproved) {
    next = {
      key: "approve",
      label: "Review / approve outreach draft",
      description: "Review the draft below, edit if needed, then approve it.",
    };
  } else {
    next = {
      key: "ready",
      label: "Ready for sending later",
      description:
        "Outreach is approved. Nothing is sent yet — there is no send action.",
    };
  }

  return { research, demo, outreach, approval, next };
}
