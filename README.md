# Hunterman Agency OS

Internal agency operating system for Hunterman Agency.

Stack: Next.js 16 (App Router) · Supabase (Postgres + RLS) · Tailwind CSS ·
shadcn/ui · TypeScript.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Connect a Supabase database — follow **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**.
   This covers creating the project, running the schema, loading sample data,
   and filling in `.env.local`.
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open <http://localhost:3000>.

## Verifying the database connection

Visit <http://localhost:3000/health> — it shows **Connected to Supabase** on
success, or the exact error and missing environment variables on failure.

## Modules

- **Local Growth Pipeline** (active): Research → Demo Site → Outreach → Close

See `CLAUDE.md` for architecture and conventions.
