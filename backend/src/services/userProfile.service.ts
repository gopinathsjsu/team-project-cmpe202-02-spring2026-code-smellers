import { getSupabaseClientForUserAccessToken } from "../lib/supabase";

const DISPLAY_NAME_MAX_LEN = 120;

type Ok<T> = { ok: true; user: T };
type Fail = { ok: false; error: string; status: 400 | 401 | 403 | 500 };

export async function updateMyDisplayName(
  accessToken: string,
  userId: string,
  rawDisplayName: string,
): Promise<Ok<unknown> | Fail> {
  const trimmed = rawDisplayName.trim();
  if (!trimmed) {
    return { ok: false, error: "Display name cannot be empty", status: 400 };
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LEN) {
    return {
      ok: false,
      error: `Display name must be at most ${DISPLAY_NAME_MAX_LEN} characters`,
      status: 400,
    };
  }

  const supabase = getSupabaseClientForUserAccessToken(accessToken);
  const { data, error } = await supabase
    .from("users")
    .update({ display_name: trimmed })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    return { ok: false, error: error.message, status: 400 };
  }

  return { ok: true, user: data };
}
