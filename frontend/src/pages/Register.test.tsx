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
import Register from "./Register";

describe("Register page", () => {
  it("renders welcome heading", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Welcome Aboard/i })).toBeInTheDocument();
  });
});
