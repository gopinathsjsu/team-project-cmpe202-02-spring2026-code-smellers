jest.mock("../lib/supabase", () => ({
  getSupabaseClient: jest.fn(),
}));

import { getSupabaseClient } from "../lib/supabase";
import {
  registerUser,
  loginWithPassword,
  getCurrentUser,
} from "../services/auth.service";

const mockedGetSupabaseClient = getSupabaseClient as jest.MockedFunction<
  typeof getSupabaseClient
>;

describe("auth.service validation paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registerUser does not call Supabase when email is missing", async () => {
    const result = await registerUser({
      email: "",
      password: "password12",
      name: "N",
      is_admin: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
      expect(result.error).toContain("email");
    }
    expect(mockedGetSupabaseClient).not.toHaveBeenCalled();
  });

  it("loginWithPassword does not call Supabase when password is missing", async () => {
    const result = await loginWithPassword({ email: "a@b.com", password: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("password");
    }
    expect(mockedGetSupabaseClient).not.toHaveBeenCalled();
  });

  it("getCurrentUser returns 401 when token is empty", async () => {
    const result = await getCurrentUser("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
    expect(mockedGetSupabaseClient).not.toHaveBeenCalled();
  });
});
