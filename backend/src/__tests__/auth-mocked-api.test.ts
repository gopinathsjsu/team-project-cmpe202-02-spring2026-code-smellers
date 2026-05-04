jest.mock("../services/auth.service");

import request from "supertest";
import * as authService from "../services/auth.service";
import app from "../app";

const mockedAuth = authService as jest.Mocked<typeof authService>;

describe("POST /api/auth/register (mocked service)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 201 when registration succeeds", async () => {
    mockedAuth.registerUser.mockResolvedValue({
      ok: true,
      user: { id: "u1", email: "x@y.com" },
      session: { access_token: "tok" },
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "x@y.com",
        password: "password12",
        name: "Test User",
        is_admin: false,
      })
      .expect(201);

    expect(res.body).toEqual(
      expect.objectContaining({
        user: expect.any(Object),
        session: expect.any(Object),
      }),
    );
    expect(mockedAuth.registerUser).toHaveBeenCalled();
  });

  it("returns 400 when service rejects", async () => {
    mockedAuth.registerUser.mockResolvedValue({
      ok: false,
      error: "Email taken",
      status: 400,
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "taken@y.com",
        password: "password12",
        name: "Test",
        is_admin: false,
      })
      .expect(400);

    expect(res.body.error).toBe("Email taken");
  });
});

describe("POST /api/auth/login (mocked service)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 when login succeeds", async () => {
    mockedAuth.loginWithPassword.mockResolvedValue({
      ok: true,
      user: { id: "u1" },
      session: { access_token: "tok" },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "x@y.com", password: "password12" })
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        user: expect.any(Object),
        session: expect.any(Object),
      }),
    );
  });
});
