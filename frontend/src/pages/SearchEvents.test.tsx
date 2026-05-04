jest.mock("../hooks/useEventSearch", () => ({
  useEventSearch: jest.fn(),
}));

jest.mock("../auth/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import SearchEvents from "./SearchEvents";
import { useAuth } from "../auth/AuthProvider";
import { useEventSearch } from "../hooks/useEventSearch";

const mockUseEventSearch = useEventSearch as jest.MockedFunction<typeof useEventSearch>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("SearchEvents page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEventSearch.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshAuth: jest.fn(),
    });
  });

  it("shows heading and reflects query params", () => {
    render(
      <MemoryRouter initialEntries={["/search?q=jazz&loc=sf&category=music"]}>
        <SearchEvents />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Search results/i })).toBeInTheDocument();
    expect(screen.getByText(/jazz/i)).toBeInTheDocument();
    expect(screen.getByText(/music/i)).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseEventSearch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });
    render(
      <MemoryRouter initialEntries={["/search"]}>
        <SearchEvents />
      </MemoryRouter>,
    );
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});
