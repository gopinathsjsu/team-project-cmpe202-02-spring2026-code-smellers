jest.mock("./api", () => ({
  apiUrl: (path: string) => `http://localhost:3000${path}`,
}));

jest.mock("./auth", () => ({
  getAuthToken: jest.fn(),
}));

import { getAuthToken } from "./auth";
import { addSavedEvent, fetchMySavedEvents, removeSavedEvent } from "./meSaved";

const mockedGetToken = getAuthToken as jest.MockedFunction<typeof getAuthToken>;

describe("fetchMySavedEvents", () => {
  it("throws when not signed in", async () => {
    mockedGetToken.mockReturnValue(null);
    await expect(fetchMySavedEvents()).rejects.toThrow(/Not signed in/);
  });

  it("returns events", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ events: [{ eventId: "1", title: "E", date: "d", location: "l" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const events = await fetchMySavedEvents();
    expect(events).toHaveLength(1);
  });
});

describe("addSavedEvent", () => {
  it("resolves on 201/200", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 201 }));

    await expect(addSavedEvent("99")).resolves.toBeUndefined();
  });

  it("throws with server error message", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "nope" }), { status: 400, headers: { "Content-Type": "application/json" } }),
    );

    await expect(addSavedEvent("99")).rejects.toThrow("nope");
  });
});

describe("removeSavedEvent", () => {
  it("resolves on 204", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(removeSavedEvent("99")).resolves.toBeUndefined();
  });
});
