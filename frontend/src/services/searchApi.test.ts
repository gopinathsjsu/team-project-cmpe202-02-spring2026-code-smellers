import { searchEvents } from "./searchApi";

describe("searchEvents", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("requests relative /api/events/search when env base is empty", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    global.fetch = fetchMock;

    await searchEvents({ query: "", location: "", category: "" });

    expect(fetchMock).toHaveBeenCalledWith("/api/events/search");
  });

  it("builds query string for q, loc, and category", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    global.fetch = fetchMock;

    await searchEvents({ query: " jazz ", location: " san jose ", category: "music" });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("/api/events/search?");
    expect(url).toContain("q=jazz");
    expect(url).toContain("loc=san+jose");
    expect(url).toContain("category=music");
  });

  it("throws with response text when request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response("bad category", { status: 400, statusText: "Bad Request" }),
    );

    await expect(searchEvents({ query: "", location: "", category: "bad" })).rejects.toThrow(/bad category|400/);
  });

  it("returns parsed JSON on success", async () => {
    const payload = [{ id: "1", title: "T", date: "D", location: "L" }];
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } }),
    );

    await expect(searchEvents({ query: "x", location: "", category: "" })).resolves.toEqual(payload);
  });
});
