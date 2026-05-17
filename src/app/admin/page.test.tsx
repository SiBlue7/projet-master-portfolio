import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
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
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
