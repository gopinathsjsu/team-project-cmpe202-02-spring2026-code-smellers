jest.mock("../middleware/auth.middleware", () => ({
  requireAuth: (req: import("express").Request, _res: import("express").Response, next: import("express").NextFunction) => {
    (req as import("express").Request & { user?: { id: string } }).user = {
      id: "org-user-id",
      email: "o@example.com",
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

jest.mock("../services/organizer.service");
jest.mock("../services/event.service");

import request from "supertest";
import * as organizerService from "../services/organizer.service";
import * as eventService from "../services/event.service";
import app from "../app";

const authHeader = { Authorization: "Bearer test-token" };

describe("GET /api/organizers/dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with dashboard payload", async () => {
    (organizerService.getOrganizerDashboard as jest.Mock).mockResolvedValue({
      ok: true,
      dashboard: { events: [] },
    });

    const res = await request(app).get("/api/organizers/dashboard").set(authHeader).expect(200);
    expect(res.body).toEqual({ events: [] });
  });
});

describe("GET /api/organizers/events/:eventId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid event id", async () => {
    const res = await request(app)
      .get("/api/organizers/events/xyz")
      .set(authHeader)
      .expect(400);
    expect(res.body.error).toMatch(/event id/i);
  });

  it("returns 200 with event when service succeeds", async () => {
    (eventService.getEventForOrganizer as jest.Mock).mockResolvedValue({
      ok: true,
      event: { id: 3, title: "My Event" },
    });

    const res = await request(app)
      .get("/api/organizers/events/3")
      .set(authHeader)
      .expect(200);

    expect(res.body.event.title).toBe("My Event");
  });
});

describe("PATCH /api/organizers/events/:eventId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when body is not JSON object", async () => {
    const res = await request(app)
      .patch("/api/organizers/events/1")
      .set(authHeader)
      .set("Content-Type", "application/json")
      .send("[]")
      .expect(400);
    expect(res.body.error).toMatch(/JSON object/i);
  });

  it("returns 200 when update succeeds", async () => {
    (eventService.updateEventForOrganizer as jest.Mock).mockResolvedValue({
      ok: true,
      event: { id: 1, title: "Updated" },
    });

    const res = await request(app)
      .patch("/api/organizers/events/1")
      .set(authHeader)
      .send({ title: "Updated" })
      .expect(200);

    expect(res.body.event.title).toBe("Updated");
  });
});

describe("DELETE /api/organizers/events/:eventId/attendees/:ticketId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid ticket id", async () => {
    const res = await request(app)
      .delete("/api/organizers/events/1/attendees/bad")
      .set(authHeader)
      .expect(400);
    expect(res.body.error).toMatch(/ticket id/i);
  });

  it("returns 200 when removal succeeds", async () => {
    (eventService.removeOrganizerEventAttendee as jest.Mock).mockResolvedValue({ ok: true });

    const res = await request(app)
      .delete("/api/organizers/events/1/attendees/99")
      .set(authHeader)
      .expect(200);

    expect(res.body).toEqual({ ok: true });
  });
});
