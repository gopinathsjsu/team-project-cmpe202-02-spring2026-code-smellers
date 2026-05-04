jest.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "unauthenticated" as const,
    user: null,
    login: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn(),
    refreshAuth: jest.fn(),
  }),
}));

import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import Login from "./Login";

describe("Login page", () => {
  it("renders welcome heading", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Welcome Back/i })).toBeInTheDocument();
  });
});
