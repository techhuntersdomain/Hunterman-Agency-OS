"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Signs the current user out (clears the Supabase session cookie) and sends
 * them to the login page. Used by the Sign Out button in the dashboard shell.
 */
export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
