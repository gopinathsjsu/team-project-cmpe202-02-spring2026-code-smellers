jest.mock("../../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";
import { useAuth } from "../../auth/AuthProvider";

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderNav() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Navbar browseLocation="San Jose" onBrowseLocationChange={jest.fn()} />
    </MemoryRouter>,
  );
}

describe("Navbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows auth CTAs when unauthenticated", () => {
    mockedUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderNav();
    expect(screen.getByRole("link", { name: /Eventdull/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Log in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sign up/i })).toBeInTheDocument();
  });

  it("shows dashboard controls when authenticated", () => {
    mockedUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        id: "1",
        email: "a@b.com",
        display_name: "Alex Ray",
        is_admin: false,
        created_at: "t",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderNav();
    expect(screen.getByRole("button", { name: /Signed in as Alex Ray/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Dashboard$/i })).toBeInTheDocument();
  });
});
