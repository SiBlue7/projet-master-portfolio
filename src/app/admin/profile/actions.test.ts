import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_PROFILE_ID } from "@/lib/public-profile";
import { savePublicProfile } from "./actions";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  getServerSession: vi.fn(),
  upsert: vi.fn(),
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
    publicProfile: {
      upsert: mocks.upsert,
    },
  },
}));

vi.mock("@/lib/admin-audit", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));

function createProfileFormData(overrides: Record<string, string | File> = {}) {
  const formData = new FormData();
  const values = {
    displayName: "Enzo Chevalier",
    headline: "Étudiant M2 Cybersécurité",
    bio: "Portfolio technique.",
    contactEmail: "enzo@example.com",
    githubUrl: "https://github.com/SiBlue7",
    linkedinUrl: "https://www.linkedin.com/in/enzo-chevalier",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("savePublicProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.upsert.mockResolvedValue({});
  });

  it("saves profile values with an avatar", async () => {
    const avatar = new File(["avatar"], "avatar.png", {
      type: "image/png",
    });
    const formData = createProfileFormData({
      avatar,
    });

    const result = await savePublicProfile({ status: "idle" }, formData);

    expect(result).toEqual({
      status: "success",
      message: "Profil public mis à jour.",
    });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: PUBLIC_PROFILE_ID,
        },
        create: expect.objectContaining({
          avatarData: expect.any(Buffer),
          avatarMimeType: "image/png",
          avatarUpdatedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          avatarData: expect.any(Buffer),
          avatarMimeType: "image/png",
          avatarUpdatedAt: expect.any(Date),
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/profile");
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE",
        entityId: PUBLIC_PROFILE_ID,
        entityType: "public_profile",
        summary: "Mise à jour du profil public.",
      }),
    );
  });

  it("returns a field error for invalid avatars", async () => {
    const avatar = new File(["avatar"], "avatar.svg", {
      type: "image/svg+xml",
    });
    const formData = createProfileFormData({
      avatar,
    });

    const result = await savePublicProfile({ status: "idle" }, formData);

    expect(result).toEqual({
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: {
        avatar: ["L'avatar doit être une image JPG, PNG ou WebP."],
      },
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("clears the avatar when requested", async () => {
    const formData = createProfileFormData({
      removeAvatar: "on",
    });

    await savePublicProfile({ status: "idle" }, formData);

    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          avatarData: null,
          avatarMimeType: null,
          avatarUpdatedAt: null,
        }),
      }),
    );
  });

  it("rejects anonymous users", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const result = await savePublicProfile(
      { status: "idle" },
      createProfileFormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Votre session a expiré. Reconnectez-vous pour continuer.",
    });
    expect(getServerSession).toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
