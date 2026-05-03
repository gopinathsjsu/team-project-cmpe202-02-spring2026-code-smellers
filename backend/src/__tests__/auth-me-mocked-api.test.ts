jest.mock("../middleware/auth.middleware", () => ({
  requireAuth: (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
    (req as import("express").Request & { user?: { id: string } }).user = {
      id: "test-user-id",
      email: "t@example.com",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "2020-01-01T00:00:00Z",
    } as import("@supabase/supabase-js").User;
    next();
  },
  requireAdmin: (_req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
    next();
  },
}));

jest.mock("../services/auth.service");

import request from "supertest";
import * as authService from "../services/auth.service";
import app from "../app";

const mockedAuth = authService as jest.Mocked<typeof authService>;

describe("GET /api/auth/me (mocked middleware + service)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with user when getCurrentUser succeeds", async () => {
    mockedAuth.getCurrentUser.mockResolvedValue({
      ok: true,
      user: {
        id: "test-user-id",
        email: "t@example.com",
        display_name: "Test",
        is_admin: false,
      },
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer any-token")
      .expect(200);

    expect(res.body.user).toEqual(
      expect.objectContaining({
        id: "test-user-id",
        email: "t@example.com",
      }),
    );
    expect(mockedAuth.getCurrentUser).toHaveBeenCalledWith("any-token");
  });

  it("returns 401 when getCurrentUser fails", async () => {
    mockedAuth.getCurrentUser.mockResolvedValue({
      ok: false,
      error: "Invalid or expired token",
      status: 401,
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer bad")
      .expect(401);

    expect(res.body.error).toBeDefined();
  });
});
