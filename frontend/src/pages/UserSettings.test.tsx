jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import UserSettings from "./UserSettings";
import { useAuth } from "../auth/AuthProvider";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("UserSettings page", () => {
  it("shows display name in header", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        id: "1",
        email: "sam@example.com",
        display_name: "Sam Lee",
        is_admin: false,
        created_at: "t",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    render(
      <MemoryRouter>
        <UserSettings />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Sam Lee" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /Account settings/i })).toBeInTheDocument();
  });
});
