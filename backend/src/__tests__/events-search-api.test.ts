import request from "supertest";
import app from "../app";

describe("GET /api/events/search", () => {
  it("responds 200 with an array", async () => {
    const res = await request(app).get("/api/events/search").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("accepts optional category when valid", async () => {
    const res = await request(app).get("/api/events/search?category=music").expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 400 for invalid category", async () => {
    const res = await request(app).get("/api/events/search?category=not-a-real-category").expect(400);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
