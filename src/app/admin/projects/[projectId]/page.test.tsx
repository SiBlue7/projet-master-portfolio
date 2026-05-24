import { render, screen } from "@testing-library/react";
import { notFound, redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProjectDetailsPage from "./page";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: mocks.findUnique,
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("AdminProjectDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the project edit page", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findUnique.mockResolvedValue({
      id: "project-id",
      title: "Portfolio master",
      slug: "portfolio-master",
      shortDescription: "Portfolio administrable.",
      description: "Projet de portfolio avec administration.",
      status: "IN_PROGRESS",
      visibility: "PUBLIC",
      showDetails: true,
      showTechnologies: true,
      showExternalLinks: true,
      showMedia: true,
      showMetadata: true,
      repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
      demoUrl: "https://portfolio.justdoeat.org",
      startedAt: new Date(Date.UTC(2026, 0, 10)),
      endedAt: null,
      githubPushedAt: new Date(Date.UTC(2026, 4, 20, 8, 30)),
      githubVisibility: "private",
      githubIsPrivate: true,
      githubReadme: "# Portfolio\n\nImported README.",
      media: [
        {
          id: "media-id",
          altText: "Capture admin",
          fileName: "capture.png",
          imageData: new Uint8Array([1, 2, 3]),
          mimeType: "image/png",
          sortOrder: 0,
        },
      ],
      runbooks: [
        {
          id: "runbook-id",
          title: "Déploiement",
          slug: "deploiement",
          description: "Procédure de déploiement.",
          isActive: true,
          sortOrder: 0,
          environments: [
            {
              id: "environment-id",
              kind: "PREPROD",
              name: "Préproduction",
              slug: "preproduction",
              baseUrl: "https://preprod.justdoeat.org",
              sortOrder: 0,
            },
          ],
          steps: [
            {
              id: "step-id",
              environmentId: "environment-id",
              title: "Vérifier le healthcheck",
              description: "Contrôle de la route de santé.",
              type: "HTTP_REQUEST",
              command: null,
              url: "/api/health",
              httpMethod: "GET",
              expectedResult: "La route retourne ok.",
              isExecutable: true,
              sortOrder: 1,
            },
          ],
        },
      ],
      stacks: [
        {
          stack: {
            label: "Next.js",
            slug: "next-js",
          },
        },
        {
          stack: {
            label: "Prisma",
            slug: "prisma",
          },
        },
      ],
      tags: [
        {
          tag: {
            label: "En cours",
            slug: "en-cours",
          },
        },
      ],
    });

    render(
      await AdminProjectDetailsPage({
        params: Promise.resolve({
          projectId: "project-id",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Portfolio master" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Modifier le projet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Runbooks" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Synchronisation GitHub" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Synchroniser avec GitHub" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Déploiement")).toBeInTheDocument();
    expect(screen.getAllByText("Préproduction").length).toBeGreaterThan(0);
    expect(screen.getByText("Vérifier le healthcheck")).toBeInTheDocument();
    expect(screen.getAllByText(/GitHub/).length).toBeGreaterThan(2);
    expect(screen.getByText("private")).toBeInTheDocument();
    expect(screen.getByText("Oui")).toBeInTheDocument();
    expect(screen.getAllByText(/README/).length).toBeGreaterThan(0);
    expect(
      screen.getByText((content) => content.includes("# Portfolio")),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("portfolio-master")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Next.js, Prisma")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Capture admin" })).toHaveAttribute(
      "src",
      "data:image/png;base64,AQID",
    );
    expect(screen.getAllByRole("button", { name: "Enregistrer" }).length).toBe(
      3,
    );
    expect(screen.getAllByRole("button", { name: "Supprimer" }).length).toBe(2);
    expect(
      screen.getByRole("button", { name: "Supprimer le runbook" }),
    ).toBeInTheDocument();
  });

  it("returns not found for missing projects", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findUnique.mockResolvedValue(null);

    await expect(
      AdminProjectDetailsPage({
        params: Promise.resolve({
          projectId: "missing-project",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(
      AdminProjectDetailsPage({
        params: Promise.resolve({
          projectId: "project-id",
        }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
