import { describe, expect, it, vi } from "vitest";
import { writeAuditLog } from "./audit";

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: mocks.createAuditLog,
    },
  },
}));

describe("writeAuditLog", () => {
  it("persists an audit log with actor and metadata", async () => {
    mocks.createAuditLog.mockResolvedValue({});

    await writeAuditLog({
      action: "UPDATE",
      actor: {
        email: "admin@example.com",
        id: "admin-id",
        pseudo: "admin",
      },
      entityId: "project-id",
      entityType: "Project",
      ipAddress: "203.0.113.10",
      metadata: {
        field: "visibility",
      },
      summary: "Modification de la visibilité du projet.",
      userAgent: "Vitest",
    });

    expect(mocks.createAuditLog).toHaveBeenCalledWith({
      data: {
        action: "UPDATE",
        actorEmail: "admin@example.com",
        actorId: "admin-id",
        actorPseudo: "admin",
        entityId: "project-id",
        entityType: "Project",
        ipAddress: "203.0.113.10",
        metadata: {
          field: "visibility",
        },
        status: "SUCCESS",
        summary: "Modification de la visibilité du projet.",
        userAgent: "Vitest",
      },
    });
  });

  it("stores nullable actor and request context when missing", async () => {
    mocks.createAuditLog.mockResolvedValue({});

    await writeAuditLog({
      action: "LOGIN_FAILURE",
      entityType: "Auth",
      status: "FAILURE",
      summary: "Échec de connexion admin.",
    });

    expect(mocks.createAuditLog).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "LOGIN_FAILURE",
        actorEmail: null,
        actorId: null,
        actorPseudo: null,
        entityId: null,
        entityType: "Auth",
        ipAddress: null,
        metadata: undefined,
        status: "FAILURE",
        summary: "Échec de connexion admin.",
        userAgent: null,
      }),
    });
  });
});
