jest.mock("../services/searchApi");

import { renderHook, waitFor } from "@testing-library/react";
import { searchEvents } from "../services/searchApi";
import { useEventSearch } from "./useEventSearch";

const mockedSearchEvents = searchEvents as jest.MockedFunction<typeof searchEvents>;

describe("useEventSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads data and clears loading", async () => {
    mockedSearchEvents.mockResolvedValue([
      { id: "1", title: "Concert", date: "Sat", location: "Here" },
    ]);

    const { result } = renderHook(() =>
      useEventSearch({ query: "c", location: "sj", category: "music" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual([
      { id: "1", title: "Concert", date: "Sat", location: "Here" },
    ]);
    expect(mockedSearchEvents).toHaveBeenCalledWith({
      query: "c",
      location: "sj",
      category: "music",
    });
  });

  it("sets error when searchEvents rejects", async () => {
    mockedSearchEvents.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useEventSearch({ query: "x", location: "", category: "" }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("network down");
  });
});
