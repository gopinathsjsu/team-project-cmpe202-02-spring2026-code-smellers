import { AUTH_TOKEN_KEY, clearAuthToken, getAuthToken, setAuthToken } from "./auth";

describe("auth token helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns null when no token is stored", () => {
    expect(getAuthToken()).toBeNull();
  });

  it("round-trips token via localStorage", () => {
    setAuthToken("abc123");
    expect(window.localStorage.getItem(AUTH_TOKEN_KEY)).toBe("abc123");
    expect(getAuthToken()).toBe("abc123");
  });

  it("clearAuthToken removes the key", () => {
    setAuthToken("x");
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });
});
