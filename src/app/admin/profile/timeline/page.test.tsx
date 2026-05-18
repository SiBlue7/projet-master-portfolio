import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminProfileTimelinePage from "./page";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profileTimelineItem: {
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

describe("AdminProfileTimelinePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders timeline management with existing items", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findMany.mockResolvedValue([
      {
        id: "timeline-id",
        type: "FORMATION",
        title: "Master 2 Cybersécurité",
        organization: "Université",
        location: "Lyon",
        description: "Sécurité applicative et infrastructure.",
        startDate: new Date(Date.UTC(2025, 8, 1)),
        endDate: null,
        isCurrent: true,
        sortOrder: 1,
      },
    ]);

    render(await AdminProfileTimelinePage());

    expect(
      screen.getByRole("heading", { name: "Parcours" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ajouter un élément" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Parcours existant" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Master 2 Cybersécurité")).toBeInTheDocument();
    expect(
      screen.getByText("Université · 2025-09 - Aujourd'hui"),
    ).toBeInTheDocument();
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminProfileTimelinePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
