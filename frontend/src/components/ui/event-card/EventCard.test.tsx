import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCard } from "./EventCard";

describe("EventCard", () => {
  it("links to event details", () => {
    render(
      <MemoryRouter>
        <EventCard id="42" title="Gig" date="Sat" location="San Jose" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /Gig/i })).toHaveAttribute("href", "/events/42");
  });

  it("calls onSaveToggle when heart is clicked", async () => {
    const user = userEvent.setup();
    const onSaveToggle = jest.fn();
    render(
      <MemoryRouter>
        <EventCard id="7" title="Show" date="Sun" location="Oakland" onSaveToggle={onSaveToggle} />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: /Add to favorites/i }));
    expect(onSaveToggle).toHaveBeenCalledWith("7");
  });
});
