jest.mock("../lib/meTickets", () => ({
  fetchMyTickets: jest.fn(),
}));

jest.mock("../lib/meSaved", () => ({
  fetchMySavedEvents: jest.fn(),
}));

jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardUser from "./DashboardUser";
import { fetchMyTickets } from "../lib/meTickets";
import { fetchMySavedEvents } from "../lib/meSaved";
import { useAuth } from "../auth/AuthProvider";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("DashboardUser page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchMyTickets as jest.Mock).mockResolvedValue([]);
    (fetchMySavedEvents as jest.Mock).mockResolvedValue([]);
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        id: "user-1",
        email: "alex@example.com",
        display_name: "Alex Ray",
        is_admin: false,
        created_at: "2020-01-01T00:00:00Z",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
  });

  it("shows user display name in hero", async () => {
    render(
      <MemoryRouter>
        <DashboardUser />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Alex Ray" })).toBeInTheDocument();
    });
  });
});
