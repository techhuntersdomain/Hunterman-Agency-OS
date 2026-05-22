# Local Growth Pipeline — Agent Specifications (v1)

> **Status:** v1 planning doc · Last updated 2026-05-22
> **Sources:** Grounded in `hunterman_agency_os_assets_and_references.md` and
> `hunterman_agency_os_master_context.md` (owner's Downloads — recommend moving
> into this repo or the Obsidian vault).
> **Related docs:** `docs/architecture/memory-architecture.md`,
> `docs/pipelines/local-growth-pipeline-v1.md`,
> `docs/roadmap/next-build-sequence.md`.

This document defines the eight v1 agents for the Local Growth Pipeline as a
**stable blueprint**. Nothing here is implemented yet — these are specs to build
from. Keep agents single-responsibility, modular, and easy to orchestrate later.

> **Naming note (continuity):** the strategic reference lists nine
> "specialist agents." This v1 set refines that list for what we actually build
> first. Website-strategy is folded into `demo-site-generator`; deployment and
> maintenance are out of the v1 agent set (handled manually for now). A new
> `lead-scorer` is split out from research, and a `follow-up-manager` is added.

---

## Shared agent contract

Every agent below obeys the same contract (see `memory-architecture.md`):

1. **Read strategy** from Obsidian / prompts (the "how").
2. **Read state** from the Supabase tables it declares.
3. **Do one job** — produce a draft, score, record, or check.
4. **Write state** only to the tables it declares, then **log to `activity_log`**.
5. **Stop at approval gates** — never cross an external/irreversible boundary
   automatically.
6. Be **idempotent and re-runnable** on a given lead; state lives in Supabase,
   not in the agent.
7. Each agent maps to a `workflow_steps.agent_type` and is sequenced by the
   orchestrator (Hermes, later) — never by calling another agent directly.

---

## 1. lead-discovery-agent

- **Purpose:** Find German local service businesses matching the ICP in target
  niches and cities; propose them as new leads.
- **When it runs:** Pipeline entry, on-demand — a human starts a discovery run
  for a chosen niche + city.
- **Inputs:** niche, city/tier, ICP + minimum criteria.
- **Outputs:** a reviewed list of candidate businesses.
- **Reads (Supabase):** `leads` (de-duplication), `modules` (config).
- **Writes (Supabase):** `leads` (status `new`, flagged as proposed), `activity_log`.
- **Obsidian / context:** ICP definition, target cities, lead criteria, bad-lead
  list.
- **Allowed automatically:** search/collect candidates, de-duplicate against
  existing leads, normalize fields.
- **Requires human approval:** confirming which candidates actually enter the
  pipeline (discovery can surface noise; in v1 a human accepts the list).
- **Failure states:** no results; source blocked/unavailable; duplicate or
  ambiguous matches; malformed business data.
- **Success criteria:** a human-reviewed set of net-new candidate leads written
  to `leads`, each meeting at least the minimum criteria.

---

## 2. business-researcher

- **Purpose:** Gather the research needed to evaluate a lead — reviews, rating,
  website state, services, competitors, tech signals.
- **When it runs:** After a lead exists (`new` → `researching`).
- **Inputs:** one lead (id, business name, location, website if any).
- **Outputs:** a structured research record.
- **Reads (Supabase):** `leads`.
- **Writes (Supabase):** `business_research`, `leads.status` (`researching`),
  `activity_log`.
- **Obsidian / context:** research SOP, "what to look for" rubric.
- **Allowed automatically:** all internal research and writing findings. **No
  contact with the business** of any kind.
- **Requires human approval:** none for internal research (it never reaches out).
- **Failure states:** business not found; ambiguous match; key data missing;
  source unavailable.
- **Success criteria:** a populated `business_research` row linked to the lead,
  logged.

---

## 3. lead-scorer

- **Purpose:** Convert research + criteria into a 0–100 score and a
  qualified/disqualified decision with a short rationale.
- **When it runs:** Immediately after `business-researcher` completes.
- **Inputs:** lead + its `business_research` record.
- **Outputs:** `score` (0–100), qualify decision, rationale.
- **Reads (Supabase):** `leads`, `business_research`.
- **Writes (Supabase):** `leads.score`, `leads.status` (`qualified`, or
  `dormant`/`lost` if disqualified), `activity_log`.
- **Obsidian / context:** scoring rubric (criteria + weights) and reasoning.
- **Allowed automatically:** compute and write the score and qualify decision.
- **Requires human approval:** none to score; the human gate is later (selecting
  a qualified lead for a demo). Borderline cases are flagged for human review.
- **Failure states:** missing/incomplete research; rubric ambiguity.
- **Success criteria:** a score + status + rationale recorded for the lead.

---

## 4. demo-site-generator

- **Purpose:** Choose the right template (type + level) and generate a **private**
  demo site with the business's data injected. Includes website-strategy choice.
- **When it runs:** After a lead is `qualified` and a human selects it for a demo.
- **Inputs:** lead + `business_research`; chosen (or proposed) template type/level.
- **Outputs:** a private demo (draft) + a demo record.
- **Reads (Supabase):** `leads`, `business_research`.
- **Writes (Supabase):** `demo_sites` (`generating` → `ready`), `activity_log`.
- **Obsidian / context:** template SOPs, UX principles (trust/clarity/speed over
  flash), CTA strategy, **legal disclaimer requirements**.
- **Allowed automatically:** generate the private draft, including the **required
  German disclaimer** and the **legal placeholder** verbatim:
  - "Dies ist ein unverbindlicher, privater Website-Entwurf und keine offizielle Website des Unternehmens."
  - "Impressum und Datenschutzerklärung werden nach Freigabe final ergänzt."
- **Requires human approval:** publishing/sharing the demo at any reachable URL
  (generation is internal only).
- **Failure states:** missing data for injection; template render error;
  **missing disclaimer → hard fail** (must not proceed).
- **Success criteria:** a private demo recorded in `demo_sites` with both legal
  strings present, kept private pending QA + approval.

---

## 5. quality-reviewer

- **Purpose:** Verify demo quality and legal compliance before anything is shared.
- **When it runs:** After `demo-site-generator`, before deployment/outreach.
- **Inputs:** a `demo_sites` record + the rendered demo.
- **Outputs:** pass/fail + an itemized issues list.
- **Reads (Supabase):** `demo_sites`, `leads`.
- **Writes (Supabase):** `demo_sites` (QA flags/status), `activity_log`.
- **Obsidian / context:** QA checklist, legal requirements, UX principles.
- **Allowed automatically:** run the checks — disclaimer + placeholder present,
  no impersonation as the official site, no unverified claims, mobile-friendly,
  acceptable load speed.
- **Requires human approval:** explicit human sign-off before a demo is cleared
  to publish or send.
- **Failure states:** missing disclaimer (hard fail); broken render; unverified
  or false claims; not mobile-safe.
- **Success criteria:** demo marked QA-passed with no blocking issues, then
  human-signed-off.

---

## 6. outreach-writer

- **Purpose:** Draft short, personal, outcome-focused outreach per channel.
- **When it runs:** After a demo is QA-passed **and approved** (`demo_ready` →
  `outreach`).
- **Inputs:** lead, research, the private demo URL, target channel.
- **Outputs:** draft message(s) — never sent by the agent.
- **Reads (Supabase):** `leads`, `business_research`, `demo_sites`.
- **Writes (Supabase):** `outreach_messages` (`draft`), `activity_log`.
- **Obsidian / context:** messaging playbook, outreach principles (short, direct,
  personal, not spammy, avoid AI jargon), channel order (phone → WhatsApp →
  LinkedIn/Xing → Facebook → email).
- **Allowed automatically:** draft messages only.
- **Requires human approval:** **sending** — every send is human-approved; in v1
  the human sends.
- **Failure states:** missing demo URL; no usable contact channel; tone/spam
  violations; over-claiming.
- **Success criteria:** approval-ready drafts per channel, recorded as `draft`.

---

## 7. follow-up-manager

- **Purpose:** Manage the follow-up cadence for sent outreach that hasn't replied.
- **When it runs:** After outreach is sent, on a schedule, until reply or the
  cadence is exhausted.
- **Inputs:** the `outreach_messages` history for a lead.
- **Outputs:** follow-up draft(s) + suggested timing.
- **Reads (Supabase):** `outreach_messages`, `leads`.
- **Writes (Supabase):** `outreach_messages` (draft follow-ups), `leads.status`,
  `activity_log`.
- **Obsidian / context:** follow-up cadence SOP, channel order, anti-spam limits.
- **Allowed automatically:** draft follow-ups and propose timing; respect cadence
  caps.
- **Requires human approval:** sending each follow-up (no auto-send in v1).
- **Failure states:** over-contacting / exceeding cadence; lead already replied;
  all channels exhausted.
- **Success criteria:** timely follow-up drafts; lead advanced to `negotiating`
  on reply, or to `dormant` when the cadence is exhausted.

---

## 8. close/onboarding-assistant

- **Purpose:** Support converting a positive reply into a won deal and prepare
  onboarding/production.
- **When it runs:** After agreement is reached (human-led close).
- **Inputs:** lead, agreed package, deal terms.
- **Outputs:** a production project record, an onboarding checklist, and drafts
  for the final legal pages (to be finalized after approval).
- **Reads (Supabase):** `leads`, `demo_sites`, `outreach_messages`.
- **Writes (Supabase):** `leads.status` (`won`), `production_projects`,
  `activity_log`.
- **Obsidian / context:** onboarding SOP, pricing/packages, legal finalization
  SOP (real Impressum + Datenschutzerklärung after Freigabe).
- **Allowed automatically:** assemble onboarding artifacts and the project record
  draft.
- **Requires human approval:** marking the deal won, pricing/contract terms, and
  taking the final production site live with real legal pages.
- **Failure states:** incomplete deal info; missing data required for the legal
  Impressum; package not selected.
- **Success criteria:** a `production_projects` record created and onboarding
  ready, with all gates respected.

---

## Recommended v1 execution order

```
lead-discovery-agent
   → [human confirms leads]
business-researcher
lead-scorer
   → [human selects qualified leads for demos]
demo-site-generator
quality-reviewer
   → [human signs off the demo]
   → [human approves publishing]
outreach-writer
   → [human approves + sends]
follow-up-manager
   → [human approves + sends each follow-up]
close/onboarding-assistant
   → [human closes, prices, and takes final site live]
```

## Where approval gates happen

1. Confirming discovered leads enter the pipeline (light gate)
2. Selecting a qualified lead for a demo
3. QA human sign-off on a demo
4. Publishing/sharing a demo at any reachable URL (hard gate)
5. Sending any outreach (hard gate)
6. Sending each follow-up (hard gate)
7. Marking won / quoting / contract (hard gate)
8. Taking the final production site live with real legal pages (hard gate)

The pattern is constant: **agents draft and prepare; humans approve anything
external or irreversible.**

---

## Build guidance

**Which agent to implement first**
`business-researcher` + `lead-scorer`, run on a **single existing lead**. They
are internal-only (no external contact, no gate to cross), they produce
immediately useful output (a research record + a score), and they exercise the
full memory contract end-to-end on real data. *(Per the agreed recommendation —
do not implement in this task; this doc is the blueprint.)*

**Which agents stay manual / placeholder for now**
- `lead-discovery-agent` — add leads by hand for now; automated discovery/scraping
  is deferred.
- `demo-site-generator` — placeholder until the template system exists
  (roadmap step 5).
- `quality-reviewer` — placeholder; pairs with the demo generator.
- `outreach-writer` — placeholder until the messaging playbook is set and demos
  exist.
- `follow-up-manager` — placeholder until outreach is live.
- `close/onboarding-assistant` — human-led for now.

**How agents stay modular and easy to orchestrate later**
- One responsibility per agent; a clear typed **input → output** contract.
- Reads/writes only its declared tables; logs every action to `activity_log`.
- Stateless and idempotent — re-running on a lead is safe; state lives in
  Supabase.
- No agent calls another directly. Each maps to a `workflow_steps.agent_type`
  and is sequenced by the orchestrator (a simple runner or human in v1; Hermes
  later). This is what makes adding/removing/reordering agents cheap.
- Model- and provider-agnostic: the model is injected, never hardcoded into the
  agent's logic. Aligns with the existing `src/lib/agents/` registry and
  `src/lib/orchestrator/` structure.

**When these specs should become formal Claude/Codex skills**
Keep them as spec docs + plain server-side functions for now. Promote an agent
to a formal skill only once:
1. its manual/SOP version has been validated on real leads,
2. its inputs/outputs are stable,
3. it runs often enough that packaging pays off, and
4. its prompt/rubric in Obsidian has stabilized.

By that test, `business-researcher` and `lead-scorer` are the first realistic
candidates — after they've run on real leads. Do **not** skill-ify speculative
or still-manual agents (discovery, demo, outreach, follow-up, close) until they
meet the same bar. Avoid overengineering: a documented SOP plus a small function
beats a premature skill.

---

## Summary

Eight single-responsibility agents, each with a clear contract, declared
Supabase reads/writes, Obsidian references, and explicit automatic-vs-approval
boundaries. Agents draft and prepare; humans approve anything external. First to
build: `business-researcher` + `lead-scorer` on one existing lead (not in this
task). Everything else stays manual/placeholder until its prerequisites land,
keeping the system modular and easy for Hermes to orchestrate later.
