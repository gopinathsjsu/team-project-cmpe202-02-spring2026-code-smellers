import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import EditEvent from "./EditEvent";

describe("EditEvent page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.setItem("authToken", "tok");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event: {
            id: 5,
            title: "Workshop",
            start_date_time: "2026-02-01T15:00:00.000Z",
            end_date_time: "2026-02-01T17:00:00.000Z",
            capacity: 30,
            rsvp_count: 3,
            approval_status: "approved",
            locations: null,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
  });

  afterEach(() => {
    window.localStorage.removeItem("authToken");
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("loads event and shows edit heading", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard-organizer/events/5/edit"]}>
        <Routes>
          <Route path="dashboard-organizer/events/:id/edit" element={<EditEvent />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Edit event/i })).toBeInTheDocument();
    });
    expect(screen.getByText("Workshop")).toBeInTheDocument();
  });
});
