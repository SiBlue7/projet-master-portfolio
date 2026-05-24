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
      repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
      demoUrl: "https://portfolio.justdoeat.org",
      startedAt: new Date(Date.UTC(2026, 0, 10)),
      endedAt: null,
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
    expect(screen.getByDisplayValue("portfolio-master")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Next.js, Prisma")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Capture admin" })).toHaveAttribute(
      "src",
      "data:image/png;base64,AQID",
    );
    expect(
      screen.getByRole("button", { name: "Enregistrer" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Supprimer" }).length).toBe(2);
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
