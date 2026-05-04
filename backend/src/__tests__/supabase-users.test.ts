import "dotenv/config";
import * as supabaseModule from "../lib/supabase";
import { registerUser } from "../controllers/auth.controller";

jest.setTimeout(15000);

describe("Supabase users table", () => {
  afterEach(async () => {
    const supabase = supabaseModule.getSupabaseClient();

    await supabase
      .from("users")
      .delete()
      .like("email", "testuser_%@example.com");

    jest.restoreAllMocks();
  });

  it("fetches and returns the entire users table", async () => {
    const supabase = supabaseModule.getSupabaseClient();

    const { data, error } = await supabase.from("users").select("*");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it("creates a new user row in the database", async () => {
    const realSupabase = supabaseModule.getSupabaseClient();

    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = "testpassword123!";
    const testDisplayName = "Test User";
    const testIsAdmin = false;
    const fakeAuthUserId = crypto.randomUUID();

    const authSpy = jest.spyOn(realSupabase.auth, "signUp").mockResolvedValue({
      data: {
        user: {
          id: fakeAuthUserId,
          email: testEmail,
        } as any,
        session: null,
      },
      error: null,
    } as any);

    jest
      .spyOn(supabaseModule, "getSupabaseClient")
      .mockReturnValue(realSupabase);

    const req = {
      body: {
        email: testEmail,
        password: testPassword,
        name: testDisplayName,
        is_admin: testIsAdmin,
      },
    } as any;

    const jsonMock = jest.fn();
    const statusMock = jest.fn().mockReturnThis();

    const res = {
      status: statusMock,
      json: jsonMock,
    } as any;

    await registerUser(req, res);

    const statusCode = statusMock.mock.calls[0]?.[0];
    const responseBody = jsonMock.mock.calls[0]?.[0];

    expect(authSpy).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: testDisplayName,
          is_admin: testIsAdmin,
        },
      },
    });

    expect(statusCode).toBe(201);
    expect(responseBody.user.email).toBe(testEmail);
    expect(responseBody.user.display_name).toBe(testDisplayName);
    expect(responseBody.user.is_admin).toBe(testIsAdmin);
    expect(responseBody.user.id).toBe(fakeAuthUserId);

    const { data: insertedUser, error: fetchError } = await realSupabase
      .from("users")
      .select("*")
      .eq("id", fakeAuthUserId)
      .single();

    if (!insertedUser) {
      throw new Error("User not found");
    }

    expect(fetchError).toBeNull();
    expect(insertedUser).toBeDefined();
    expect(insertedUser.email).toBe(testEmail);
  });
});