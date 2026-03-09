import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using env vars SUPABASE_URL and SUPABASE_ANON_KEY.
 * For server-side or tests, SUPABASE_SERVICE_ROLE_KEY can be used instead for full access (e.g. auth.users).
 */
export function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key =
process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return createClient(url, key);
}
