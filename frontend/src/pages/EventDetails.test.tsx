jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import EventDetails from "./EventDetails";
import { useAuth } from "../auth/AuthProvider";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("EventDetails page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : String(input);
      if (url.includes("/related")) {
        return Promise.resolve(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }));
      }
      if (url.includes("/api/events/42") && !url.includes("/related") && !url.includes("/tickets")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: 42,
              title: "Jazz Night",
              description: "Live music.",
              start_date_time: "2026-07-04T19:00:00.000Z",
              end_date_time: "2026-07-04T21:00:00.000Z",
              image_url: null,
              category: "music",
              capacity: 100,
              rsvp_count: 5,
              locations: { venue_name: "Hall", address: "1 Main St" },
              organizer: { id: "o1", display_name: "Alex" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("loads event and shows title", async () => {
    render(
      <MemoryRouter initialEntries={["/events/42"]}>
        <Routes>
          <Route path="/events/:id" element={<EventDetails />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Jazz Night" })).toBeInTheDocument();
    });
    expect(screen.getByText(/About this event/i)).toBeInTheDocument();
  });
});
