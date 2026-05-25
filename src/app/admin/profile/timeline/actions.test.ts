import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createProfileTimelineItem,
  deleteProfileTimelineItem,
  updateProfileTimelineItem,
} from "./actions";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  getServerSession: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
  writeAdminAuditLog: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocks.revalidatePath,
}));

vi.mock("next-auth", () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profileTimelineItem: {
      create: mocks.create,
      delete: mocks.delete,
      update: mocks.update,
    },
  },
}));

vi.mock("@/lib/admin-audit", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));

function createTimelineFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    type: "EXPERIENCE",
    title: "Alternance sécurité",
    organization: "Entreprise",
    location: "Paris",
    description: "Missions sécurité applicative.",
    startMonth: "2025-09",
    endMonth: "2026-09",
    sortOrder: "2",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("profile timeline actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.create.mockResolvedValue({});
    mocks.update.mockResolvedValue({});
    mocks.delete.mockResolvedValue({});
  });

  it("creates a timeline item", async () => {
    const result = await createProfileTimelineItem(
      { status: "idle" },
      createTimelineFormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Élément de parcours ajouté.",
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: "EXPERIENCE",
        title: "Alternance sécurité",
        organization: "Entreprise",
        sortOrder: 2,
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      }),
    });
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        entityType: "profile_timeline_item",
        summary: "Création d'un élément de parcours.",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/profile/timeline");
  });

  it("updates a timeline item", async () => {
    const result = await updateProfileTimelineItem(
      "timeline-id",
      { status: "idle" },
      createTimelineFormData({
        title: "Master cybersécurité",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Élément de parcours mis à jour.",
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        id: "timeline-id",
      },
      data: expect.objectContaining({
        title: "Master cybersécurité",
      }),
    });
  });

  it("deletes a timeline item", async () => {
    const result = await deleteProfileTimelineItem(
      "timeline-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Élément de parcours supprimé.",
    });
    expect(mocks.delete).toHaveBeenCalledWith({
      where: {
        id: "timeline-id",
      },
    });
  });

  it("rejects invalid payloads", async () => {
    const result = await createProfileTimelineItem(
      { status: "idle" },
      createTimelineFormData({
        title: "",
      }),
    );

    expect(result.status).toBe("error");
    expect(result.errors?.title?.[0]).toBe("Le titre est obligatoire.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects anonymous users", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const result = await createProfileTimelineItem(
      { status: "idle" },
      createTimelineFormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Votre session a expiré. Reconnectez-vous pour continuer.",
    });
    expect(getServerSession).toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
