import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("renders brand and default columns", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /Eventdull/i })).toBeInTheDocument();
    expect(screen.getByText("Discover and create events that matter.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Company/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse Events" })).toHaveAttribute("href", "/events");
  });
});
