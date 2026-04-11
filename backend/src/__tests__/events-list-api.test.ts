import request from "supertest";
import app from "../app";

describe("GET /api/events", () => {
  it("responds 200 with a JSON array", async () => {
    const res = await request(app).get("/api/events").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("defaults to at most 8 events", async () => {
    const res = await request(app).get("/api/events").expect(200);
    expect(res.body.length).toBeLessThanOrEqual(8);
  });

  it("respects limit query when valid", async () => {
    const res = await request(app).get("/api/events?limit=3").expect(200);
    expect(res.body.length).toBeLessThanOrEqual(3);
  });

  it("returns 400 for invalid limit", async () => {
    const res = await request(app).get("/api/events?limit=0").expect(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });

  it("returns 400 for non-numeric limit", async () => {
    await request(app).get("/api/events?limit=abc").expect(400);
  });

  it("returns 400 for invalid category", async () => {
    await request(app).get("/api/events?limit=8&category=invalid").expect(400);
  });

  it("accepts valid category with limit", async () => {
    const res = await request(app).get("/api/events?limit=8&category=music").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(8);
  });
});
