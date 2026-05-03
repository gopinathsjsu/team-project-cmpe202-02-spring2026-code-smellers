jest.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "unauthenticated" as const,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
    refreshAuth: jest.fn(),
  }),
}));

import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import ComponentDemo from "./ComponentDemo";

describe("ComponentDemo page", () => {
  it("renders reference heading", () => {
    render(
      <MemoryRouter>
        <ComponentDemo />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Component reference/i })).toBeInTheDocument();
  });
});
