import { theme } from "./theme";

describe("theme", () => {
  it("exposes brand and surface tokens", () => {
    expect(theme.colors.brand[600]).toMatch(/^#/);
    expect(theme.colors.surface.raised).toBe("#ffffff");
  });

  it("has font and spacing scales", () => {
    expect(theme.fontSizes.base).toBe("1rem");
    expect(theme.spacing[4]).toBe("1rem");
  });
});
