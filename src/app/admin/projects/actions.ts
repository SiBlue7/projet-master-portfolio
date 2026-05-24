"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { Prisma } from "@/generated/prisma/client";
import { authOptions } from "@/lib/auth";
import {
  parseProjectFormData,
  type ProjectFormState,
  type ProjectStackInput,
  type ProjectTagInput,
} from "@/lib/projects";
import { prisma } from "@/lib/prisma";

export type ProjectMediaFormField = "altText" | "image" | "sortOrder";

export type ProjectMediaFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<ProjectMediaFormField, string[]>>;
};

type SessionErrorState = {
  status: "error";
  message: string;
};

const allowedProjectMediaMimeTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxProjectMediaSize = 5 * 1024 * 1024;

function duplicateSlugError(): ProjectFormState {
  return {
    status: "error",
    message: "Certains champs doivent être corrigés.",
    errors: {
      slug: ["Ce slug est déjà utilisé par un autre projet."],
    },
  };
}

async function ensureAdminSession(): Promise<SessionErrorState | null> {
  const session = await getServerSession(authOptions);

  if (session) {
    return null;
  }

  return {
    status: "error",
    message: "Votre session a expiré. Reconnectez-vous pour continuer.",
  };
}

function revalidateProjectPages() {
  revalidatePath("/");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/projects/list");
  revalidatePath("/admin/projects/[projectId]", "page");
  revalidatePath("/projects/[slug]", "page");
}

function revalidateProjectDetails(projectSlug: string | null) {
  revalidateProjectPages();

  if (projectSlug) {
    revalidatePath(`/projects/${projectSlug}`);
  }
}

function buildProjectTagCreates(tags: ProjectTagInput[]) {
  return tags.map((tag) => ({
    tag: {
      connectOrCreate: {
        where: {
          slug: tag.slug,
        },
        create: {
          label: tag.label,
          slug: tag.slug,
        },
      },
    },
  }));
}

function buildProjectStackCreates(stacks: ProjectStackInput[]) {
  return stacks.map((stack) => ({
    stack: {
      connectOrCreate: {
        where: {
          slug: stack.slug,
        },
        create: {
          label: stack.label,
          slug: stack.slug,
        },
      },
    },
  }));
}

function mediaFieldError(
  field: ProjectMediaFormField,
  message: string,
): ProjectMediaFormState {
  return {
    status: "error",
    message: "La capture ne peut pas être enregistrée.",
    errors: {
      [field]: [message],
    },
  };
}

function getOptionalMediaTextValue(formData: FormData, field: string) {
  const value = formData.get(field);

  return typeof value === "string" ? value.trim() : "";
}

function parseProjectMediaFormData(formData: FormData) {
  const image = formData.get("image");

  if (!(image instanceof File) || image.size === 0) {
    return mediaFieldError("image", "Ajoutez une image à importer.");
  }

  if (!allowedProjectMediaMimeTypes.has(image.type)) {
    return mediaFieldError(
      "image",
      "Le fichier doit être une image PNG, JPG, WebP ou GIF.",
    );
  }

  if (image.size > maxProjectMediaSize) {
    return mediaFieldError("image", "L'image doit peser 5 Mo maximum.");
  }

  const altText = getOptionalMediaTextValue(formData, "altText");

  if (altText.length > 160) {
    return mediaFieldError(
      "altText",
      "Le texte alternatif doit contenir 160 caractères maximum.",
    );
  }

  const sortOrderValue = getOptionalMediaTextValue(formData, "sortOrder");
  const sortOrder = sortOrderValue ? Number(sortOrderValue) : 0;

  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 999) {
    return mediaFieldError(
      "sortOrder",
      "L'ordre doit être un nombre entier entre 0 et 999.",
    );
  }

  return {
    image,
    altText: altText || null,
    sortOrder,
  };
}

export async function createProject(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  const parsedProject = parseProjectFormData(formData);

  if (!parsedProject.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedProject.error.flatten().fieldErrors,
    };
  }

  const { stacks, tags, ...projectData } = parsedProject.data;

  try {
    await prisma.project.create({
      data: {
        ...projectData,
        stacks: {
          create: buildProjectStackCreates(stacks),
        },
        tags: {
          create: buildProjectTagCreates(tags),
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return duplicateSlugError();
    }

    throw error;
  }

  revalidateProjectPages();

  return {
    status: "success",
    message: "Projet créé.",
  };
}

export async function updateProject(
  projectId: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  const parsedProject = parseProjectFormData(formData);

  if (!parsedProject.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedProject.error.flatten().fieldErrors,
    };
  }

  const { stacks, tags, ...projectData } = parsedProject.data;

  try {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        ...projectData,
        stacks: {
          deleteMany: {},
          create: buildProjectStackCreates(stacks),
        },
        tags: {
          deleteMany: {},
          create: buildProjectTagCreates(tags),
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return duplicateSlugError();
    }

    throw error;
  }

  revalidateProjectPages();

  return {
    status: "success",
    message: "Projet mis à jour.",
  };
}

export async function deleteProject(
  projectId: string,
  _previousState: ProjectFormState,
  _formData: FormData,
): Promise<ProjectFormState> {
  void _previousState;
  void _formData;

  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  revalidateProjectPages();

  return {
    status: "success",
    message: "Projet supprimé.",
  };
}

export async function addProjectMedia(
  projectId: string,
  _previousState: ProjectMediaFormState,
  formData: FormData,
): Promise<ProjectMediaFormState> {
  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  const parsedMedia = parseProjectMediaFormData(formData);

  if ("status" in parsedMedia) {
    return parsedMedia;
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      slug: true,
    },
  });

  if (!project) {
    return {
      status: "error",
      message: "Projet introuvable.",
    };
  }

  await prisma.projectMedia.create({
    data: {
      projectId,
      altText: parsedMedia.altText,
      fileName: parsedMedia.image.name || "capture-projet",
      imageData: Buffer.from(await parsedMedia.image.arrayBuffer()),
      mimeType: parsedMedia.image.type,
      sortOrder: parsedMedia.sortOrder,
    },
  });

  revalidateProjectDetails(project.slug);

  return {
    status: "success",
    message: "Capture ajoutée.",
  };
}

export async function deleteProjectMedia(
  mediaId: string,
  _previousState: ProjectMediaFormState,
  _formData: FormData,
): Promise<ProjectMediaFormState> {
  void _previousState;
  void _formData;

  const sessionError = await ensureAdminSession();

  if (sessionError) {
    return sessionError;
  }

  const media = await prisma.projectMedia.findUnique({
    where: {
      id: mediaId,
    },
    select: {
      project: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!media) {
    return {
      status: "error",
      message: "Capture introuvable.",
    };
  }

  await prisma.projectMedia.delete({
    where: {
      id: mediaId,
    },
  });

  revalidateProjectDetails(media.project.slug);

  return {
    status: "success",
    message: "Capture supprimée.",
  };
}
