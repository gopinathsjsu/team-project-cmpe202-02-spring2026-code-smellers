import { addressUpToCity } from "./addressDisplay";

describe("addressUpToCity", () => {
  it("returns empty string for whitespace-only input", () => {
    expect(addressUpToCity("   ")).toBe("");
  });

  it("strips country then trailing state segment", () => {
    expect(addressUpToCity("San Jose, CA, United States")).toBe("San Jose");
  });

  it("removes trailing state + ZIP segment", () => {
    expect(addressUpToCity("123 Main St, San Jose, CA 95112")).toBe("123 Main St, San Jose");
  });

  it("returns original when nothing remains after stripping", () => {
    expect(addressUpToCity("CA 95112")).toBe("CA 95112");
  });
});
