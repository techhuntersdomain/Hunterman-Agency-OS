import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Server-side auth helpers built on the cookie-bound Supabase client (anon
 * key + session cookie — never the service-role key). Use these in Server
 * Components, Server Actions, and route loaders to confirm a request is
 * authenticated before doing user-facing work.
 */

/** Returns the signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Requires an authenticated user; redirects to `/login` if there is none.
 * For Server Components / page loaders — `redirect()` throws to interrupt
 * rendering. Server Actions that return a result should use `getCurrentUser()`
 * and return an error instead (see `ensureAuthed`).
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
