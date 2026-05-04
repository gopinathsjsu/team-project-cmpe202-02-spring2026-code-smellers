import request from "supertest";
import app from "../app";

describe("GET /api/events/:eventId/tickets/respond", () => {
  it("returns 400 HTML for invalid event id", async () => {
    const res = await request(app).get("/api/events/abc/tickets/respond").expect(400);
    expect(res.type).toMatch(/html/);
    expect(res.text).toContain("Invalid Event");
  });

  it("returns 400 HTML when token is missing", async () => {
    const res = await request(app)
      .get("/api/events/1/tickets/respond?decision=yes")
      .expect(400);
    expect(res.text).toContain("Missing Token");
  });

  it("returns 400 HTML when decision is invalid", async () => {
    const res = await request(app)
      .get("/api/events/1/tickets/respond?token=abc&decision=maybe")
      .expect(400);
    expect(res.text).toContain("Invalid Response");
  });
});
