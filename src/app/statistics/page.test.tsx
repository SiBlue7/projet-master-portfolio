import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StatisticsPage from "./page";

const mocks = vi.hoisted(() => ({
  findManyProjects: vi.fn(),
  findManyTimelineItems: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profileTimelineItem: {
      findMany: mocks.findManyTimelineItems,
    },
    project: {
      findMany: mocks.findManyProjects,
    },
  },
}));

describe("StatisticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders public portfolio statistics", async () => {
    mocks.findManyProjects.mockResolvedValue([
      {
        id: "project-1",
        status: "IN_PROGRESS",
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
        showTechnologies: true,
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://preprod.justdoeat.org",
        startedAt: new Date(Date.UTC(2026, 0, 1)),
        endedAt: null,
        updatedAt: new Date(Date.UTC(2026, 4, 20, 8, 30)),
        media: [
          {
            id: "media-1",
          },
          {
            id: "media-2",
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
        id: "project-2",
        status: "COMPLETED",
        showExternalLinks: true,
        showMedia: false,
        showMetadata: true,
        showTechnologies: true,
        repositoryUrl: "https://github.com/SiBlue7/finished-project",
        demoUrl: null,
        startedAt: new Date(Date.UTC(2025, 8, 1)),
        endedAt: new Date(Date.UTC(2026, 1, 1)),
        updatedAt: new Date(Date.UTC(2026, 3, 10, 10, 15)),
        media: [
          {
            id: "hidden-media",
          },
        ],
        stacks: [
          {
            stack: {
              label: "Docker",
              slug: "docker",
            },
          },
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
              label: "Terminé",
              slug: "termine",
            },
          },
        ],
      },
    ]);
    mocks.findManyTimelineItems.mockResolvedValue([
      {
        id: "timeline-1",
        type: "FORMATION",
        updatedAt: new Date(Date.UTC(2026, 1, 1)),
      },
      {
        id: "timeline-2",
        type: "EXPERIENCE",
        updatedAt: new Date(Date.UTC(2026, 2, 1)),
      },
      {
        id: "timeline-3",
        type: "EXPERIENCE",
        updatedAt: new Date(Date.UTC(2026, 3, 1)),
      },
    ]);

    render(await StatisticsPage());

    expect(
      screen.getByRole("heading", { name: /Lecture chiffrée/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Projets publics")).toBeInTheDocument();
    expect(screen.getByText("Technologies visibles")).toBeInTheDocument();
    expect(screen.getAllByText("Captures").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Parcours").length).toBeGreaterThan(0);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Prisma")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("En cours · 1")).toBeInTheDocument();
    expect(screen.getByText("Terminé · 1")).toBeInTheDocument();
    expect(screen.getByText("lien démo")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    expect(screen.getByText("Formation")).toBeInTheDocument();
    expect(screen.getByText("Expérience")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /enzo@portfolio/ }),
    ).toHaveAttribute("href", "/");
    expect(mocks.findManyProjects).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          visibility: "PUBLIC",
        },
      }),
    );
  });

  it("renders an empty state without public data", async () => {
    mocks.findManyProjects.mockResolvedValue([]);
    mocks.findManyTimelineItems.mockResolvedValue([]);

    render(await StatisticsPage());

    expect(screen.getByText("Aucune donnée")).toBeInTheDocument();
    expect(
      screen.getAllByText("Aucune donnée publique disponible pour le moment.")
        .length,
    ).toBeGreaterThan(0);
  });
});
