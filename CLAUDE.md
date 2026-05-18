@AGENTS.md

# Hunterman Agency OS

Internal agency operating system for Hunterman Agency.

## Stack
- Next.js 16 (App Router)
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS + shadcn/ui
- TypeScript

## Architecture

```
src/
  app/(dashboard)/     — Dashboard pages (layout with sidebar nav)
  lib/agents/          — Agent definitions and registry
  lib/orchestrator/    — Pipeline runner and step execution
  lib/modules/         — Module registry (extensible pipeline system)
  lib/supabase/        — Client/server Supabase helpers
  types/               — TypeScript types including DB schema
  components/ui/       — shadcn/ui components
  components/modules/  — Module-specific components
supabase/migrations/   — SQL migrations
```

## Modules
- **Local Growth Pipeline** (active): Research → Demo Site → Outreach → Close

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build

## Conventions
- Server Components by default, "use client" only when needed
- All DB access via `src/lib/supabase/server.ts` (server) or `client.ts` (browser)
- New pipelines register in `src/lib/modules/registry.ts`
- Agents register in `src/lib/agents/registry.ts`
- Pipeline-specific tables live alongside generic workflow tables
