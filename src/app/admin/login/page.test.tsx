import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminLoginPage from "./page";

describe("AdminLoginPage", () => {
  it("renders the admin authentication form", () => {
    render(<AdminLoginPage />);

    expect(
      screen.getByRole("heading", { name: "Connexion administrateur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Connexion administrateur" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Pseudo")).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse e-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Se connecter" }),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    render(<AdminLoginPage />);

    const passwordInput = screen.getByLabelText("Mot de passe");
    const toggleButton = screen.getByRole("button", {
      name: "Afficher le mot de passe",
    });

    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(toggleButton);

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toBeInTheDocument();
  });
});
