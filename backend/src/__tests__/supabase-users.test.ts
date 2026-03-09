import "dotenv/config";
import { getSupabaseClient } from "../lib/supabase";

/**
 * Integration test: calls Supabase and returns the entire users table.
 * Requires a public "users" table and .env with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
*/

describe("Supabase users table", () => {
  it("fetches and returns the entire users table", async () => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from("users").select("*");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(expect.any(Array));
  });
});
