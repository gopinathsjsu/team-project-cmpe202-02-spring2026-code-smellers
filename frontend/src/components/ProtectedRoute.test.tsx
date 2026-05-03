import { MemoryRouter, Route, Routes } from "react-router";
import { render, screen } from "@testing-library/react";
import ProtectedRoute from "./ProtectedRoute";

describe("components/ProtectedRoute (localStorage)", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("redirects to login when no authToken", () => {
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("renders outlet when authToken is set", () => {
    window.localStorage.setItem("authToken", "yes");
    render(
      <MemoryRouter initialEntries={["/secret"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>Secret</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText("Secret")).toBeInTheDocument();
  });
});
