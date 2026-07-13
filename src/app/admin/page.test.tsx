import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminPage from "./page";

const mocks = vi.hoisted(() => ({
  countProjectMedia: vi.fn(),
  countProjects: vi.fn(),
  countRunbooks: vi.fn(),
  countTimelineItems: vi.fn(),
  findAuditLogs: vi.fn(),
  findProjects: vi.fn(),
  findUniqueProfile: vi.fn(),
  getServerSession: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("next-auth/react", () => ({
  signOut: mocks.signOut,
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      findMany: mocks.findAuditLogs,
    },
    profileTimelineItem: {
      count: mocks.countTimelineItems,
    },
    project: {
      count: mocks.countProjects,
      findMany: mocks.findProjects,
    },
    projectMedia: {
      count: mocks.countProjectMedia,
    },
    publicProfile: {
      findUnique: mocks.findUniqueProfile,
    },
    runbook: {
      count: mocks.countRunbooks,
    },
  },
}));

describe("AdminPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.countProjects.mockImplementation(
      (query?: {
        where?: {
          media?: {
            none?: Record<string, never>;
          };
          OR?: unknown[];
          visibility?: string;
        };
      }) => {
        if (!query?.where) {
          return Promise.resolve(4);
        }

        if (query.where.visibility === "PUBLIC") {
          return Promise.resolve(2);
        }

        if (query.where.visibility === "PRIVATE") {
          return Promise.resolve(2);
        }

        if (query.where.media?.none) {
          return Promise.resolve(1);
        }

        if (query.where.OR) {
          return Promise.resolve(1);
        }

        return Promise.resolve(0);
      },
    );
    mocks.countTimelineItems.mockResolvedValue(3);
    mocks.countProjectMedia.mockResolvedValue(5);
    mocks.countRunbooks.mockResolvedValue(2);
    mocks.findUniqueProfile.mockResolvedValue({
      avatarData: new Uint8Array([1, 2, 3]),
      githubUrl: "https://github.com/SiBlue7",
      linkedinUrl: "https://www.linkedin.com/in/enzo-chevalier",
    });
    mocks.findProjects.mockResolvedValue([
      {
        id: "project-id",
        status: "IN_PROGRESS",
        title: "Portfolio master",
        updatedAt: new Date(Date.UTC(2026, 4, 24)),
        visibility: "PUBLIC",
      },
    ]);
    mocks.findAuditLogs.mockResolvedValue([
      {
        action: "UPDATE",
        createdAt: new Date(Date.UTC(2026, 4, 25)),
        id: "audit-log-id",
        status: "SUCCESS",
        summary: "Projet mis à jour.",
      },
    ]);
  });

  it("renders the admin page for authenticated users", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        email: "admin@example.com",
        pseudo: "admin",
        role: "ADMIN",
      },
    });

    render(await AdminPage());

    expect(
      screen.getByRole("heading", { name: /Administration/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Connecté en tant que admin.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Compte administrateur" }),
    ).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("2 publics · 2 privés")).toBeInTheDocument();
    expect(
      screen.getByText("captures et photos de projets"),
    ).toBeInTheDocument();
    expect(screen.getByText("procédures actives")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("ADMIN")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "exit" }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Profil public/ })
        .map((link) => link.getAttribute("href")),
    ).toContain("/admin/profile");
    expect(
      screen
        .getAllByRole("link", { name: /Parcours/ })
        .map((link) => link.getAttribute("href")),
    ).toContain("/admin/profile/timeline");
    expect(
      screen.getByRole("link", { name: /Créer un projet/ }),
    ).toHaveAttribute("href", "/admin/projects");
    expect(
      screen.getByRole("link", { name: /Logs d'activité/ }),
    ).toHaveAttribute("href", "/admin/logs");
    expect(screen.getByRole("link", { name: /Healthcheck/ })).toHaveAttribute(
      "href",
      "/api/health",
    );
    expect(screen.getByText("Portfolio master")).toBeInTheDocument();
    expect(screen.getByText("Projet mis à jour.")).toBeInTheDocument();
  });

  it("signs out authenticated users", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        email: "admin@example.com",
        pseudo: "admin",
        role: "ADMIN",
      },
    });
    mocks.signOut.mockResolvedValue(undefined);

    render(await AdminPage());

    fireEvent.click(screen.getByRole("button", { name: "exit" }));

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledWith({
        callbackUrl: "/admin/login",
      });
    });
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
