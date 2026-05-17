import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the admin page for authenticated users", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });

    render(await AdminPage());

    expect(
      screen.getByRole("heading", { name: "Administration" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Connecté en tant que admin.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Se déconnecter" }),
    ).toBeInTheDocument();
  });

  it("signs out authenticated users", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.signOut.mockResolvedValue(undefined);

    render(await AdminPage());

    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledWith({
        callbackUrl: "/admin/login",
      });
    });
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
