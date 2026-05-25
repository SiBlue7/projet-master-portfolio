import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("link", { name: "Accueil" })).toHaveAttribute(
      "href",
      "#accueil",
    );
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "#contact",
    );
    expect(screen.getByText("Portfolio M2 Cyber")).toBeInTheDocument();
    expect(screen.getByText("Fullstack & sécurité")).toBeInTheDocument();
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
    expect(screen.getByText("cybersécurité applicative")).toBeInTheDocument();
    expect(screen.getByText("Cloudflare")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Échanger autour d'une opportunité/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "enzo@example.com" }).at(-1),
    ).toHaveAttribute("href", "mailto:enzo@example.com");
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

    expect(screen.getByRole("link", { name: "Parcours" })).toHaveAttribute(
      "href",
      "#parcours",
    );
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
    expect(screen.getByRole("link", { name: "Projets" })).toHaveAttribute(
      "href",
      "#projets",
    );
    expect(
      screen.getByText("Aucun projet public pour le moment"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 projets publics")).toBeInTheDocument();
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
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        startedAt: new Date(Date.UTC(2026, 0, 1)),
        endedAt: null,
        media: [
          {
            id: "project-media-id",
            altText: "Capture portfolio",
            imageData: new Uint8Array([1, 2, 3]),
            mimeType: "image/png",
          },
          {
            id: "project-media-id-2",
            altText: "Capture admin",
            imageData: new Uint8Array([4, 5, 6]),
            mimeType: "image/png",
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
      },
      {
        id: "project-id-2",
        title: "API sécurité",
        slug: "api-securite",
        shortDescription: "API orientée authentification et audit.",
        status: "COMPLETED",
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
        repositoryUrl: null,
        demoUrl: null,
        startedAt: new Date(Date.UTC(2025, 8, 1)),
        endedAt: new Date(Date.UTC(2026, 1, 1)),
        media: [],
        stacks: [
          {
            stack: {
              label: "Node.js",
              slug: "node-js",
            },
          },
        ],
        tags: [
          {
            tag: {
              label: "Terminé",
              slug: "termine",
            },
          },
        ],
      },
      {
        id: "project-id-3",
        title: "Dashboard SOC",
        slug: "dashboard-soc",
        shortDescription: "Visualisation de signaux de sécurité.",
        status: "DRAFT",
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
        repositoryUrl: null,
        demoUrl: null,
        startedAt: null,
        endedAt: null,
        media: [],
        stacks: [
          {
            stack: {
              label: "React",
              slug: "react",
            },
          },
        ],
        tags: [
          {
            tag: {
              label: "Archivé",
              slug: "archive",
            },
          },
        ],
      },
    ]);

    render(await Home());

    expect(screen.getByRole("link", { name: "Projets" })).toHaveAttribute(
      "href",
      "#projets",
    );
    expect(
      screen.getByRole("heading", {
        name: "Des réalisations pensées comme des produits complets",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.getByText("API sécurité")).toBeInTheDocument();
    expect(screen.getByText("Dashboard SOC")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Capture portfolio" }),
    ).toHaveAttribute("src", "data:image/png;base64,AQID");
    fireEvent.click(
      screen.getByRole("button", {
        name: "Capture suivante du projet Portfolio master",
      }),
    );
    expect(screen.getByRole("img", { name: "Capture admin" })).toHaveAttribute(
      "src",
      "data:image/png;base64,BAUG",
    );
    expect(
      screen.getAllByRole("link", { name: "Détails publics" })[0],
    ).toHaveAttribute("href", "/projects/portfolio-master");
    expect(screen.getAllByText("Média à venir").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Voir les projets précédents" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Voir les projets suivants" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tous les projets" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Next.js").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Prisma").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Terminé").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Archivé").length).toBeGreaterThan(0);
    expect(mocks.findProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          visibility: "PUBLIC",
        },
      }),
    );
  });

  it("hides public project card sections with fine visibility settings", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findProjects.mockResolvedValue([
      {
        id: "project-id",
        title: "Portfolio master",
        slug: "portfolio-master",
        shortDescription: "Portfolio administrable.",
        status: "IN_PROGRESS",
        showTechnologies: false,
        showExternalLinks: false,
        showMedia: false,
        showMetadata: false,
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        startedAt: new Date(Date.UTC(2026, 0, 1)),
        endedAt: null,
        media: [
          {
            id: "project-media-id",
            altText: "Capture portfolio",
            imageData: new Uint8Array([1, 2, 3]),
            mimeType: "image/png",
          },
        ],
        stacks: [
          {
            stack: {
              label: "Next.js",
              slug: "next-js",
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
      },
    ]);

    render(await Home());

    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.queryByText("Depuis Janvier 2026")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Technologies du projet Portfolio master"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Capture portfolio" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "GitHub" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Démo" }),
    ).not.toBeInTheDocument();
  });
});
