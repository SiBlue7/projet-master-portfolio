"use server";

import { revalidatePath } from "next/cache";
import { getServerSession, type Session } from "next-auth";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { authOptions } from "@/lib/auth";
import {
  parseProfileTimelineItemFormData,
  type ProfileTimelineItemFormState,
} from "@/lib/profile-timeline";
import { prisma } from "@/lib/prisma";

async function ensureAdminSession(): Promise<
  Session | ProfileTimelineItemFormState
> {
  const session = await getServerSession(authOptions);

  if (session) {
    return session;
  }

  return {
    status: "error",
    message: "Votre session a expiré. Reconnectez-vous pour continuer.",
  };
}

function isSessionError(
  value: Session | ProfileTimelineItemFormState,
): value is ProfileTimelineItemFormState {
  return "status" in value;
}

function revalidateTimelinePages() {
  revalidatePath("/");
  revalidatePath("/admin/profile/timeline");
}

export async function createProfileTimelineItem(
  _previousState: ProfileTimelineItemFormState,
  formData: FormData,
): Promise<ProfileTimelineItemFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedTimelineItem = parseProfileTimelineItemFormData(formData);

  if (!parsedTimelineItem.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedTimelineItem.error.flatten().fieldErrors,
    };
  }

  const timelineItem = await prisma.profileTimelineItem.create({
    data: parsedTimelineItem.data,
  });

  await writeAdminAuditLog({
    action: "CREATE",
    entityId: timelineItem.id,
    entityType: "profile_timeline_item",
    metadata: {
      title: parsedTimelineItem.data.title,
      type: parsedTimelineItem.data.type,
    },
    session,
    summary: "Création d'un élément de parcours.",
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
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
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

  await writeAdminAuditLog({
    action: "UPDATE",
    entityId: itemId,
    entityType: "profile_timeline_item",
    metadata: {
      title: parsedTimelineItem.data.title,
      type: parsedTimelineItem.data.type,
    },
    session,
    summary: "Mise à jour d'un élément de parcours.",
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

  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  await prisma.profileTimelineItem.delete({
    where: {
      id: itemId,
    },
  });

  await writeAdminAuditLog({
    action: "DELETE",
    entityId: itemId,
    entityType: "profile_timeline_item",
    session,
    summary: "Suppression d'un élément de parcours.",
  });

  revalidateTimelinePages();

  return {
    status: "success",
    message: "Élément de parcours supprimé.",
  };
}
