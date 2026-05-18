"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  parseProfileTimelineItemFormData,
  type ProfileTimelineItemFormState,
} from "@/lib/profile-timeline";
import { prisma } from "@/lib/prisma";

async function ensureAdminSession(): Promise<ProfileTimelineItemFormState | null> {
  const session = await getServerSession(authOptions);

  if (session) {
    return null;
  }

  return {
    status: "error",
    message: "Votre session a expiré. Reconnectez-vous pour continuer.",
  };
}

function revalidateTimelinePages() {
  revalidatePath("/");
  revalidatePath("/admin/profile/timeline");
}

export async function createProfileTimelineItem(
  _previousState: ProfileTimelineItemFormState,
  formData: FormData,
): Promise<ProfileTimelineItemFormState> {
  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  const parsedTimelineItem = parseProfileTimelineItemFormData(formData);

  if (!parsedTimelineItem.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedTimelineItem.error.flatten().fieldErrors,
    };
  }

  await prisma.profileTimelineItem.create({
    data: parsedTimelineItem.data,
  });

  revalidateTimelinePages();

  return {
    status: "success",
    message: "Élément de parcours ajouté.",
  };
}

export async function updateProfileTimelineItem(
  itemId: string,
  _previousState: ProfileTimelineItemFormState,
  formData: FormData,
): Promise<ProfileTimelineItemFormState> {
  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  const parsedTimelineItem = parseProfileTimelineItemFormData(formData);

  if (!parsedTimelineItem.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedTimelineItem.error.flatten().fieldErrors,
    };
  }

  await prisma.profileTimelineItem.update({
    where: {
      id: itemId,
    },
    data: parsedTimelineItem.data,
  });

  revalidateTimelinePages();

  return {
    status: "success",
    message: "Élément de parcours mis à jour.",
  };
}

export async function deleteProfileTimelineItem(
  itemId: string,
  _previousState: ProfileTimelineItemFormState,
  _formData: FormData,
): Promise<ProfileTimelineItemFormState> {
  void _previousState;
  void _formData;

  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  await prisma.profileTimelineItem.delete({
    where: {
      id: itemId,
    },
  });

  revalidateTimelinePages();

  return {
    status: "success",
    message: "Élément de parcours supprimé.",
  };
}
