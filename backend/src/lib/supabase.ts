import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

/**
 * Creates a Supabase client using env var SUPABASE_URL and the publishable key.
 * This backend uses the publishable key only; do not place a service-role key here.
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY"
    );
  }

  return createClient(url, key);
}

/** Supabase client scoped to the end-user JWT (RLS runs as that user). */
export function getSupabaseClientForUserAccessToken(
  accessToken: string,
): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
  }

  return createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
