jest.mock("./auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { useAuth } from "./auth/AuthProvider";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("App", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });

    global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/events/categories")) {
        return Promise.resolve(
          new Response(JSON.stringify({ categories: ["music"] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      if (url.includes("/api/events?")) {
        return Promise.resolve(
          new Response(
            JSON.stringify([{ id: "1", title: "Concert Night", date: "Sat", location: "San Jose" }]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("renders home at /", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /Find your next favorite experience in minutes/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Concert Night")).toBeInTheDocument();
    });
  });

  it("renders register without global chrome", () => {
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Welcome Aboard!" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Find your next favorite experience in minutes/i }),
    ).not.toBeInTheDocument();
  });
});
