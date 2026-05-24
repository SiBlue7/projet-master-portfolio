import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProjectsPage from "./page";

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

describe("AdminProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders project creation and GitHub import forms", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });

    render(await AdminProjectsPage());

    expect(
      screen.getByRole("heading", { name: "Gestion des projets" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Créer un projet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Importer depuis GitHub" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir les projets existants" }),
    ).toHaveAttribute("href", "/admin/projects/list");
    expect(
      screen.queryByRole("heading", { name: "Projets existants" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Titre")).toBeInTheDocument();
    expect(screen.getByLabelText("Slug")).toBeInTheDocument();
    expect(screen.getByLabelText("Description courte")).toBeInTheDocument();
    expect(screen.getByLabelText("Description complète")).toBeInTheDocument();
    expect(screen.getByLabelText("Tag de tri")).toBeInTheDocument();
    expect(screen.getByLabelText("Technologies utilisées")).toBeInTheDocument();
    expect(screen.getByLabelText("Statut")).toBeInTheDocument();
    expect(screen.getByLabelText("Visibilité")).toBeInTheDocument();
    expect(screen.getByLabelText("URL GitHub du dépôt")).toBeInTheDocument();
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminProjectsPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
