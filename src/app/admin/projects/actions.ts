"use server";

import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { getServerSession, type Session } from "next-auth";
import { Prisma } from "@/generated/prisma/client";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { authOptions } from "@/lib/auth";
import {
  GithubImportError,
  importGithubRepositoryProject,
} from "@/lib/github-import";
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

function githubImportError(message: string): ProjectFormState {
  return {
    status: "error",
    message: "Le projet GitHub ne peut pas être importé.",
    errors: {
      repositoryUrl: [message],
    },
  };
}

async function ensureAdminSession(): Promise<Session | SessionErrorState> {
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
  value: Session | SessionErrorState,
): value is SessionErrorState {
  return "status" in value;
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
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
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
    const project = await prisma.project.create({
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

    await writeAdminAuditLog({
      action: "CREATE",
      entityId: project.id,
      entityType: "project",
      metadata: {
        slug: projectData.slug,
        title: projectData.title,
      },
      session,
      summary: "Création d'un projet.",
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

export async function importProjectFromGithub(
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const repositoryUrl = formData.get("githubUrl");

  if (typeof repositoryUrl !== "string") {
    return githubImportError("Renseignez l'URL du dépôt GitHub.");
  }

  try {
    const importedProject = await importGithubRepositoryProject(repositoryUrl);
    const { stacks, tags, ...projectData } = importedProject.project;
    const project = await prisma.project.create({
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

    await writeAdminAuditLog({
      action: "CREATE",
      entityId: project.id,
      entityType: "project",
      metadata: {
        fullName: importedProject.fullName,
        repositoryUrl: projectData.repositoryUrl,
        source: "github_import",
      },
      session,
      summary: "Import d'un projet depuis GitHub.",
    });
  } catch (error) {
    if (error instanceof GithubImportError) {
      return githubImportError(error.message);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return githubImportError(
        "Un projet existe déjà avec ce slug. Modifiez le projet existant ou créez-le manuellement.",
      );
    }

    throw error;
  }

  revalidateProjectPages();

  return {
    status: "success",
    message: "Projet importé depuis GitHub en brouillon privé.",
  };
}

export async function updateProject(
  projectId: string,
  _previousState: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
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

    await writeAdminAuditLog({
      action: "UPDATE",
      entityId: projectId,
      entityType: "project",
      metadata: {
        slug: projectData.slug,
        title: projectData.title,
      },
      session,
      summary: "Mise à jour d'un projet.",
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

  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });

  await writeAdminAuditLog({
    action: "DELETE",
    entityId: projectId,
    entityType: "project",
    session,
    summary: "Suppression d'un projet.",
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
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
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

  const media = await prisma.projectMedia.create({
    data: {
      projectId,
      altText: parsedMedia.altText,
      fileName: parsedMedia.image.name || "capture-projet",
      imageData: Buffer.from(await parsedMedia.image.arrayBuffer()),
      mimeType: parsedMedia.image.type,
      sortOrder: parsedMedia.sortOrder,
    },
  });

  await writeAdminAuditLog({
    action: "UPLOAD",
    entityId: media.id,
    entityType: "project_media",
    metadata: {
      fileName: parsedMedia.image.name || "capture-projet",
      mimeType: parsedMedia.image.type,
      projectId,
      projectSlug: project.slug,
    },
    session,
    summary: "Ajout d'une capture de projet.",
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

  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
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

  await writeAdminAuditLog({
    action: "DELETE",
    entityId: mediaId,
    entityType: "project_media",
    metadata: {
      projectSlug: media.project.slug,
    },
    session,
    summary: "Suppression d'une capture de projet.",
  });

  revalidateProjectDetails(media.project.slug);

  return {
    status: "success",
    message: "Capture supprimée.",
  };
}
