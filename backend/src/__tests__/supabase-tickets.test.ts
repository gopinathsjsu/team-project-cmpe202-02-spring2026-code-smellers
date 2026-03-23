import "dotenv/config";
import { getSupabaseClient } from "../lib/supabase";

/**
 * Requires a public "tickets" table and .env with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
*/

describe("Supabase tickets table", () => {
  it("fetches and returns the entire tickets table", async () => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from("tickets").select("*");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(expect.any(Array));
  });
});
