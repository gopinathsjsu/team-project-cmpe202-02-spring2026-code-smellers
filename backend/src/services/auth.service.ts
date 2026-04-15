import { getSupabaseClient } from "../lib/supabase";
import type { LoginRequestBody, RegisterRequestBody } from "../types/auth.types";

function validateRegisterBody(body: RegisterRequestBody): string | null {
  if (!body.email) {
    return "Missing required field: email";
  }
  if (!body.password) {
    return "Missing required field: password";
  }
  if (!body.name) {
    return "Missing required field: displayName";
  }
  const passwordLengthMin = 8;
  if (body.password.length < passwordLengthMin) {
    return `Password must be at least ${passwordLengthMin} characters`;
  }
  return null;
}

function validateLoginBody(body: LoginRequestBody): string | null {
  if (!body.email) {
    return "Missing required field: email";
  }
  if (!body.password) {
    return "Missing required field: password";
  }
  return null;
}

type Fail = { ok: false; error: string; status: 400 | 500 };

export async function registerUser(
  body: RegisterRequestBody,
): Promise<{ ok: true; user: unknown; session: unknown } | Fail> {
  const invalidRequest = validateRegisterBody(body);
  if (invalidRequest) {
    return { ok: false, error: invalidRequest, status: 400 };
  }

  const supabase = getSupabaseClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: body.email as string,
    password: body.password as string,
    options: {
      data: {
        display_name: body.name, // using "display_name" to be consistent with the "users" table schema
        is_admin: body.is_admin,
      },
    },
  });

  if (signUpError) {
    return { ok: false, error: signUpError.message, status: 400 };
  }

  const authUserId = signUpData.user?.id;
  if (!authUserId) {
    return {
      ok: false,
      error: "User registration didn't return a (valid) user id",
      status: 500,
    };
  }

  const userRecord = {
    id: authUserId,
    email: body.email as string,
    display_name: body.name as string,
    is_admin: body.is_admin,
  } as any;

  const { data: createdUser, error: createUserError } = await supabase
    .from("users")
    .insert(userRecord)
    .select("*")
    .single();

  if (createUserError) {
    return { ok: false, error: createUserError.message, status: 400 };
  }

  return { ok: true, user: createdUser, session: signUpData.session };
}

export async function loginWithPassword(
  body: LoginRequestBody,
): Promise<
  | { ok: true; user: unknown; session: unknown }
  | { ok: false; error: string; status: 400 }
> {
  const invalidRequest = validateLoginBody(body);
  if (invalidRequest) {
    return { ok: false, error: invalidRequest, status: 400 };
  }

  const supabase = getSupabaseClient();
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

  if (signInError) {
    return { ok: false, error: signInError.message, status: 400 };
  }

  return {
    ok: true,
    user: signInData.user,
    session: signInData.session,
  };
}

type MeSuccess = {
  ok: true;
  user: unknown;
};

type MeFail = {
  ok: false;
  error: string;
  status: 401 | 500;
};

export async function getCurrentUser(
  accessToken: string,
): Promise<MeSuccess | MeFail> {
  if (!accessToken) {
    return { ok: false, error: "Missing access token", status: 401 };
  }

  const supabase = getSupabaseClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !authUser) {
    return { ok: false, error: "Invalid or expired token", status: 401 };
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (userError) {
    return { ok: false, error: userError.message, status: 500 };
  }

  return { ok: true, user: appUser };
}