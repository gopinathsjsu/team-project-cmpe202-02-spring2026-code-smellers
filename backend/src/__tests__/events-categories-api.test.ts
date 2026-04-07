import request from "supertest";
import app from "../app";
import { Constants } from "../types/database.types";

describe("GET /api/events/categories", () => {
  it("responds 200 with a categories array", async () => {
    const res = await request(app).get("/api/events/categories").expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        categories: expect.any(Array),
      }),
    );
  });

  it("omits charity from the list", async () => {
    const res = await request(app).get("/api/events/categories").expect(200);
    expect(res.body.categories).not.toContain("charity");
  });

  it("returns every non-charity enum value from the shared constants", async () => {
    const expected = Constants.public.Enums.event_category.filter((c) => c !== "charity");
    const res = await request(app).get("/api/events/categories").expect(200);
    expect(res.body.categories).toEqual(expected);
  });
});
