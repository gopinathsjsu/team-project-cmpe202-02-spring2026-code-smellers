jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../auth/AuthProvider";

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderProtectedRoute(initialPath: string, auth: ReturnType<typeof useAuth>) {
  mockedUseAuth.mockReturnValue(auth);

  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading while auth is loading", () => {
    renderProtectedRoute("/dashboard", {
      status: "loading",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login", async () => {
    const { findByText } = renderProtectedRoute("/dashboard", {
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    expect(await findByText("Login page")).toBeInTheDocument();
  });

  it("renders child route when authenticated", () => {
    renderProtectedRoute("/dashboard", {
      status: "authenticated",
      user: {
        id: "1",
        email: "a@b.com",
        display_name: "A",
        is_admin: false,
        created_at: "2020-01-01",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
