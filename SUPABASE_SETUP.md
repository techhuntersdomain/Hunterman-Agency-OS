# Supabase Setup — Hunterman Agency OS

This connects Hunterman OS to a live Supabase database for local development.
Total time: ~5 minutes. You only do this once.

---

## 1. Create a Supabase project

1. Go to **https://supabase.com/dashboard** and sign in (free tier is fine).
2. Click **New project**.
3. Fill in:
   - **Name**: `hunterman-os` (anything works)
   - **Database password**: generate a strong one and save it somewhere — you
     will not need it for this app, but you cannot recover it later.
   - **Region**: pick the one closest to you (e.g. `Central EU (Frankfurt)`).
4. Click **Create new project** and wait ~1–2 minutes for it to provision.

---

## 2. Run the database schema

1. In your project, open **SQL Editor** in the left sidebar.
2. Click **New query** (or **+**).
3. Open `supabase/migrations/001_initial_schema.sql` from this repo, copy the
   **entire** file, and paste it into the editor.
4. Click **Run** (or press ⌘/Ctrl + Enter).
5. You should see **Success. No rows returned**. This creates the `leads`,
   `workflows`, and pipeline tables, plus enums, indexes, and RLS policies.

> Re-running this file will error because the tables already exist. That is
> expected — only run it once per project.

---

## 3. Load sample data (optional but recommended)

1. In the **SQL Editor**, open another **New query**.
2. Copy the contents of `supabase/seed.sql` and paste it in.
3. Click **Run**.
4. This inserts three sample Local Growth leads (Berlin, Düsseldorf, Cologne).
   This file is **safe to re-run** — it resets to exactly those three rows.

---

## 4. Find your environment variables

1. In the dashboard, click **Connect** (top of the page) — or go to
   **Project Settings → API Keys**.
2. You need three values:

   | Value | Where to find it |
   |---|---|
   | **Project URL** | Project Settings → **API** / **Data API**. Looks like `https://abcdefgh.supabase.co` |
   | **anon / public key** | Project Settings → **API Keys**. The `anon` `public` key (newer projects label it **publishable**). Safe for the browser. |
   | **service_role key** | Project Settings → **API Keys**. The `service_role` **secret** key (newer projects label it **secret**). **Never** put this in client code or commit it. |

---

## 5. Fill in `.env.local`

Open `.env.local` in the project root and paste your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-or-secret-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then **restart the dev server** (`Ctrl+C`, then `npm run dev`) — Next.js only
reads `.env.local` at startup.

`.env.local` is git-ignored, so your keys stay out of version control.

---

## 6. Verify the connection

1. Run `npm run dev` and open **http://localhost:3000/health**.
2. You should see a green **● Connected to Supabase** card with the row count.
3. Open **http://localhost:3000/leads** — the three sample leads appear.

If the health page shows a red error card, it prints the **exact** error and
which environment variables are missing. Fix those and click **Re-run test**.

---

## 7. Create your login user (required)

The app now requires authentication — every route redirects to `/login` until
you sign in. Create your user once in the Supabase dashboard:

1. Open **Authentication → Users** in the left sidebar.
2. Click **Add user → Create new user**.
3. Enter your **email** and a **password**.
4. Enable **Auto Confirm User** (so you can sign in immediately without an email
   confirmation step). Click **Create user**.

Then run `npm run dev`, open **http://localhost:3000**, and you'll be sent to
**/login**. Sign in with that email/password to reach the dashboard.

> Email confirmation: if you didn't auto-confirm, go to **Authentication →
> Providers → Email** and either confirm the user manually or disable "Confirm
> email" for this internal tool.

To add another internal user later, repeat step 7 — any confirmed user can sign
in (see the access model below).

---

## How auth & data access works

**Authentication (Supabase Auth, email/password).** A Next.js `proxy.ts`
(Next 16's renamed `middleware`) refreshes the session on every request and
redirects anonymous traffic to `/login`. The dashboard layout additionally
calls `requireUser()` server-side, and every Server Action re-checks auth — so
unauthenticated users cannot read pages or invoke actions.

**Data access.** All reads and writes happen **on the server** (Server
Components and Server Actions) using the `service_role` key, which bypasses
RLS. The `service_role` key is read only on the server and is never sent to the
browser. The browser only ever uses the public `anon` key, and only for the
sign-in call.

### What is broad / single-user (v1 limitation)

- **RLS is permissive.** Every table has a single policy — `Authenticated
  access`: `ALL` for the `authenticated` role with `USING (true)`. So *any*
  signed-in user has full read/write to *all* rows. There is **no per-user
  ownership or role system yet**.
- Because the server uses the `service_role` key, RLS is not the active
  enforcement layer today — app-level auth (proxy + layout + action guards) is.
  RLS remains the backstop and stays broad-authenticated.
- This is intentional for **single-user / trusted-internal-team** use. Before
  opening the tool to untrusted or multi-tenant users, add per-user RLS
  (ownership columns + `auth.uid()` policies) and/or a role system. No schema
  change is required to *enable* auth — only to *scope* data per user.
