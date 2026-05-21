import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

const mocks = vi.hoisted(() => ({
  findProfileTimelineItems: vi.fn(),
  findProjects: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: mocks.findProjects,
    },
    profileTimelineItem: {
      findMany: mocks.findProfileTimelineItems,
    },
    publicProfile: {
      findUnique: mocks.findUnique,
    },
  },
}));

describe("Home", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findProfileTimelineItems.mockResolvedValue([]);
    mocks.findProjects.mockResolvedValue([]);
  });

  it("renders the public profile", async () => {
    mocks.findUnique.mockResolvedValue({
      displayName: "Enzo Chevalier",
      headline: "Étudiant M2 Cybersécurité",
      bio: "Portfolio orienté cybersécurité et développement fullstack.",
      contactEmail: "enzo@example.com",
      githubUrl: "https://github.com/SiBlue7",
      linkedinUrl: "https://www.linkedin.com/in/enzo-chevalier",
      avatarData: new Uint8Array([1, 2, 3]),
      avatarMimeType: "image/png",
    });

    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Enzo Chevalier" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Étudiant M2 Cybersécurité")).toHaveLength(2);
    expect(
      screen.getByText(
        "Portfolio orienté cybersécurité et développement fullstack.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "GitHub" })[0]).toHaveAttribute(
      "href",
      "https://github.com/SiBlue7",
    );
    expect(
      screen.getAllByRole("link", { name: "LinkedIn" })[0],
    ).toHaveAttribute("href", "https://www.linkedin.com/in/enzo-chevalier");
    expect(
      screen.getByRole("img", { name: "Avatar de Enzo Chevalier" }),
    ).toHaveAttribute("src", "data:image/png;base64,AQID");
  });

  it("renders public timeline items grouped by type", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findProfileTimelineItems.mockResolvedValue([
      {
        id: "formation-id",
        type: "FORMATION",
        title: "Master 2 Cybersécurité",
        organization: "Ynov Campus",
        location: "Lyon",
        description: "Formation orientée sécurité applicative et cloud.",
        startDate: new Date(Date.UTC(2025, 8, 1)),
        endDate: null,
        isCurrent: true,
      },
      {
        id: "formation-id-2",
        type: "FORMATION",
        title: "Bachelor informatique",
        organization: "Université",
        location: "Lille",
        description: null,
        startDate: new Date(Date.UTC(2022, 8, 1)),
        endDate: new Date(Date.UTC(2025, 5, 1)),
        isCurrent: false,
      },
      {
        id: "formation-id-3",
        type: "FORMATION",
        title: "DUT informatique",
        organization: "IUT",
        location: null,
        description: null,
        startDate: new Date(Date.UTC(2020, 8, 1)),
        endDate: new Date(Date.UTC(2022, 5, 1)),
        isCurrent: false,
      },
      {
        id: "formation-id-4",
        type: "FORMATION",
        title: "Baccalauréat",
        organization: "Lycée",
        location: null,
        description: null,
        startDate: new Date(Date.UTC(2019, 8, 1)),
        endDate: new Date(Date.UTC(2020, 5, 1)),
        isCurrent: false,
      },
      {
        id: "experience-id",
        type: "EXPERIENCE",
        title: "Alternant cybersécurité",
        organization: "Entreprise",
        location: null,
        description: null,
        startDate: new Date(Date.UTC(2024, 8, 1)),
        endDate: new Date(Date.UTC(2025, 7, 1)),
        isCurrent: false,
      },
      {
        id: "certification-id",
        type: "CERTIFICATION",
        title: "Certification sécurité",
        organization: "Organisme",
        location: null,
        description: "Validation de compétences techniques.",
        startDate: null,
        endDate: null,
        isCurrent: false,
      },
    ]);

    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Formation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Expérience" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Certification" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Master 2 Cybersécurité")).toBeInTheDocument();
    expect(screen.getByText("Ynov Campus · Lyon")).toBeInTheDocument();
    expect(
      screen.getByText("Septembre 2025 - Aujourd'hui"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Voir les éléments précédents de Formation",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Voir les éléments suivants de Formation",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alternant cybersécurité")).toBeInTheDocument();
    expect(screen.getByText("Certification sécurité")).toBeInTheDocument();
  });

  it("renders a polished fallback when no profile exists yet", async () => {
    mocks.findUnique.mockResolvedValue(null);

    render(await Home());

    expect(
      screen.getByRole("heading", { name: "Portfolio technique" }),
    ).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL + Prisma")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Parcours" }),
    ).not.toBeInTheDocument();
  });

  it("renders public projects with detail links", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findProjects.mockResolvedValue([
      {
        id: "project-id",
        title: "Portfolio master",
        slug: "portfolio-master",
        shortDescription: "Portfolio administrable.",
        status: "IN_PROGRESS",
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        startedAt: new Date(Date.UTC(2026, 0, 1)),
        endedAt: null,
      },
      {
        id: "project-id-2",
        title: "API sécurité",
        slug: "api-securite",
        shortDescription: "API orientée authentification et audit.",
        status: "COMPLETED",
        repositoryUrl: null,
        demoUrl: null,
        startedAt: new Date(Date.UTC(2025, 8, 1)),
        endedAt: new Date(Date.UTC(2026, 1, 1)),
      },
      {
        id: "project-id-3",
        title: "Dashboard SOC",
        slug: "dashboard-soc",
        shortDescription: "Visualisation de signaux de sécurité.",
        status: "DRAFT",
        repositoryUrl: null,
        demoUrl: null,
        startedAt: null,
        endedAt: null,
      },
    ]);

    render(await Home());

    expect(
      screen.getByRole("heading", {
        name: "Des réalisations pensées comme des produits complets",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.getByText("API sécurité")).toBeInTheDocument();
    expect(screen.getByText("Dashboard SOC")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "Voir les détails" })[0],
    ).toHaveAttribute("href", "/projects/portfolio-master");
    expect(
      screen.getByRole("button", { name: "Voir les projets précédents" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Voir les projets suivants" }),
    ).toBeInTheDocument();
    expect(mocks.findProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          visibility: "PUBLIC",
        },
      }),
    );
  });
});
