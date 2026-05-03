import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import OrganizerAttendees from "./OrganizerAttendees";

describe("OrganizerAttendees page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.setItem("authToken", "tok");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          event: { id: 9, title: "Meetup", capacity: 50, rsvp_count: 2 },
          attendees: [],
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

  it("loads and shows attendee management heading", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard-organizer/events/9/attendees"]}>
        <Routes>
          <Route path="dashboard-organizer/events/:id/attendees" element={<OrganizerAttendees />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Attendee management/i })).toBeInTheDocument();
    });
  });
});
