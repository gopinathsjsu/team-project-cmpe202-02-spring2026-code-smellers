import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import Forgot from "./Forgot";

describe("Forgot page", () => {
  it("renders heading and email field", () => {
    render(
      <MemoryRouter>
        <Forgot />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Forgot Password/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
  });
});
