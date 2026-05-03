import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<Input id="pw" type="password" defaultValue="secret123" />);
    const field = screen.getByDisplayValue("secret123");
    expect(field).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByDisplayValue("secret123")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByDisplayValue("secret123")).toHaveAttribute("type", "password");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input id="e" error="Bad" aria-label="Email" />);
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
  });
});
