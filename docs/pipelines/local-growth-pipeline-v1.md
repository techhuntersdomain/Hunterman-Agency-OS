# Local Growth Pipeline — v1 Specification

> **Status:** v1 planning doc · Last updated 2026-05-22
> **Sources:** Grounded in `hunterman_agency_os_assets_and_references.md` and
> `hunterman_agency_os_master_context.md` (owner's Downloads — recommend moving
> into this repo or the Obsidian vault). All targeting, criteria, agents,
> pricing, and legal language below trace back to those reference documents.

---

## Purpose

Find German local service businesses with **weak or missing websites**, build a
**private demo website** that shows them a better version of their online
presence, and convert them into paying clients.

The agency is **not selling websites**. It is selling **trust, professionalism,
local authority, conversion, and lead generation**. The website is only the
delivery mechanism. Positioning is a **local growth and lead-generation
implementation partner** — *not* an "AI agency," "automation company," or
"software company."

The Local Growth Pipeline is the **first operational module** of Hunterman
Agency OS.

---

## Target market

### Primary niches (German local service businesses)
- Gebäudereinigung (cleaning companies)
- Malerbetriebe (painters)
- Elektriker (electricians)
- Sanitär / Heizung / HVAC (plumbing & heating)
- Gartenbau / landscaping
- Umzugsfirmen (moving companies)
- Dachdecker (roofers)
- Other local contractors and home-service providers

### Target cities
- **Tier 1:** Berlin, Hamburg, Munich
- **Tier 2:** Cologne, Düsseldorf, Frankfurt, Stuttgart
- **Tier 3:** Leipzig, Dortmund, Essen

Focus on service-area businesses that depend on inbound calls/leads and operate
in high-trust industries.

---

## Lead qualification criteria

### Minimum criteria (must have all)
- Has a Google Business Profile
- Has a visible phone number
- Has recent reviews
- Has a weak or missing website
- Operates locally
- Is clearly an active business

### Strong lead indicators (the more, the better)
- 20–200 Google reviews
- Rating above 4.0
- Recent reviews within the last 30 days
- Multiple service offerings
- Poor mobile website
- No modern branding
- Weak conversion funnel / weak trust presentation / poor CTA structure

### Disqualifiers (avoid)
- Inactive businesses or those with almost no reviews
- Highly branded premium companies and franchises
- Scam-looking operations
- Businesses already overloaded with leads
- Businesses that already have a modern, high-converting website

A lead is **scored 0–100** (`leads.score`) using these criteria; the scoring
rubric itself lives in Obsidian (`04 Agents` / `06 SOPs`), the score lives in
Supabase.

---

## Pipeline stages — discovery to close/onboarding

Each stage names its primary **agent**, its **automation level in v1**, and the
**Supabase tables** it writes. Stages map onto the existing `lead_status` values
(`new → researching → qualified → demo_ready → outreach → negotiating → won /
lost / dormant`).

| # | Stage | Primary agent | v1 automation | Writes to |
|---|---|---|---|---|
| 1 | **Lead discovery** — find businesses matching the ICP in target cities/niches | Lead Scout | Assisted (agent proposes, human confirms list) | `leads` (status `new`) |
| 2 | **Qualification & scoring** — verify criteria, score 0–100 | Business Research | Automated draft | `business_research`, `leads.score` (`researching`→`qualified`) |
| 3 | **Website strategy** — pick template type + level, define angle | Website Strategy | Automated draft | `demo_sites` (planning), `leads.notes` |
| 4 | **Demo build** — generate private demo from a template with injected business data | Demo Builder | Automated draft | `demo_sites` (`generating`→`ready`) |
| 5 | **QA & compliance** — disclaimers present, no impersonation, no unverified claims, mobile + speed checks | QA & Compliance | Automated checks, **human sign-off** | `demo_sites`, `activity_log` |
| 6 | **Deployment (private)** — publish the demo to a private, shareable URL | Deployment Manager | **Human-approved** | `demo_sites` (`url`, `ready`/`sent`) |
| 7 | **Outreach drafting** — personalized message per preferred channel | Outreach Writer | Automated draft | `outreach_messages` (`draft`) |
| 8 | **Outreach send & follow-up** — actually contact the business | Outreach Writer (human sends) | **Human-approved send** | `outreach_messages` (`scheduled`→`sent`→`replied`), `leads` (`outreach`→`negotiating`) |
| 9 | **Close** — agreement reached | Production Manager (human-led) | **Human only** | `leads` (`won`/`lost`) |
| 10 | **Onboarding & production** — build final site, add legal pages, hand over; ongoing care | Production Manager / Maintenance Manager | **Human-approved** | `production_projects`, `demo_sites` |

Preferred outreach channel order (stage 7–8): **1) Phone call, 2) WhatsApp,
3) LinkedIn/Xing, 4) Facebook, 5) Email.** Messages must be short, direct,
personal, outcome-focused, not spammy, and must avoid excessive AI terminology.

---

## Required agents (v1)

From the agency's specialist-agent roster, the Local Growth Pipeline v1 uses:

1. **Lead Scout Agent** — discovers candidate businesses
2. **Business Research Agent** — researches and scores leads
3. **Website Strategy Agent** — chooses template + positioning angle
4. **Demo Builder Agent** — generates the private demo site
5. **QA & Compliance Agent** — verifies quality and legal compliance
6. **Deployment Manager Agent** — publishes private demos
7. **Outreach Writer Agent** — drafts outreach
8. **Production Manager Agent** — manages won deals into delivery
9. **Maintenance Manager Agent** — ongoing monthly care (post-close)

> Keep the roster lean. The project philosophy explicitly warns against "too many
> micro-agents." These nine cover the full pipeline; do not split them further
> without a proven need.

---

## What is automated in v1 vs what requires human approval

**Automated in v1 (drafting / internal only):**
- Lead discovery (agent proposes a candidate list)
- Research and scoring
- Website-strategy selection
- Demo-site generation (draft, kept private)
- Automated QA/compliance checks
- Outreach message drafting

**Requires human approval (the gates — never automatic):**
- Publishing a demo site to any reachable URL
- Sending any outreach message (any channel)
- Quoting prices / sending proposals
- Marking a deal won and starting onboarding
- Taking a final production site live, including legal pages

This follows the **build-manually-before-automating** principle: validate
pricing, conversion, outreach, and delivery with humans first; automate only
what has been proven. In v1, automation produces drafts and humans approve and
send.

---

## What data belongs in Supabase

- `leads` — every lead, its contact info, status, and score
- `business_research` — research findings (reviews, rating, website state, etc.)
- `demo_sites` — demo records: template, status, private URL, preview
- `outreach_messages` — every message: channel, body, status, timestamps
- `production_projects` — won deals in delivery, plus monthly-care state
- `workflows` / `workflow_steps` — live pipeline state per lead
- `activity_log` — append-only audit trail of all agent/human actions

---

## What strategy / process knowledge belongs in Obsidian

- The lead-qualification rubric and *why* each criterion matters
- Per-niche playbooks (cleaner vs electrician vs roofer angles)
- Website template SOPs (which template/level for which niche)
- Messaging principles and reusable outreach scripts per channel
- Pricing strategy and packaging rationale
- Positioning and sales narrative
- Experiments and lessons learned from real outreach/conversion

---

## Pricing reference (context, lives in Obsidian `07 Business`)

- **Essential:** €900–€1,500 · one-page, trust-focused, fast deploy
- **Growth:** €1,800–€2,800 · multi-page, local SEO, conversion sections
- **Premium Motion:** €3,000–€5,000+ · advanced motion, custom interactions
- **Monthly Care:** €79–€199/month · uptime, analytics, edits, review responses

---

## Legal & demo-site disclaimer requirements

Demo websites are **private proposals**, not official websites. They must:
- Remain private (no public indexing; private/shareable URL only)
- Never impersonate the business as its official site
- Contain the required disclaimer (below)
- Avoid unverified claims

**Required disclaimer — must appear visibly on every demo site:**

> Dies ist ein unverbindlicher, privater Website-Entwurf und keine offizielle Website des Unternehmens.

**Required legal placeholder — used until the client approves and we finalize
the real Impressum / Datenschutzerklärung after go-ahead (Freigabe):**

> Impressum und Datenschutzerklärung werden nach Freigabe final ergänzt.

The full, real **Impressum** and **Datenschutzerklärung** are added only **after
client approval**, as part of stage 10 (onboarding/production), and taking the
final site live is a human-approved gate.

---

## Summary

v1 is a **human-in-the-loop pipeline**: agents discover, research, score, draft
demos, and draft outreach automatically; humans approve every external or
irreversible action (publishing, sending, quoting, closing, going live). State
lives in Supabase, strategy lives in Obsidian, and every demo carries the
required German disclaimer until legal pages are finalized after approval.
