"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { authOptions } from "@/lib/auth";
import {
  PUBLIC_PROFILE_ID,
  getPublicProfileAvatarFile,
  parsePublicProfileFormData,
  shouldRemovePublicProfileAvatar,
  type PublicProfileFormState,
  validateProfileAvatarFile,
} from "@/lib/public-profile";
import { prisma } from "@/lib/prisma";

export async function savePublicProfile(
  _previousState: PublicProfileFormState,
  formData: FormData,
): Promise<PublicProfileFormState> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      status: "error",
      message: "Votre session a expiré. Reconnectez-vous pour continuer.",
    };
  }

  const parsedProfile = parsePublicProfileFormData(formData);
  const avatarFile = getPublicProfileAvatarFile(formData);
  const avatarValidation = validateProfileAvatarFile(avatarFile);

  if (!parsedProfile.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedProfile.error.flatten().fieldErrors,
    };
  }

  if (!avatarValidation.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: {
        avatar: [avatarValidation.error],
      },
    };
  }

  const shouldRemoveAvatar = shouldRemovePublicProfileAvatar(formData);
  const avatarFileData = avatarValidation.data
    ? Buffer.from(await avatarValidation.data.arrayBuffer())
    : null;
  const avatarUpdate =
    shouldRemoveAvatar || avatarFileData
      ? {
          avatarData: shouldRemoveAvatar ? null : avatarFileData,
          avatarMimeType: shouldRemoveAvatar
            ? null
            : (avatarValidation.data?.type ?? null),
          avatarUpdatedAt: shouldRemoveAvatar ? null : new Date(),
        }
      : {};

  await prisma.publicProfile.upsert({
    where: {
      id: PUBLIC_PROFILE_ID,
    },
    create: {
      id: PUBLIC_PROFILE_ID,
      ...parsedProfile.data,
      ...(avatarFileData
        ? {
            avatarData: avatarFileData,
            avatarMimeType: avatarValidation.data?.type ?? null,
            avatarUpdatedAt: new Date(),
          }
        : {}),
    },
    update: {
      ...parsedProfile.data,
      ...avatarUpdate,
    },
  });

  await writeAdminAuditLog({
    action: "UPDATE",
    entityId: PUBLIC_PROFILE_ID,
    entityType: "public_profile",
    metadata: {
      avatarRemoved: shouldRemoveAvatar,
      avatarUploaded: Boolean(avatarFileData),
    },
    session,
    summary: "Mise à jour du profil public.",
  });

  revalidatePath("/");
  revalidatePath("/admin/profile");

  return {
    status: "success",
    message: "Profil public mis à jour.",
  };
}
