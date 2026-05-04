jest.mock("./api", () => ({
  apiUrl: (path: string) => `http://localhost:3000${path}`,
}));

jest.mock("./auth", () => ({
  getAuthToken: jest.fn(),
}));

import { getAuthToken } from "./auth";
import { fetchMyTicketForEvent, fetchMyTickets } from "./meTickets";

const mockedGetToken = getAuthToken as jest.MockedFunction<typeof getAuthToken>;

describe("fetchMyTickets", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("throws when not signed in", async () => {
    mockedGetToken.mockReturnValue(null);
    await expect(fetchMyTickets("upcoming")).rejects.toThrow(/Not signed in/);
  });

  it("returns tickets array", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ tickets: [{ ticketId: 1, eventId: "e", title: "T", date: "d", location: "l", rsvpStatus: "pending" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const list = await fetchMyTickets("past");
    expect(list).toHaveLength(1);
    expect(list[0].ticketId).toBe(1);
  });
});

describe("fetchMyTicketForEvent", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when ticket is null", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ticket: null }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(fetchMyTicketForEvent("5")).resolves.toBeNull();
  });

  it("throws on invalid shape", async () => {
    mockedGetToken.mockReturnValue("t");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ticket: "nope" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(fetchMyTicketForEvent("5")).rejects.toThrow(/Invalid response shape/);
  });
});
