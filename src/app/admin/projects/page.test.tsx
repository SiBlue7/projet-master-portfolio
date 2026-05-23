import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProjectsPage from "./page";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: mocks.findMany,
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

describe("AdminProjectsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders project management with existing projects", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findMany.mockResolvedValue([
      {
        id: "project-id",
        title: "Portfolio master",
        slug: "portfolio-master",
        shortDescription: "Portfolio administrable.",
        description: "Projet de portfolio avec administration.",
        status: "IN_PROGRESS",
        visibility: "PUBLIC",
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        startedAt: new Date(Date.UTC(2026, 0, 10)),
        endedAt: null,
        tags: [
          {
            tag: {
              label: "En cours",
              slug: "en-cours",
            },
          },
        ],
      },
    ]);

    render(await AdminProjectsPage());

    expect(
      screen.getByRole("heading", { name: "Gestion des projets" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Créer un projet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projets existants" }),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText("Titre").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Slug").length).toBeGreaterThan(0);
    expect(
      screen.getAllByLabelText("Description courte").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByLabelText("Description complète").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Tag de tri").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Statut").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Visibilité").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Lien GitHub").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Lien démo").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Date de début").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Date de fin").length).toBeGreaterThan(0);
    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.getByText("portfolio-master")).toBeInTheDocument();
    expect(screen.getByText("Portfolio administrable.")).toBeInTheDocument();
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Public").length).toBeGreaterThan(0);
    expect(screen.getByText("Modifier")).toBeInTheDocument();
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminProjectsPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
