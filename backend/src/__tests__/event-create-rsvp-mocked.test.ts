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

jest.mock("../services/event.service");
jest.mock("../services/userTicket.service");
jest.mock("../services/ticketNotification.service", () => ({
  sendRsvpPromptForNewTicket: jest.fn().mockResolvedValue(undefined),
}));

import request from "supertest";
import * as eventService from "../services/event.service";
import * as userTicketService from "../services/userTicket.service";
import app from "../app";

const authHeader = { Authorization: "Bearer test-token" };

describe("POST /api/events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when body is not a JSON object", async () => {
    const res = await request(app)
      .post("/api/events")
      .set(authHeader)
      .set("Content-Type", "application/json")
      .send("[]")
      .expect(400);
    expect(res.body.error).toMatch(/JSON object/i);
  });

  it("returns 201 when create succeeds", async () => {
    (eventService.createEventForOrganizer as jest.Mock).mockResolvedValue({
      ok: true,
      event: { id: 42, title: "New Event" },
    });

    const res = await request(app)
      .post("/api/events")
      .set(authHeader)
      .send({ title: "New Event" })
      .expect(201);

    expect(res.body.title).toBe("New Event");
  });
});

describe("POST /api/events/:eventId/tickets", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid event id", async () => {
    const res = await request(app)
      .post("/api/events/bad/tickets")
      .set(authHeader)
      .expect(400);
    expect(res.body.error).toMatch(/event id/i);
  });

  it("returns 201 with ticket when RSVP succeeds", async () => {
    (userTicketService.rsvpForEvent as jest.Mock).mockResolvedValue({
      ok: true,
      ticket: { id: 100, event_id: 7 },
    });

    const res = await request(app)
      .post("/api/events/7/tickets")
      .set(authHeader)
      .expect(201);

    expect(res.body.ticket).toEqual(expect.objectContaining({ id: 100 }));
  });
});
