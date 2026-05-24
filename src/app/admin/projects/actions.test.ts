import { Buffer } from "node:buffer";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addProjectMedia,
  createProject,
  deleteProject,
  deleteProjectMedia,
  importProjectFromGithub,
  syncProjectWithGithub,
  updateProject,
} from "./actions";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createMedia: vi.fn(),
  delete: vi.fn(),
  deleteMedia: vi.fn(),
  findMedia: vi.fn(),
  findProject: vi.fn(),
  getServerSession: vi.fn(),
  revalidatePath: vi.fn(),
  update: vi.fn(),
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
      create: mocks.create,
      delete: mocks.delete,
      findUnique: mocks.findProject,
      update: mocks.update,
    },
    projectMedia: {
      create: mocks.createMedia,
      delete: mocks.deleteMedia,
      findUnique: mocks.findMedia,
    },
  },
}));

vi.mock("@/lib/admin-audit", () => ({
  writeAdminAuditLog: mocks.writeAdminAuditLog,
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
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue({
      user: {
        pseudo: "admin",
      },
    });
    mocks.create.mockResolvedValue({
      id: "project-id",
    });
    mocks.update.mockResolvedValue({});
    mocks.delete.mockResolvedValue({});
    mocks.createMedia.mockResolvedValue({});
    mocks.deleteMedia.mockResolvedValue({});
    mocks.findMedia.mockResolvedValue({
      project: {
        slug: "portfolio-master",
      },
    });
    mocks.findProject.mockResolvedValue({
      slug: "portfolio-master",
    });
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
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        entityType: "project",
        metadata: {
          slug: "portfolio-master",
          title: "Portfolio master",
        },
        summary: "Création d'un projet.",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/projects");
  });

  it("imports a project from a GitHub repository URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            archived: false,
            created_at: "2026-01-10T12:00:00Z",
            description: "Portfolio administrable.",
            full_name: "SiBlue7/projet-master-portfolio",
            homepage: "",
            html_url: "https://github.com/SiBlue7/projet-master-portfolio",
            language: "TypeScript",
            name: "projet-master-portfolio",
            private: false,
            pushed_at: "2026-05-20T08:30:00Z",
            visibility: "public",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            TypeScript: 1000,
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: Buffer.from("# Portfolio\n\nImported README.").toString(
              "base64",
            ),
            encoding: "base64",
          }),
        ),
      );
    const formData = new FormData();
    formData.set(
      "githubUrl",
      "https://github.com/SiBlue7/projet-master-portfolio",
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await importProjectFromGithub({ status: "idle" }, formData);

    expect(result).toEqual({
      status: "success",
      message: "Projet importé depuis GitHub en brouillon privé.",
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        description: expect.stringContaining("SiBlue7/projet-master-portfolio"),
        githubIsPrivate: false,
        githubPushedAt: expect.any(Date),
        githubReadme: "# Portfolio\n\nImported README.",
        githubVisibility: "public",
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        shortDescription: "Portfolio administrable.",
        slug: "projet-master-portfolio",
        stacks: {
          create: [
            expect.objectContaining({
              stack: expect.objectContaining({
                connectOrCreate: expect.objectContaining({
                  where: {
                    slug: "typescript",
                  },
                }),
              }),
            }),
          ],
        },
        status: "DRAFT",
        title: "Projet master portfolio",
        visibility: "PRIVATE",
      }),
    });
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CREATE",
        entityId: "project-id",
        entityType: "project",
        metadata: {
          fullName: "SiBlue7/projet-master-portfolio",
          githubIsPrivate: false,
          githubPushedAt: "2026-05-20T08:30:00.000Z",
          githubReadmeImported: true,
          githubVisibility: "public",
          repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
          source: "github_import",
        },
        summary: "Import d'un projet depuis GitHub.",
      }),
    );
  });

  it("syncs project metadata from GitHub without replacing local editorial fields", async () => {
    mocks.findProject.mockResolvedValue({
      repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
      slug: "portfolio-master",
      status: "IN_PROGRESS",
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            archived: false,
            created_at: "2026-01-10T12:00:00Z",
            description: "Description GitHub mise à jour.",
            full_name: "SiBlue7/projet-master-portfolio",
            homepage: "https://portfolio.justdoeat.org",
            html_url: "https://github.com/SiBlue7/projet-master-portfolio",
            language: "TypeScript",
            name: "projet-master-portfolio",
            private: false,
            pushed_at: "2026-05-21T09:45:00Z",
            visibility: "public",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            CSS: 500,
            TypeScript: 1000,
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: Buffer.from("# Portfolio\n\nSynced README.").toString(
              "base64",
            ),
            encoding: "base64",
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await syncProjectWithGithub(
      "project-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Métadonnées GitHub synchronisées.",
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: {
        id: "project-id",
      },
      data: expect.objectContaining({
        demoUrl: "https://portfolio.justdoeat.org/",
        githubIsPrivate: false,
        githubPushedAt: expect.any(Date),
        githubReadme: "# Portfolio\n\nSynced README.",
        githubVisibility: "public",
        description: expect.stringContaining("Description GitHub mise à jour."),
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        shortDescription: "Description GitHub mise à jour.",
        startedAt: expect.any(Date),
        status: "IN_PROGRESS",
        stacks: {
          deleteMany: {},
          create: [
            expect.objectContaining({
              stack: expect.objectContaining({
                connectOrCreate: expect.objectContaining({
                  where: {
                    slug: "typescript",
                  },
                }),
              }),
            }),
            expect.objectContaining({
              stack: expect.objectContaining({
                connectOrCreate: expect.objectContaining({
                  where: {
                    slug: "css",
                  },
                }),
              }),
            }),
          ],
        },
      }),
    });
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("title");
    expect(mocks.update.mock.calls[0][0].data).not.toHaveProperty("slug");
    expect(mocks.writeAdminAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "UPDATE",
        entityId: "project-id",
        entityType: "project",
        metadata: {
          fullName: "SiBlue7/projet-master-portfolio",
          repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
          githubIsPrivate: false,
          githubPushedAt: "2026-05-21T09:45:00.000Z",
          githubReadmeImported: true,
          githubVisibility: "public",
          source: "github_sync",
        },
        summary: "Synchronisation des métadonnées GitHub d'un projet.",
      }),
    );
  });

  it("rejects GitHub sync without repository URL", async () => {
    mocks.findProject.mockResolvedValue({
      repositoryUrl: null,
      slug: "portfolio-master",
      status: "IN_PROGRESS",
    });

    const result = await syncProjectWithGithub(
      "project-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Le projet GitHub ne peut pas être importé.",
      errors: {
        repositoryUrl: [
          "Ajoutez un lien GitHub au projet avant de lancer la synchronisation.",
        ],
      },
    });
    expect(mocks.update).not.toHaveBeenCalled();
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

  it("adds a project media", async () => {
    const formData = new FormData();
    formData.set(
      "image",
      new File([new Uint8Array([1, 2, 3])], "accueil.png", {
        type: "image/png",
      }),
    );
    formData.set("altText", "Capture de la page d'accueil");
    formData.set("sortOrder", "2");

    const result = await addProjectMedia(
      "project-id",
      { status: "idle" },
      formData,
    );

    expect(result).toEqual({
      status: "success",
      message: "Capture ajoutée.",
    });
    expect(mocks.findProject).toHaveBeenCalledWith({
      where: {
        id: "project-id",
      },
      select: {
        slug: true,
      },
    });
    expect(mocks.createMedia).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: "project-id",
        altText: "Capture de la page d'accueil",
        fileName: "accueil.png",
        mimeType: "image/png",
        sortOrder: 2,
      }),
    });
    expect(
      Buffer.isBuffer(mocks.createMedia.mock.calls[0][0].data.imageData),
    ).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/projects/portfolio-master");
  });

  it("deletes a project media", async () => {
    const result = await deleteProjectMedia(
      "media-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result).toEqual({
      status: "success",
      message: "Capture supprimée.",
    });
    expect(mocks.findMedia).toHaveBeenCalledWith({
      where: {
        id: "media-id",
      },
      select: {
        project: {
          select: {
            slug: true,
          },
        },
      },
    });
    expect(mocks.deleteMedia).toHaveBeenCalledWith({
      where: {
        id: "media-id",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/projects/portfolio-master");
  });

  it("rejects project media without image", async () => {
    const result = await addProjectMedia(
      "project-id",
      { status: "idle" },
      new FormData(),
    );

    expect(result.status).toBe("error");
    expect(result.errors?.image?.[0]).toBe("Ajoutez une image à importer.");
    expect(mocks.createMedia).not.toHaveBeenCalled();
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
