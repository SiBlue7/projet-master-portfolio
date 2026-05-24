"use server";

import { revalidatePath } from "next/cache";
import { getServerSession, type Session } from "next-auth";
import { Prisma } from "@/generated/prisma/client";
import { writeAdminAuditLog } from "@/lib/admin-audit";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseRunbookEnvironmentFormData,
  parseRunbookFormData,
  parseRunbookStepFormData,
  type RunbookEnvironmentFormState,
  type RunbookFormState,
  type RunbookStepFormState,
} from "@/lib/runbooks";

type SessionErrorState = {
  status: "error";
  message: string;
};

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

function revalidateRunbookPages(projectId: string | null) {
  revalidatePath("/admin/projects/[projectId]", "page");

  if (projectId) {
    revalidatePath(`/admin/projects/${projectId}`);
  }
}

function duplicateRunbookSlugError(): RunbookFormState {
  return {
    status: "error",
    message: "Certains champs doivent être corrigés.",
    errors: {
      slug: ["Ce slug est déjà utilisé par un autre runbook du projet."],
    },
  };
}

function duplicateEnvironmentSlugError(): RunbookEnvironmentFormState {
  return {
    status: "error",
    message: "Certains champs doivent être corrigés.",
    errors: {
      slug: ["Ce slug est déjà utilisé par un autre environnement du runbook."],
    },
  };
}

async function getRunbookProjectId(runbookId: string) {
  const runbook = await prisma.runbook.findUnique({
    where: {
      id: runbookId,
    },
    select: {
      projectId: true,
    },
  });

  return runbook?.projectId ?? null;
}

async function environmentBelongsToRunbook(
  environmentId: string | null,
  runbookId: string,
) {
  if (!environmentId) {
    return true;
  }

  const environment = await prisma.runbookEnvironment.findFirst({
    where: {
      id: environmentId,
      runbookId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(environment);
}

export async function createRunbook(
  projectId: string,
  _previousState: RunbookFormState,
  formData: FormData,
): Promise<RunbookFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedRunbook = parseRunbookFormData(formData);

  if (!parsedRunbook.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedRunbook.error.flatten().fieldErrors,
    };
  }

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return {
      status: "error",
      message: "Projet introuvable.",
    };
  }

  try {
    const runbook = await prisma.runbook.create({
      data: {
        ...parsedRunbook.data,
        projectId,
      },
    });

    await writeAdminAuditLog({
      action: "CREATE",
      entityId: runbook.id,
      entityType: "runbook",
      metadata: {
        projectId,
        slug: parsedRunbook.data.slug,
        title: parsedRunbook.data.title,
      },
      session,
      summary: "Création d'un runbook.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return duplicateRunbookSlugError();
    }

    throw error;
  }

  revalidateRunbookPages(projectId);

  return {
    status: "success",
    message: "Runbook créé.",
  };
}

export async function updateRunbook(
  runbookId: string,
  _previousState: RunbookFormState,
  formData: FormData,
): Promise<RunbookFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedRunbook = parseRunbookFormData(formData);

  if (!parsedRunbook.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedRunbook.error.flatten().fieldErrors,
    };
  }

  const projectId = await getRunbookProjectId(runbookId);

  if (!projectId) {
    return {
      status: "error",
      message: "Runbook introuvable.",
    };
  }

  try {
    await prisma.runbook.update({
      where: {
        id: runbookId,
      },
      data: parsedRunbook.data,
    });

    await writeAdminAuditLog({
      action: "UPDATE",
      entityId: runbookId,
      entityType: "runbook",
      metadata: {
        projectId,
        slug: parsedRunbook.data.slug,
        title: parsedRunbook.data.title,
      },
      session,
      summary: "Mise à jour d'un runbook.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return duplicateRunbookSlugError();
    }

    throw error;
  }

  revalidateRunbookPages(projectId);

  return {
    status: "success",
    message: "Runbook mis à jour.",
  };
}

export async function deleteRunbook(
  runbookId: string,
  _previousState: RunbookFormState,
  _formData: FormData,
): Promise<RunbookFormState> {
  void _previousState;
  void _formData;

  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const projectId = await getRunbookProjectId(runbookId);

  if (!projectId) {
    return {
      status: "error",
      message: "Runbook introuvable.",
    };
  }

  await prisma.runbook.delete({
    where: {
      id: runbookId,
    },
  });

  await writeAdminAuditLog({
    action: "DELETE",
    entityId: runbookId,
    entityType: "runbook",
    metadata: {
      projectId,
    },
    session,
    summary: "Suppression d'un runbook.",
  });

  revalidateRunbookPages(projectId);

  return {
    status: "success",
    message: "Runbook supprimé.",
  };
}

export async function createRunbookEnvironment(
  runbookId: string,
  _previousState: RunbookEnvironmentFormState,
  formData: FormData,
): Promise<RunbookEnvironmentFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedEnvironment = parseRunbookEnvironmentFormData(formData);

  if (!parsedEnvironment.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedEnvironment.error.flatten().fieldErrors,
    };
  }

  const projectId = await getRunbookProjectId(runbookId);

  if (!projectId) {
    return {
      status: "error",
      message: "Runbook introuvable.",
    };
  }

  try {
    const environment = await prisma.runbookEnvironment.create({
      data: {
        ...parsedEnvironment.data,
        runbookId,
      },
    });

    await writeAdminAuditLog({
      action: "CREATE",
      entityId: environment.id,
      entityType: "runbook_environment",
      metadata: {
        kind: parsedEnvironment.data.kind,
        name: parsedEnvironment.data.name,
        projectId,
        runbookId,
        slug: parsedEnvironment.data.slug,
      },
      session,
      summary: "Création d'un environnement de runbook.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return duplicateEnvironmentSlugError();
    }

    throw error;
  }

  revalidateRunbookPages(projectId);

  return {
    status: "success",
    message: "Environnement créé.",
  };
}

export async function updateRunbookEnvironment(
  environmentId: string,
  _previousState: RunbookEnvironmentFormState,
  formData: FormData,
): Promise<RunbookEnvironmentFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedEnvironment = parseRunbookEnvironmentFormData(formData);

  if (!parsedEnvironment.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedEnvironment.error.flatten().fieldErrors,
    };
  }

  const environment = await prisma.runbookEnvironment.findUnique({
    where: {
      id: environmentId,
    },
    select: {
      runbook: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!environment) {
    return {
      status: "error",
      message: "Environnement introuvable.",
    };
  }

  try {
    await prisma.runbookEnvironment.update({
      where: {
        id: environmentId,
      },
      data: parsedEnvironment.data,
    });

    await writeAdminAuditLog({
      action: "UPDATE",
      entityId: environmentId,
      entityType: "runbook_environment",
      metadata: {
        kind: parsedEnvironment.data.kind,
        name: parsedEnvironment.data.name,
        projectId: environment.runbook.projectId,
        slug: parsedEnvironment.data.slug,
      },
      session,
      summary: "Mise à jour d'un environnement de runbook.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return duplicateEnvironmentSlugError();
    }

    throw error;
  }

  revalidateRunbookPages(environment.runbook.projectId);

  return {
    status: "success",
    message: "Environnement mis à jour.",
  };
}

export async function deleteRunbookEnvironment(
  environmentId: string,
  _previousState: RunbookEnvironmentFormState,
  _formData: FormData,
): Promise<RunbookEnvironmentFormState> {
  void _previousState;
  void _formData;

  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const environment = await prisma.runbookEnvironment.findUnique({
    where: {
      id: environmentId,
    },
    select: {
      runbook: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!environment) {
    return {
      status: "error",
      message: "Environnement introuvable.",
    };
  }

  await prisma.runbookEnvironment.delete({
    where: {
      id: environmentId,
    },
  });

  await writeAdminAuditLog({
    action: "DELETE",
    entityId: environmentId,
    entityType: "runbook_environment",
    metadata: {
      projectId: environment.runbook.projectId,
    },
    session,
    summary: "Suppression d'un environnement de runbook.",
  });

  revalidateRunbookPages(environment.runbook.projectId);

  return {
    status: "success",
    message: "Environnement supprimé.",
  };
}

export async function createRunbookStep(
  runbookId: string,
  _previousState: RunbookStepFormState,
  formData: FormData,
): Promise<RunbookStepFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedStep = parseRunbookStepFormData(formData);

  if (!parsedStep.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedStep.error.flatten().fieldErrors,
    };
  }

  const projectId = await getRunbookProjectId(runbookId);

  if (!projectId) {
    return {
      status: "error",
      message: "Runbook introuvable.",
    };
  }

  const belongsToRunbook = await environmentBelongsToRunbook(
    parsedStep.data.environmentId,
    runbookId,
  );

  if (!belongsToRunbook) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: {
        environmentId: [
          "L'environnement sélectionné n'appartient pas à ce runbook.",
        ],
      },
    };
  }

  const step = await prisma.runbookStep.create({
    data: {
      ...parsedStep.data,
      runbookId,
    },
  });

  await writeAdminAuditLog({
    action: "CREATE",
    entityId: step.id,
    entityType: "runbook_step",
    metadata: {
      projectId,
      runbookId,
      title: parsedStep.data.title,
      type: parsedStep.data.type,
    },
    session,
    summary: "Création d'une étape de runbook.",
  });

  revalidateRunbookPages(projectId);

  return {
    status: "success",
    message: "Étape créée.",
  };
}

export async function updateRunbookStep(
  stepId: string,
  _previousState: RunbookStepFormState,
  formData: FormData,
): Promise<RunbookStepFormState> {
  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const parsedStep = parseRunbookStepFormData(formData);

  if (!parsedStep.success) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: parsedStep.error.flatten().fieldErrors,
    };
  }

  const step = await prisma.runbookStep.findUnique({
    where: {
      id: stepId,
    },
    select: {
      runbookId: true,
      runbook: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!step) {
    return {
      status: "error",
      message: "Étape introuvable.",
    };
  }

  const belongsToRunbook = await environmentBelongsToRunbook(
    parsedStep.data.environmentId,
    step.runbookId,
  );

  if (!belongsToRunbook) {
    return {
      status: "error",
      message: "Certains champs doivent être corrigés.",
      errors: {
        environmentId: [
          "L'environnement sélectionné n'appartient pas à ce runbook.",
        ],
      },
    };
  }

  await prisma.runbookStep.update({
    where: {
      id: stepId,
    },
    data: parsedStep.data,
  });

  await writeAdminAuditLog({
    action: "UPDATE",
    entityId: stepId,
    entityType: "runbook_step",
    metadata: {
      projectId: step.runbook.projectId,
      title: parsedStep.data.title,
      type: parsedStep.data.type,
    },
    session,
    summary: "Mise à jour d'une étape de runbook.",
  });

  revalidateRunbookPages(step.runbook.projectId);

  return {
    status: "success",
    message: "Étape mise à jour.",
  };
}

export async function deleteRunbookStep(
  stepId: string,
  _previousState: RunbookStepFormState,
  _formData: FormData,
): Promise<RunbookStepFormState> {
  void _previousState;
  void _formData;

  const session = await ensureAdminSession();

  if (isSessionError(session)) {
    return session;
  }

  const step = await prisma.runbookStep.findUnique({
    where: {
      id: stepId,
    },
    select: {
      runbook: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!step) {
    return {
      status: "error",
      message: "Étape introuvable.",
    };
  }

  await prisma.runbookStep.delete({
    where: {
      id: stepId,
    },
  });

  await writeAdminAuditLog({
    action: "DELETE",
    entityId: stepId,
    entityType: "runbook_step",
    metadata: {
      projectId: step.runbook.projectId,
    },
    session,
    summary: "Suppression d'une étape de runbook.",
  });

  revalidateRunbookPages(step.runbook.projectId);

  return {
    status: "success",
    message: "Étape supprimée.",
  };
}
