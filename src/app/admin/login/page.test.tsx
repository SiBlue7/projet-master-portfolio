import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLoginPage from "./page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mocks.signIn,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the admin authentication form", () => {
    render(<AdminLoginPage />);

    expect(
      screen.getByRole("heading", { name: "Connexion administrateur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "Connexion administrateur" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Pseudo ou adresse e-mail"),
    ).toBeInTheDocument();
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

  it("signs in with credentials and redirects to admin", async () => {
    mocks.signIn.mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
      url: "http://localhost:3000/admin",
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Pseudo ou adresse e-mail"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith("credentials", {
        identifier: "admin@example.com",
        password: "password",
        redirect: false,
        callbackUrl: "/admin",
      });
    });
    expect(mocks.push).toHaveBeenCalledWith("/admin");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("renders an error when credentials are rejected", async () => {
    mocks.signIn.mockResolvedValue({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    });

    render(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText("Pseudo ou adresse e-mail"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "wrong-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Identifiants invalides.",
    );
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
