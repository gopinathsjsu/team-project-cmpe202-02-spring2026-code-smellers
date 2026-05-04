jest.mock("../middleware/auth.middleware", () => ({
  requireAuth: (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
    (req as import("express").Request & { user?: { id: string } }).user = {
      id: "admin-user-id",
      email: "admin@example.com",
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

jest.mock("../services/admin.service");

import request from "supertest";
import * as adminService from "../services/admin.service";
import app from "../app";

const authHeader = { Authorization: "Bearer admin-token" };

describe("GET /api/admin/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with dashboard", async () => {
    (adminService.getAdminDashboard as jest.Mock).mockResolvedValue({
      ok: true,
      dashboard: { pendingCount: 0 },
    });

    const res = await request(app).get("/api/admin/dashboard").set(authHeader).expect(200);
    expect(res.body).toEqual({ pendingCount: 0 });
  });
});

describe("GET /api/admin/events/:eventId/review", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid event id", async () => {
    const res = await request(app)
      .get("/api/admin/events/nope/review")
      .set(authHeader)
      .expect(400);
    expect(res.body.error).toMatch(/event id/i);
  });

  it("returns 200 with event when service succeeds", async () => {
    (adminService.getAdminEventReview as jest.Mock).mockResolvedValue({
      ok: true,
      event: { id: 1, title: "Review me" },
    });

    const res = await request(app).get("/api/admin/events/1/review").set(authHeader).expect(200);
    expect(res.body.title).toBe("Review me");
  });
});

describe("PATCH /api/admin/events/:eventId/moderation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when approval status is missing", async () => {
    const res = await request(app)
      .patch("/api/admin/events/1/moderation")
      .set(authHeader)
      .send({})
      .expect(400);
    expect(res.body.error).toMatch(/approval status/i);
  });

  it("returns 200 when moderation succeeds", async () => {
    (adminService.moderateEvent as jest.Mock).mockResolvedValue({
      ok: true,
      event: { id: 1, approval_status: "approved" },
    });

    const res = await request(app)
      .patch("/api/admin/events/1/moderation")
      .set(authHeader)
      .send({ approvalStatus: "approved" })
      .expect(200);

    expect(res.body.approval_status).toBe("approved");
  });
});

describe("POST /api/admin/events/moderation/bulk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when items are missing", async () => {
    const res = await request(app)
      .post("/api/admin/events/moderation/bulk")
      .set(authHeader)
      .send({})
      .expect(400);
    expect(res.body.error).toMatch(/items/i);
  });

  it("returns 200 when bulk moderation succeeds", async () => {
    (adminService.bulkModerateEvents as jest.Mock).mockResolvedValue({
      ok: true,
      updatedEvents: [{ id: 1 }],
    });

    const res = await request(app)
      .post("/api/admin/events/moderation/bulk")
      .set(authHeader)
      .send({
        items: [{ eventId: "1", approvalStatus: "approved" }],
      })
      .expect(200);

    expect(res.body.updatedEvents).toHaveLength(1);
  });
});

describe("POST /api/admin/users/admins", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/admin/users/admins")
      .set(authHeader)
      .send({ password: "password12", name: "Admin" })
      .expect(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("returns 201 when create admin succeeds", async () => {
    (adminService.createAdminUser as jest.Mock).mockResolvedValue({
      ok: true,
      user: { id: "new-admin", email: "a@b.com" },
    });

    const res = await request(app)
      .post("/api/admin/users/admins")
      .set(authHeader)
      .send({
        email: "new@admin.com",
        password: "password12",
        name: "New Admin",
      })
      .expect(201);

    expect(res.body.user.email).toBe("a@b.com");
  });
});
