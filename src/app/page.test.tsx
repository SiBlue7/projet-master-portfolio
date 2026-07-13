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
      headline: "fullstack & cybersécurité.",
      bio: "Portfolio orienté cybersécurité et développement fullstack.",
      contactEmail: "enzo@example.com",
      githubUrl: "https://github.com/SiBlue7",
      linkedinUrl: "https://www.linkedin.com/in/enzo-chevalier",
      avatarData: new Uint8Array([1, 2, 3]),
      avatarMimeType: "image/png",
    });

    render(await Home());

    expect(screen.getByRole("link", { name: "./projets" })).toHaveAttribute(
      "href",
      "#projets",
    );
    expect(screen.getByRole("link", { name: "./contact" })).toHaveAttribute(
      "href",
      "#contact",
    );
    expect(screen.getByRole("link", { name: "./stats" })).toHaveAttribute(
      "href",
      "/statistics",
    );
    expect(
      screen.getByRole("heading", { name: /Enzo Chevalier/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("fullstack & cybersécurité.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Portfolio orienté cybersécurité et développement fullstack.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "github ↗" })).toHaveAttribute(
      "href",
      "https://github.com/SiBlue7",
    );
    expect(
      screen.getByRole("img", { name: "Portrait de Enzo Chevalier" }),
    ).toHaveAttribute("src", "data:image/png;base64,AQID");
    expect(
      screen.getByRole("link", { name: "→ enzo@example.com" }),
    ).toHaveAttribute("href", "mailto:enzo@example.com");
    expect(
      screen.getByRole("link", {
        name: "→ www.linkedin.com/in/enzo-chevalier",
      }),
    ).toHaveAttribute("href", "https://www.linkedin.com/in/enzo-chevalier");
    expect(screen.getByText("Cloudflare")).toBeInTheDocument();
  });

  it("renders timeline items with formatted periods", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findProfileTimelineItems.mockResolvedValue([
      {
        id: "formation-id",
        title: "Master 2 Cybersécurité",
        organization: "Ynov Campus",
        description: "Formation orientée sécurité applicative et cloud.",
        startDate: new Date(Date.UTC(2025, 8, 1)),
        endDate: null,
        isCurrent: true,
      },
      {
        id: "experience-id",
        title: "Alternant cybersécurité",
        organization: "Entreprise",
        description: null,
        startDate: new Date(Date.UTC(2024, 8, 1)),
        endDate: new Date(Date.UTC(2025, 7, 1)),
        isCurrent: false,
      },
    ]);

    render(await Home());

    expect(screen.getByText("Master 2 Cybersécurité")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ynov Campus — Formation orientée sécurité applicative et cloud.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Septembre 2025 - Aujourd'hui"),
    ).toBeInTheDocument();
    expect(screen.getByText("Septembre 2024 - Août 2025")).toBeInTheDocument();
    expect(screen.getByText("Alternant cybersécurité")).toBeInTheDocument();
  });

  it("renders a fallback profile when none exists yet", async () => {
    mocks.findUnique.mockResolvedValue(null);

    render(await Home());

    expect(
      screen.getByRole("heading", { name: /Enzo Chevalier/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("// portrait — à renseigner depuis le dashboard"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "github ↗" }),
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
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        media: [
          {
            id: "project-media-id",
            altText: "Capture portfolio",
            imageData: new Uint8Array([1, 2, 3]),
            mimeType: "image/png",
          },
        ],
        stacks: [
          { stack: { label: "Next.js" } },
          { stack: { label: "Prisma" } },
        ],
      },
      {
        id: "project-id-2",
        title: "API sécurité",
        slug: "api-securite",
        shortDescription: "API orientée authentification et audit.",
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        repositoryUrl: null,
        demoUrl: null,
        media: [],
        stacks: [{ stack: { label: "Node.js" } }],
      },
    ]);

    render(await Home());

    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.getByText("API sécurité")).toBeInTheDocument();
    expect(screen.getByText("next.js · prisma")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Capture portfolio" }),
    ).toHaveAttribute("src", "data:image/png;base64,AQID");
    expect(
      screen.getAllByRole("link", { name: "voir le projet →" })[0],
    ).toHaveAttribute("href", "/projects/portfolio-master");
    expect(screen.getByRole("link", { name: "github ↗" })).toHaveAttribute(
      "href",
      "https://github.com/SiBlue7/projet-master-portfolio",
    );
    expect(screen.getByRole("link", { name: "démo ↗" })).toHaveAttribute(
      "href",
      "https://portfolio.justdoeat.org",
    );
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
        showTechnologies: false,
        showExternalLinks: false,
        showMedia: false,
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        media: [
          {
            id: "project-media-id",
            altText: "Capture portfolio",
            imageData: new Uint8Array([1, 2, 3]),
            mimeType: "image/png",
          },
        ],
        stacks: [{ stack: { label: "Next.js" } }],
      },
    ]);

    render(await Home());

    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.queryByText("next.js")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Capture portfolio" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "github ↗" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "démo ↗" }),
    ).not.toBeInTheDocument();
  });
});
