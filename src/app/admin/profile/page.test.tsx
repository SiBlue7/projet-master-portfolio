import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProfilePage from "./page";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    publicProfile: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("AdminProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the public profile form with existing values", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findUnique.mockResolvedValue({
      displayName: "Enzo Chevalier",
      headline: "Étudiant M2 Cybersécurité",
      bio: "Présentation du portfolio.",
      contactEmail: "enzo@example.com",
      githubUrl: "https://github.com/SiBlue7",
      linkedinUrl: "https://www.linkedin.com/in/enzo-chevalier",
    });

    render(await AdminProfilePage());

    expect(
      screen.getByRole("heading", { name: "Informations du profil" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Enzo Chevalier")).toBeInTheDocument();
    expect(screen.getByDisplayValue("enzo@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enregistrer le profil" }),
    ).toBeInTheDocument();
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminProfilePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
