"use server";

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

function duplicateSlugError(): ProjectFormState {
  return {
    status: "error",
    message: "Certains champs doivent être corrigés.",
    errors: {
      slug: ["Ce slug est déjà utilisé par un autre projet."],
    },
  };
}

async function ensureAdminSession(): Promise<ProjectFormState | null> {
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
