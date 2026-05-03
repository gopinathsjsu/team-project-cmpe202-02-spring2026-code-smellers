import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import CreateEvent from "./CreateEvent";

describe("CreateEvent page", () => {
  it("renders main heading", () => {
    render(
      <MemoryRouter>
        <CreateEvent />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /Create an event/i })).toBeInTheDocument();
  });
});
