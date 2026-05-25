import { beforeEach, describe, expect, it, vi } from "vitest";
import { writeAdminAuditLog } from "./admin-audit";

const mocks = vi.hoisted(() => ({
  tryWriteAuditLog: vi.fn(),
}));

vi.mock("@/lib/audit", () => ({
  tryWriteAuditLog: mocks.tryWriteAuditLog,
}));

describe("writeAdminAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tryWriteAuditLog.mockResolvedValue(undefined);
  });

  it("writes an audit log with the authenticated admin as actor", async () => {
    await writeAdminAuditLog({
      action: "UPDATE",
      entityId: "project-id",
      entityType: "project",
      metadata: {
        slug: "portfolio-master",
      },
      session: {
        expires: "2026-05-24T16:00:00.000Z",
        user: {
          email: "admin@example.com",
          id: "admin-id",
          name: "Admin",
          pseudo: "admin",
          role: "ADMIN",
        },
      },
      summary: "Mise à jour d'un projet.",
    });

    expect(mocks.tryWriteAuditLog).toHaveBeenCalledWith({
      action: "UPDATE",
      actor: {
        email: "admin@example.com",
        id: "admin-id",
        pseudo: "admin",
      },
      entityId: "project-id",
      entityType: "project",
      metadata: {
        slug: "portfolio-master",
      },
      summary: "Mise à jour d'un projet.",
    });
  });
});
