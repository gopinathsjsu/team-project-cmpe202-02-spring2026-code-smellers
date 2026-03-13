import "dotenv/config";
import { getSupabaseClient } from "../lib/supabase";

/**
 * Requires a public "locations" table and .env with SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
*/

describe("Supabase locations table", () => {
  it("fetches and returns the entire locations table", async () => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.from("locations").select("*");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(expect.any(Array));
  });
});
