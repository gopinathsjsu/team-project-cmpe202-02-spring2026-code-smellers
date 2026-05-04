import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardOrganizer from "./DashboardOrganizer";

describe("DashboardOrganizer page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.setItem("authToken", "org-token");
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ currentEvents: [], pastEvents: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  afterEach(() => {
    window.localStorage.removeItem("authToken");
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("loads and shows performance heading", async () => {
    render(
      <MemoryRouter>
        <DashboardOrganizer />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Event performance at a glance/i }),
      ).toBeInTheDocument();
    });
  });
});
