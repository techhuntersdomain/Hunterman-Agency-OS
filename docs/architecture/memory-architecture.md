# Memory Architecture — Hunterman Agency OS

> **Status:** v1 planning doc · Last updated 2026-05-22
> **Sources:** Grounded in the project's strategic context files
> `hunterman_agency_os_assets_and_references.md` and
> `hunterman_agency_os_master_context.md` (currently in the owner's Downloads —
> recommend moving them into this repo under `docs/` or into the Obsidian vault
> under `01 Vision` / `02 Architecture` so they live with the system they describe).

---

## Overview

Hunterman Agency OS runs on **two distinct memory layers**, with a future
orchestrator that connects them:

1. **Obsidian** — the strategic / human "second brain" (slow-changing knowledge)
2. **Supabase** — the operational / live business memory (fast-changing state)
3. **Hermes** — the future orchestrator that reads from and writes to both

The single guiding rule:

> **Obsidian holds knowledge. Supabase holds state.**

Knowledge is *how we work* — strategy, SOPs, prompts, playbooks, lessons.
State is *what is happening right now* — this lead, this workflow, this demo
site, this outreach message. When deciding where something belongs, ask: "Is
this a durable decision/principle (Obsidian), or a live record that changes as
work progresses (Supabase)?"

---

## Layer 1 — Obsidian (strategic / human second brain)

Obsidian is the human-owned, human-readable knowledge base. It is the source of
*intent and method*. It changes slowly and is curated by people.

**What belongs in Obsidian**
- Vision and long-term strategy
- Architecture notes and decisions
- Pipeline definitions and SOPs
- Agent definitions, responsibilities, and prompts
- Messaging principles and outreach playbooks
- Targeting criteria and ICP reasoning
- Pricing strategy and packaging rationale
- Experiments and their results
- Lessons learned
- Client-facing strategy notes

**Recommended vault structure** (from the reference docs):
```
01 Vision
02 Architecture
03 Pipelines
04 Agents
05 Prompts
06 SOPs
07 Business
08 Experiments
09 Lessons
10 Clients
```

**Key property:** the vault is plain local Markdown files. That makes it
portable, diff-able, git-friendly, and readable by any tool or model with
filesystem access — no special integration required.

---

## Layer 2 — Supabase (operational / live business memory)

Supabase (hosted Postgres) is the live operational record. It is the source of
*current state and history*. It changes constantly and is written to by the app,
by humans, and eventually by agents.

**What belongs in Supabase**
- Leads and their pipeline status
- Business research findings and scores
- Demo site records (status, URL, template used)
- Outreach messages and their delivery/response state
- Production projects and deployments
- Workflow and workflow-step state
- Activity log (an append-only audit trail of everything that happened)

**Current tables (live today):**
`modules`, `workflows`, `workflow_steps`, `activity_log` (generic system) and
`leads`, `business_research`, `demo_sites`, `outreach_messages`,
`production_projects` (Local Growth Pipeline).

---

## The dividing line — Obsidian vs Supabase

| Question | Obsidian | Supabase |
|---|---|---|
| How do we qualify a lead? | ✅ rubric / reasoning | |
| Is *this* lead qualified, and what's its score? | | ✅ row in `leads` / `business_research` |
| What's our outreach voice and message structure? | ✅ playbook / templates | |
| Did we send a message to this lead, and did they reply? | | ✅ `outreach_messages` |
| Which demo template fits a cleaner vs an electrician? | ✅ template SOP | |
| What's the URL and status of *this* demo? | | ✅ `demo_sites` |
| What did we learn from the last 20 outreach attempts? | ✅ lessons | |
| Raw metrics behind that lesson | | ✅ queried from tables |

Rule of thumb: **if a human would write it once and refer back to it, it's
Obsidian. If it's generated or updated by doing the work, it's Supabase.**

---

## Hermes — the future orchestrator that connects both

Hermes is the planned executive operating layer above the specialist agents. It
is **not built yet** — this section defines the target, not current state.

Hermes will eventually:
- Coordinate pipelines and route tasks to specialist agents
- Manage workflow state and maintain operational continuity
- Monitor system state
- Escalate decisions that require human approval
- Act as the management layer above the specialist agents

**How Hermes uses the two layers**
- **Reads knowledge from Obsidian** — pipeline definitions, agent prompts, SOPs,
  qualification rubrics, messaging playbooks (the "how").
- **Reads and writes state in Supabase** — current workflow state, lead status,
  agent outputs, and the activity log (the "what's happening").
- Treats Obsidian as read-mostly reference and Supabase as the live system of
  record.

---

## How agents should use memory

Every specialist agent (Lead Scout, Business Research, Demo Builder, Outreach
Writer, etc.) follows the same memory contract:

1. **Load strategy from Obsidian / prompts** — read the relevant SOP, rubric, or
   prompt that defines *how* to do the task. Agents do not invent strategy; they
   apply documented strategy.
2. **Read current state from Supabase** — fetch the lead, workflow, or record
   they are acting on.
3. **Do the work** — produce a draft, a score, a research brief, a demo, etc.
4. **Write results back to Supabase** — update the relevant table (e.g.
   `business_research`, `demo_sites`, `outreach_messages`) and the workflow step.
5. **Log to `activity_log`** — append an entry so there is a complete audit trail
   of which agent did what, when.
6. **Stop at approval gates** — never cross a human-approval boundary
   automatically (see below).

Durable learnings discovered while working (e.g. "electricians respond better to
WhatsApp than email") are surfaced to a human and written back into Obsidian as
lessons — not silently buried in a database row.

---

## Approval gates (human-in-the-loop)

The project's operating principle is **build manually before automating** —
validate pricing, conversion, outreach, and delivery with humans before letting
automation run unattended. Automation **drafts**; humans **approve and send**.

The following always require explicit human approval before proceeding:
- **Publishing a demo site** to any reachable URL (no demo goes live unreviewed)
- **Sending any outreach** (phone, WhatsApp, email, etc.)
- **Quoting prices** or sending proposals
- **Marking a deal won / starting onboarding**
- **Taking a final production site live**, including its legal pages
  (Impressum, Datenschutzerklärung)

Agents may freely do non-destructive, internal work without a gate: discovering
leads, scoring them, drafting demos and messages, and writing to internal
tables. The gate is at the boundary where something becomes **external or
irreversible**.

---

## Why the system stays modular, provider-agnostic, and model-flexible

These are first-class architectural constraints, not nice-to-haves:

- **Modular** — each pipeline is a module and each agent is a swappable unit.
  The Local Growth Pipeline is only the first module; new modules must be able
  to plug in without rewiring the core.
- **Provider-agnostic** — the OS must not be welded to a single vendor. Data
  lives in standard Postgres (Supabase) and plain Markdown (Obsidian), both
  exportable and portable. Storage, models, and tools can change without a
  rewrite.
- **Model-flexible** — the system should support Hermes, Claude, Codex, GPT,
  local models, MCP tools, and browser automation, and route different task
  types to the most suitable model. No business logic should assume one model.

The reason is durability and leverage: a single-vendor or single-model design
becomes a liability the moment pricing, availability, or capability changes.
Keeping the contracts simple (Postgres rows + Markdown files) means every future
provider can read and write the system.

---

## Why an Obsidian MCP is optional later, not required now

An Obsidian MCP server would let agents query the vault through a structured API
(richer search, link-aware reads, controlled write-back). That is a **future
convenience, not a current dependency** — for a clear reason:

> The Obsidian vault is just a folder of local Markdown files.

Any agent or tool with filesystem read access can already read the vault today
by reading `.md` files directly — no MCP, no integration, no extra moving part.
This keeps the system simpler and more provider-agnostic right now. We add an
Obsidian MCP only when we have a concrete need it uniquely solves (for example,
remote/programmatic access, link-graph queries, or safe automated write-back) —
and not before. Adding it earlier would be premature complexity, which this
project explicitly avoids.

---

## Summary

- **Obsidian = knowledge (how).** Slow, human-curated, plain Markdown.
- **Supabase = state (what's happening).** Fast, system-of-record, Postgres.
- **Hermes = the orchestrator** that reads knowledge and drives state. (Future.)
- Agents read strategy, act, write state, log, and **stop at approval gates**.
- Stay modular, provider-agnostic, and model-flexible so nothing is locked in.
- An Obsidian MCP is a later option, not a requirement — the vault is already
  readable as local Markdown.
