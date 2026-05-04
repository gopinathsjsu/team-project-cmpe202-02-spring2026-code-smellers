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

jest.mock("../services/userProfile.service");
jest.mock("../services/userSavedEvent.service");
jest.mock("../services/userTicket.service");

import request from "supertest";
import * as userProfileService from "../services/userProfile.service";
import * as userSavedEventService from "../services/userSavedEvent.service";
import * as userTicketService from "../services/userTicket.service";
import app from "../app";

const authHeader = { Authorization: "Bearer test-token" };

describe("PATCH /api/users/me/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when display_name is not a string", async () => {
    const res = await request(app)
      .patch("/api/users/me/profile")
      .set(authHeader)
      .send({ display_name: 123 })
      .expect(400);
    expect(res.body.error).toMatch(/display_name/i);
  });

  it("returns 200 when profile update succeeds", async () => {
    (userProfileService.updateMyDisplayName as jest.Mock).mockResolvedValue({
      ok: true,
      user: { id: "test-user-id", display_name: "New Name" },
    });

    const res = await request(app)
      .patch("/api/users/me/profile")
      .set(authHeader)
      .send({ display_name: "New Name" })
      .expect(200);

    expect(res.body.user.display_name).toBe("New Name");
  });
});

describe("GET /api/users/me/tickets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when scope is missing or invalid", async () => {
    await request(app).get("/api/users/me/tickets").set(authHeader).expect(400);
    await request(app).get("/api/users/me/tickets?scope=old").set(authHeader).expect(400);
  });

  it("returns 200 with tickets for upcoming", async () => {
    (userTicketService.listMyUpcomingTickets as jest.Mock).mockResolvedValue({
      ok: true,
      tickets: [{ id: 1 }],
    });

    const res = await request(app)
      .get("/api/users/me/tickets?scope=upcoming")
      .set(authHeader)
      .expect(200);

    expect(res.body.tickets).toEqual([{ id: 1 }]);
  });
});

describe("GET /api/users/me/tickets/event/:eventId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid event id", async () => {
    const res = await request(app)
      .get("/api/users/me/tickets/event/abc")
      .set(authHeader)
      .expect(400);
    expect(res.body.error).toMatch(/event id/i);
  });

  it("returns 200 with ticket when service succeeds", async () => {
    (userTicketService.getMyTicketForEvent as jest.Mock).mockResolvedValue({
      ok: true,
      ticket: { id: 9, event_id: 2 },
    });

    const res = await request(app)
      .get("/api/users/me/tickets/event/2")
      .set(authHeader)
      .expect(200);

    expect(res.body.ticket).toEqual(expect.objectContaining({ id: 9 }));
  });
});

describe("GET /api/users/me/saved-events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with events list", async () => {
    (userSavedEventService.listMySavedEvents as jest.Mock).mockResolvedValue({
      ok: true,
      events: [],
    });

    const res = await request(app).get("/api/users/me/saved-events").set(authHeader).expect(200);
    expect(res.body.events).toEqual([]);
  });
});

describe("POST /api/users/me/saved-events/:eventId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 201 when save succeeds", async () => {
    (userSavedEventService.addMySavedEvent as jest.Mock).mockResolvedValue({ ok: true });

    const res = await request(app)
      .post("/api/users/me/saved-events/5")
      .set(authHeader)
      .expect(201);

    expect(res.body).toEqual({ ok: true });
  });
});

describe("DELETE /api/users/me/saved-events/:eventId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 204 when delete succeeds", async () => {
    (userSavedEventService.removeMySavedEvent as jest.Mock).mockResolvedValue({ ok: true });

    await request(app).delete("/api/users/me/saved-events/5").set(authHeader).expect(204);
  });
});
