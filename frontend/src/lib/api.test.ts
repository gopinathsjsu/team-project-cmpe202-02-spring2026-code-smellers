import { buildApiUrl } from "./buildApiUrl";

describe("buildApiUrl", () => {
  it("defaults to localhost:3000 when base is undefined", () => {
    expect(buildApiUrl(undefined, "/api/events/categories")).toBe(
      "http://localhost:3000/api/events/categories",
    );
  });

  it("strips trailing slash from base", () => {
    expect(buildApiUrl("http://localhost:3000/", "/api/foo")).toBe("http://localhost:3000/api/foo");
  });

  it("prefixes path with / when missing", () => {
    expect(buildApiUrl("http://api.example.com", "v1/events")).toBe("http://api.example.com/v1/events");
  });

  it("uses trimmed custom base from VITE-style env", () => {
    expect(buildApiUrl("  https://staging.example.com  ", "/api/x")).toBe("https://staging.example.com/api/x");
  });
});
