import { render, screen } from "@testing-library/react";
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
      repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
      demoUrl: "https://portfolio.justdoeat.org",
      startedAt: new Date(Date.UTC(2026, 0, 1)),
      endedAt: null,
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
});
