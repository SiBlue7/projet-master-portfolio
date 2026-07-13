import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProjectsListPage from "./page";

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

describe("AdminProjectsListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a minimal list of projects with detail links", async () => {
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
        status: "IN_PROGRESS",
        visibility: "PUBLIC",
        updatedAt: new Date(Date.UTC(2026, 4, 1)),
        _count: {
          media: 2,
          stacks: 3,
        },
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

    render(await AdminProjectsListPage());

    expect(
      screen.getByRole("heading", { name: /Liste des projets/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.getByText("portfolio-master")).toBeInTheDocument();
    expect(screen.getByText("Portfolio administrable.")).toBeInTheDocument();
    expect(screen.getByText(/3 technologies · 2 captures/)).toBeInTheDocument();
    expect(screen.getAllByText("En cours").length).toBeGreaterThan(0);
    expect(screen.getByText("Public")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "détails →" })).toHaveAttribute(
      "href",
      "/admin/projects/project-id",
    );
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminProjectsListPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
