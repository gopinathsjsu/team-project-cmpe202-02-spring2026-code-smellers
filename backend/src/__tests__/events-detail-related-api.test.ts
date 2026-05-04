import request from "supertest";
import app from "../app";

describe("GET /api/events/:eventId", () => {
  it("returns 400 for non-numeric event id", async () => {
    const res = await request(app).get("/api/events/not-a-number").expect(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });

  it("returns 404 for unknown numeric id", async () => {
    const res = await request(app).get("/api/events/999999999").expect(404);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});

describe("GET /api/events/:eventId/related", () => {
  it("returns 400 for invalid event id", async () => {
    const res = await request(app).get("/api/events/x/related").expect(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });

  it("returns 200 with array for valid numeric id", async () => {
    const res = await request(app).get("/api/events/1/related").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
