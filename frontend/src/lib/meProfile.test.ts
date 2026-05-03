jest.mock("./api", () => ({
  apiUrl: (path: string) => `http://localhost:3000${path}`,
}));

jest.mock("./auth", () => ({
  getAuthToken: jest.fn(),
}));

import { getAuthToken } from "./auth";
import { patchMyDisplayName } from "./meProfile";

const mockedGetToken = getAuthToken as jest.MockedFunction<typeof getAuthToken>;

describe("patchMyDisplayName", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("throws when not signed in", async () => {
    mockedGetToken.mockReturnValue(null);
    await expect(patchMyDisplayName("Bob")).rejects.toThrow(/Not signed in/);
  });

  it("PATCHes profile and returns user", async () => {
    mockedGetToken.mockReturnValue("tok");
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "1", email: "a@b.com", display_name: "Bob", is_admin: false, created_at: "t" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = fetchMock;

    const out = await patchMyDisplayName("Bob");
    expect(out.user.display_name).toBe("Bob");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/users/me/profile",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      }),
    );
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body).toEqual({ display_name: "Bob" });
  });
});
