import { render, screen } from "@testing-library/react";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("shows required asterisk when required", () => {
    render(
      <FormField label="Email" htmlFor="email" required>
        <input id="email" />
      </FormField>,
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows hint when no error", () => {
    render(
      <FormField label="Name" htmlFor="name" hint="Use your real name">
        <input id="name" />
      </FormField>,
    );
    expect(screen.getByText("Use your real name")).toBeInTheDocument();
  });

  it("shows error instead of hint when error is set", () => {
    render(
      <FormField label="Name" htmlFor="name" hint="Use your real name" error="Too short">
        <input id="name" />
      </FormField>,
    );
    expect(screen.queryByText("Use your real name")).not.toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Too short");
  });
});
