import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogsPage from "./page";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
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

describe("AdminLogsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders recent audit logs for authenticated admins", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findMany.mockResolvedValue([
      {
        action: "UPDATE",
        actorEmail: "admin@example.com",
        actorPseudo: "admin",
        createdAt: new Date(Date.UTC(2026, 4, 24, 14, 30)),
        entityId: "project-id",
        entityType: "project",
        id: "log-id",
        status: "SUCCESS",
        summary: "Mise à jour d'un projet.",
      },
      {
        action: "LOGIN_FAILURE",
        actorEmail: null,
        actorPseudo: null,
        createdAt: new Date(Date.UTC(2026, 4, 24, 14, 20)),
        entityId: null,
        entityType: "auth",
        id: "log-id-2",
        status: "FAILURE",
        summary: "Tentative de connexion administrateur échouée.",
      },
    ]);

    render(await AdminLogsPage());

    expect(
      screen.getByRole("heading", { name: /Logs d'activité/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getAllByText("Succès").length).toBeGreaterThan(0);
    expect(screen.getByText("échecs")).toBeInTheDocument();
    expect(screen.getByText("Modification")).toBeInTheDocument();
    expect(screen.getByText("Connexion échouée")).toBeInTheDocument();
    expect(screen.getByText("Mise à jour d'un projet.")).toBeInTheDocument();
    expect(screen.getByText("Projet · project-id")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("Système")).toBeInTheDocument();
  });

  it("renders an empty state", async () => {
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findMany.mockResolvedValue([]);

    render(await AdminLogsPage());

    expect(
      screen.getByText("Aucun log d'activité enregistré pour le moment."),
    ).toBeInTheDocument();
  });

  it("redirects anonymous users to login", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    await expect(AdminLogsPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/admin/login");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
