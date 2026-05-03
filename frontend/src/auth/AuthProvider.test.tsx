import { render } from "@testing-library/react";
import { useAuth } from "./AuthProvider";

function BadConsumer() {
  useAuth();
  return null;
}

describe("AuthProvider", () => {
  it("useAuth throws when used outside provider", () => {
    expect(() => render(<BadConsumer />)).toThrow(/useAuth must be used within AuthProvider/);
  });
});
