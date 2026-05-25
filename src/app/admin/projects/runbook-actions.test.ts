import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRunbook,
  createRunbookEnvironment,
  createRunbookStep,
  deleteRunbook,
  updateRunbookStep,
} from "./runbook-actions";

const mocks = vi.hoisted(() => ({
  createEnvironment: vi.fn(),
  createRunbook: vi.fn(),
  createStep: vi.fn(),
  deleteRunbook: vi.fn(),
  findEnvironment: vi.fn(),
  findProject: vi.fn(),
  findRunbook: vi.fn(),
  findStep: vi.fn(),
  getServerSession: vi.fn(),
  revalidatePath: vi.fn(),
  updateStep: vi.fn(),
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
    project: {
      findUnique: mocks.findProject,
    },
    runbook: {
      create: mocks.createRunbook,
      delete: mocks.deleteRunbook,
      findUnique: mocks.findRunbook,
    },
    runbookEnvironment: {
      create: mocks.createEnvironment,
      findFirst: mocks.findEnvironment,
    },
    runbookStep: {
      create: mocks.createStep,
      findUnique: mocks.findStep,
      update: mocks.updateStep,
    },
  },
}));

vi.mock("@/lib/admin-audit", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
}));

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

function createRunbookFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    description: "Procédure de déploiement.",
    isActive: "on",
    slug: "deploiement",
    sortOrder: "0",
    title: "Déploiement",
    ...overrides,
  });
}

function createEnvironmentFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    baseUrl: "https://preprod.justdoeat.org",
    kind: "PREPROD",
    name: "Préproduction",
    slug: "preproduction",
    sortOrder: "0",
    ...overrides,
  });
}

function createStepFormData(overrides: Record<string, string> = {}) {
  return createFormData({
    environmentId: "environment-id",
    expectedResult: "La route retourne ok.",
    httpMethod: "GET",
    isExecutable: "on",
    sortOrder: "1",
    title: "Vérifier le healthcheck",
    type: "HTTP_REQUEST",
    url: "/api/health",
    ...overrides,
  });
}

describe("runbook actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.findProject.mockResolvedValue({
      id: "project-id",
    });
    mocks.findRunbook.mockResolvedValue({
      projectId: "project-id",
    });
    mocks.findEnvironment.mockResolvedValue({
      id: "environment-id",
    });
    mocks.findStep.mockResolvedValue({
      runbookId: "runbook-id",
      runbook: {
        projectId: "project-id",
      },
    });
    mocks.createRunbook.mockResolvedValue({});
    mocks.deleteRunbook.mockResolvedValue({});
    mocks.createEnvironment.mockResolvedValue({});
    mocks.createStep.mockResolvedValue({});
    mocks.updateStep.mockResolvedValue({});
  });

  it("creates a runbook for a project", async () => {
    const result = await createRunbook(
      "project-id",
      { status: "idle" },
      createRunbookFormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Runbook créé.",
    });
    expect(mocks.createRunbook).toHaveBeenCalledWith({
      data: {
        description: "Procédure de déploiement.",
        isActive: true,
        isPublic: false,
        projectId: "project-id",
        slug: "deploiement",
        sortOrder: 0,
        title: "Déploiement",
      },
    });
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        entityType: "runbook",
        summary: "Création d'un runbook.",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith(
      "/admin/projects/[projectId]",
      "page",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/projects/project-id");
  });

  it("creates a runbook environment", async () => {
    const result = await createRunbookEnvironment(
      "runbook-id",
      { status: "idle" },
      createEnvironmentFormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Environnement créé.",
    });
    expect(mocks.createEnvironment).toHaveBeenCalledWith({
      data: {
        baseUrl: "https://preprod.justdoeat.org",
        kind: "PREPROD",
        name: "Préproduction",
        runbookId: "runbook-id",
        slug: "preproduction",
        sortOrder: 0,
      },
    });
  });

  it("creates a runbook step", async () => {
    const result = await createRunbookStep(
      "runbook-id",
      { status: "idle" },
      createStepFormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Étape créée.",
    });
    expect(mocks.createStep).toHaveBeenCalledWith({
      data: expect.objectContaining({
        command: null,
        environmentId: "environment-id",
        httpMethod: "GET",
        isExecutable: true,
        runbookId: "runbook-id",
        title: "Vérifier le healthcheck",
        type: "HTTP_REQUEST",
        url: "/api/health",
      }),
    });
  });

  it("rejects a step environment from another runbook", async () => {
    mocks.findEnvironment.mockResolvedValue(null);

    const result = await createRunbookStep(
      "runbook-id",
      { status: "idle" },
      createStepFormData(),
    );

    expect(result.status).toBe("error");
    expect(result.errors?.environmentId?.[0]).toBe(
      "L'environnement sélectionné n'appartient pas à ce runbook.",
    );
    expect(mocks.createStep).not.toHaveBeenCalled();
  });

  it("updates a runbook step", async () => {
    const result = await updateRunbookStep(
      "step-id",
      { status: "idle" },
      createStepFormData({
        title: "Contrôler la route health",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Étape mise à jour.",
    });
    expect(mocks.updateStep).toHaveBeenCalledWith({
      where: {
        id: "step-id",
      },
      data: expect.objectContaining({
        title: "Contrôler la route health",
      }),
    });
  });

  it("deletes a runbook", async () => {
    const result = await deleteRunbook(
      "runbook-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Runbook supprimé.",
    });
    expect(mocks.deleteRunbook).toHaveBeenCalledWith({
      where: {
        id: "runbook-id",
      },
    });
  });

  it("rejects anonymous users", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const result = await createRunbook(
      "project-id",
      { status: "idle" },
      createRunbookFormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Votre session a expiré. Reconnectez-vous pour continuer.",
    });
    expect(getServerSession).toHaveBeenCalled();
    expect(mocks.createRunbook).not.toHaveBeenCalled();
  });
});
