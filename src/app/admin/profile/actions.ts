"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  PUBLIC_PROFILE_ID,
  parsePublicProfileFormData,
  type PublicProfileFormState,
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

  if (!parsedProfile.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedProfile.error.flatten().fieldErrors,
    };
  }

  await prisma.publicProfile.upsert({
    where: {
      id: PUBLIC_PROFILE_ID,
    },
    create: {
      id: PUBLIC_PROFILE_ID,
      ...parsedProfile.data,
    },
    update: parsedProfile.data,
  });

  revalidatePath("/");
  revalidatePath("/admin/profile");

  return {
    status: "success",
    message: "Profil public mis à jour.",
  };
}
