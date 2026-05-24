import { fireEvent, render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProjectDetailsPage from "./page";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

describe("ProjectDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders public project details", async () => {
    mocks.findFirst.mockResolvedValue({
      title: "Portfolio master",
      slug: "portfolio-master",
      shortDescription: "Portfolio administrable.",
      description: "Projet de portfolio avec administration.",
      status: "IN_PROGRESS",
      showDetails: true,
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
          id: "media-id",
          altText: "Capture publique",
          imageData: new Uint8Array([1, 2, 3]),
          mimeType: "image/png",
        },
        {
          id: "media-id-2",
          altText: "Capture du tableau de bord",
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
    });

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({
          slug: "portfolio-master",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Portfolio master" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Portfolio administrable.")).toBeInTheDocument();
    expect(
      screen.getByText("Projet de portfolio avec administration."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: "Technologies utilisées" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Prisma")).toBeInTheDocument();
    expect(screen.getByText("Depuis Janvier 2026")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Captures du projet" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("img", { name: "Capture publique" })[0],
    ).toHaveAttribute("src", "data:image/png;base64,AQID");
    expect(screen.getByText("Capture 1 sur 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture suivante" }));
    expect(screen.getByText("Capture 2 sur 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Capture précédente" }));
    expect(screen.getByText("Capture 1 sur 2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voir la démo" })).toHaveAttribute(
      "href",
      "https://portfolio.justdoeat.org",
    );
    expect(screen.getByRole("link", { name: "GitHub" })).toHaveAttribute(
      "href",
      "https://github.com/SiBlue7/projet-master-portfolio",
    );
    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: "portfolio-master",
          visibility: "PUBLIC",
        },
      }),
    );
  });

  it("returns not found for missing or private projects", async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(
      ProjectDetailsPage({
        params: Promise.resolve({
          slug: "private-project",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("hides project sections based on fine visibility settings", async () => {
    mocks.findFirst.mockResolvedValue({
      title: "Portfolio master",
      slug: "portfolio-master",
      shortDescription: "Portfolio administrable.",
      description: "Projet de portfolio avec administration.",
      status: "IN_PROGRESS",
      showDetails: false,
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
          id: "media-id",
          altText: "Capture publique",
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
    });

    render(
      await ProjectDetailsPage({
        params: Promise.resolve({
          slug: "portfolio-master",
        }),
      }),
    );

    expect(screen.getByText("Portfolio administrable.")).toBeInTheDocument();
    expect(
      screen.queryByText("Projet de portfolio avec administration."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Technologies utilisées" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Captures du projet" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Voir la démo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "GitHub" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Depuis Janvier 2026")).not.toBeInTheDocument();
  });
});
