import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createProject, deleteProject, updateProject } from "./actions";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  getServerSession: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
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
      create: mocks.create,
      delete: mocks.delete,
      update: mocks.update,
    },
  },
}));

function createProjectFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    title: "Portfolio master",
    slug: "portfolio-master",
    shortDescription: "Portfolio administrable.",
    description: "Projet de portfolio avec administration.",
    status: "IN_PROGRESS",
    visibility: "PUBLIC",
    repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
    demoUrl: "https://portfolio.justdoeat.org",
    startedAt: "2026-01-10",
    endedAt: "2026-05-20",
    stacks: "Next.js, Prisma",
    tags: "en-cours",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("project actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.create.mockResolvedValue({});
    mocks.update.mockResolvedValue({});
    mocks.delete.mockResolvedValue({});
  });

  it("creates a project", async () => {
    const result = await createProject(
      { status: "idle" },
      createProjectFormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Projet créé.",
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Portfolio master",
        slug: "portfolio-master",
        shortDescription: "Portfolio administrable.",
        status: "IN_PROGRESS",
        visibility: "PUBLIC",
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        startedAt: expect.any(Date),
        endedAt: expect.any(Date),
        stacks: {
          create: [
            expect.objectContaining({
              stack: expect.objectContaining({
                connectOrCreate: expect.objectContaining({
                  where: {
                    slug: "next-js",
                  },
                }),
              }),
            }),
            expect.objectContaining({
              stack: expect.objectContaining({
                connectOrCreate: expect.objectContaining({
                  where: {
                    slug: "prisma",
                  },
                }),
              }),
            }),
          ],
        },
        tags: {
          create: [
            expect.objectContaining({
              tag: expect.objectContaining({
                connectOrCreate: expect.objectContaining({
                  where: {
                    slug: "en-cours",
                  },
                }),
              }),
            }),
          ],
        },
      }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/projects");
  });

  it("updates a project", async () => {
    const result = await updateProject(
      "project-id",
      { status: "idle" },
      createProjectFormData({
        title: "Portfolio master v2",
        slug: "portfolio-master-v2",
      }),
    );

    expect(result).toEqual({
      status: "success",
      message: "Projet mis à jour.",
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        id: "project-id",
      },
      data: expect.objectContaining({
        title: "Portfolio master v2",
        slug: "portfolio-master-v2",
        tags: expect.objectContaining({
          deleteMany: {},
          create: expect.any(Array),
        }),
        stacks: expect.objectContaining({
          deleteMany: {},
          create: expect.any(Array),
        }),
      }),
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/projects");
  });

  it("deletes a project", async () => {
    const result = await deleteProject(
      "project-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Projet supprimé.",
    });
    expect(mocks.delete).toHaveBeenCalledWith({
      where: {
        id: "project-id",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/projects");
  });

  it("rejects invalid payloads", async () => {
    const result = await createProject(
      { status: "idle" },
      createProjectFormData({
        title: "",
      }),
    );

    expect(result.status).toBe("error");
    expect(result.errors?.title?.[0]).toBe("Le titre est obligatoire.");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("rejects anonymous users", async () => {
    mocks.getServerSession.mockResolvedValue(null);

    const result = await createProject(
      { status: "idle" },
      createProjectFormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Votre session a expiré. Reconnectez-vous pour continuer.",
    });
    expect(getServerSession).toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
