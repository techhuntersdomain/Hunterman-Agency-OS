# Next Build Sequence — Hunterman Agency OS

> **Status:** v1 roadmap · Last updated 2026-05-22
> **Sources:** Grounded in `hunterman_agency_os_assets_and_references.md` and
> `hunterman_agency_os_master_context.md` (owner's Downloads).
> **Principle:** incremental, modular, pragmatic, operational. No
> overengineering, no speculative features, no premature automation.

---

## Where we are now (baseline)

Already built and verified:
- Next.js 16 + TypeScript + Tailwind + shadcn/ui app scaffold
- Live Supabase database with the full schema migrated (9 tables, RLS enabled)
- Leads system end-to-end: list, add, update status, delete — live CRUD
- Database health/diagnostics page (`/health`) — connection verified green
- Sample seed data loaded; committed to GitHub and pushed
- Orchestrator/agent foundation exists as **structure only** (types, registry,
  pipeline-runner) — no real agent logic yet

Not built yet: lead detail pages, real workflow UI, any agent logic, demo
templates, outreach flow, Hermes, auth, deployment.

---

## The sequence

Each step lists a **goal**, **scope** (what to actually build), and
**done-when** criteria. Build in order; each step should be usable before
moving on.

### 1. Memory architecture & pipeline docs ✅ (this step)
- **Goal:** Lock the blueprint before adding automation.
- **Scope:** `docs/architecture/memory-architecture.md`,
  `docs/pipelines/local-growth-pipeline-v1.md`, this roadmap.
- **Done when:** Docs exist, reviewed, and agreed. *(Complete.)*

### 2. Lead detail pages
- **Goal:** Click a lead → see and edit everything about it.
- **Scope:** Dynamic route `/(dashboard)/leads/[id]`. Show full lead record,
  editable fields, status history, and placeholders for related
  `business_research`, `demo_sites`, and `outreach_messages` (read from Supabase
  by `lead_id`). Reuse the existing server-action pattern.
- **Done when:** Any lead opens to a detail page; fields edit and persist live.

### 3. Real workflow UI
- **Goal:** See and move leads through the pipeline visually.
- **Scope:** Replace the static Pipeline/Workflows placeholder pages with a real
  board driven by `lead_status` (and `workflows`/`workflow_steps`). Show stage
  columns (new → researching → qualified → demo_ready → outreach → negotiating →
  won), counts, and the ability to advance a lead's stage.
- **Done when:** The pipeline board reflects live data and stage changes persist.

### 4. Research / scoring agent scaffolding
- **Goal:** First real agent — turn the registry into working logic.
- **Scope:** Implement the **Business Research Agent** behind a server action /
  workflow step. Input: a lead. Output: a `business_research` row + a `score`
  written to `leads`. Keep the scoring rubric in Obsidian; the agent applies it.
  Model-agnostic interface (no hard vendor lock-in). **Drafts only — no external
  calls that contact the business.**
- **Done when:** Running it on a lead produces a stored research record + score,
  logged to `activity_log`.

### 5. Demo site template system
- **Goal:** Generate private demo sites from reusable templates.
- **Scope:** Start with 1–2 templates (Cleaner, Electrician) at Level 1
  (Essential: one-page, trust-focused, fast). Inject business data; render a
  private preview. **Every template must include the required German disclaimer
  and the legal placeholder** (see pipeline doc). Record in `demo_sites`.
- **Done when:** A lead can produce a private demo with disclaimers, status
  tracked. **Publishing stays behind a human gate.**

### 6. Outreach drafting & approval flow
- **Goal:** Draft outreach, never auto-send.
- **Scope:** **Outreach Writer Agent** drafts per-channel messages (phone script,
  WhatsApp, email) following the Obsidian messaging playbook. Store as
  `outreach_messages` with status `draft`. Build a review UI where a human edits
  and explicitly approves; only then mark `scheduled`/`sent` (sending itself is
  manual in v1). Respect channel order: phone → WhatsApp → LinkedIn/Xing →
  Facebook → email.
- **Done when:** Drafts are generated, reviewable, and require explicit human
  approval before any "sent" state.

### 7. Hermes dashboard console
- **Goal:** A single operational cockpit above the pipeline.
- **Scope:** A dashboard view that surfaces live state from Supabase — pipeline
  counts, items awaiting approval (the gates), recent `activity_log`, and quick
  actions. This is the visible beginning of Hermes as the orchestration/monitoring
  layer (read + coordinate first; autonomous routing later).
- **Done when:** One screen shows system state and pending approvals at a glance.

### 8. Real developer terminal inside dashboard
- **Goal:** Operate the system without leaving the OS.
- **Scope:** An in-dashboard terminal/command surface for safe operational
  commands (scoped, audited). Build only after the console (step 7) gives it a
  home. Keep it tightly permissioned.
- **Done when:** Approved commands run from the dashboard and are logged.

### 9. Authentication & production hardening
- **Goal:** Make it safe for real multi-user use.
- **Scope:** Add authentication (login). Tighten RLS from the current
  permissive "internal tool" policies to real per-user/role access. Move from
  the server-side service-role pattern to authenticated access where
  appropriate. Address the Supabase advisor warnings (e.g.
  `function_search_path_mutable`).
- **Done when:** Login required; RLS reflects a real access model; advisors clean.

### 10. Deployment
- **Goal:** Run online, not just locally.
- **Scope:** Deploy to Vercel (architecture is already Vercel-ready). Wire
  environment variables, connect the GitHub repo, set up preview + production.
- **Done when:** The app is reachable on a real URL with prod env configured.

---

## Guardrails for every step

- **Modular, provider-agnostic, model-flexible** — no step may hard-wire a single
  vendor or model into business logic.
- **Approval gates hold** — publishing demos, sending outreach, quoting, closing,
  and going live always require human approval.
- **Build manually before automating** — automate a step only after the manual
  version has been validated.
- **No speculative features** — build the next step, not the imagined future.

---

## Immediate next step

**Step 2 — Lead detail pages.** It is the smallest, highest-value increment from
where we are: it makes the existing leads data fully usable and creates the
surface that research, demos, and outreach will later attach to.
