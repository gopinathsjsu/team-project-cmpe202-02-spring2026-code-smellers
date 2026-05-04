import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardAdmin from "./DashboardAdmin";

describe("DashboardAdmin page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.setItem("authToken", "test-admin-token");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          summary: { pendingCount: 0, approvedCount: 2, rejectedCount: 0, totalCount: 2 },
          pendingEvents: [],
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

  it("loads dashboard and shows moderation heading", async () => {
    render(
      <MemoryRouter>
        <DashboardAdmin />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Moderation Dashboard/i })).toBeInTheDocument();
    });
  });
});
