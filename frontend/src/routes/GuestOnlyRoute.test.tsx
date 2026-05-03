jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import { GuestOnlyRoute } from "./GuestOnlyRoute";
import { useAuth } from "../auth/AuthProvider";

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderGuest(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route element={<GuestOnlyRoute />}>
          <Route path="/register" element={<div>Register form</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("GuestOnlyRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing while loading", () => {
    mockedUseAuth.mockReturnValue({
      status: "loading",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    const { container } = renderGuest("/register");
    expect(container.firstChild).toBeNull();
  });

  it("redirects home when authenticated", async () => {
    mockedUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        id: "1",
        email: "a@b.com",
        display_name: "A",
        is_admin: false,
        created_at: "t",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderGuest("/register");
    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("renders child when unauthenticated", () => {
    mockedUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderGuest("/register");
    expect(screen.getByText("Register form")).toBeInTheDocument();
  });
});
