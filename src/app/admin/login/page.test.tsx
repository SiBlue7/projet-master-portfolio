import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  it("renders the admin authentication page without a form", () => {
    render(<AdminLoginPage />);

    expect(
      screen.getByRole("heading", { name: "Connexion administrateur" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });
});
