import request from "supertest";
import app from "../app";

describe("POST /api/auth/register validation", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "password123", name: "Test", is_admin: false })
      .expect(400);
    expect(res.body.error).toContain("email");
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "short", name: "Test", is_admin: false })
      .expect(400);
    expect(res.body.error).toMatch(/password|8/i);
  });
});

describe("POST /api/auth/login validation", () => {
  it("returns 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com" })
      .expect(400);
    expect(res.body.error).toContain("password");
  });
});

describe("GET /api/auth/me without token", () => {
  it("returns 401", async () => {
    const res = await request(app).get("/api/auth/me").expect(401);
    expect(res.body).toEqual(expect.objectContaining({ error: expect.any(String) }));
  });
});
