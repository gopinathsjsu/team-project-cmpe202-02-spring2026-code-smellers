jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import { AdminRoute } from "./AdminRoute";
import { useAuth } from "../auth/AuthProvider";

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderAdmin(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/" element={<div>Home</div>} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin area</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminRoute", () => {
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
    const { container } = renderAdmin("/admin");
    expect(container.firstChild).toBeNull();
  });

  it("redirects to login when unauthenticated", async () => {
    mockedUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderAdmin("/admin");
    expect(await screen.findByText("Login")).toBeInTheDocument();
  });

  it("redirects home when not admin", async () => {
    mockedUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        id: "1",
        email: "u@b.com",
        display_name: "U",
        is_admin: false,
        created_at: "t",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderAdmin("/admin");
    expect(await screen.findByText("Home")).toBeInTheDocument();
  });

  it("renders child when admin", () => {
    mockedUseAuth.mockReturnValue({
      status: "authenticated",
      user: {
        id: "1",
        email: "a@b.com",
        display_name: "A",
        is_admin: true,
        created_at: "t",
      },
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
    renderAdmin("/admin");
    expect(screen.getByText("Admin area")).toBeInTheDocument();
  });
});
