import { describe, expect, it } from "vitest";
import {
  normalizeProjectSlug,
  parseProjectFormData,
  parseProjectStacksInput,
  parseProjectTagsInput,
} from "./projects";

function createProjectFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    title: "Portfolio master",
    slug: "Portfolio Master",
    shortDescription: "Portfolio administrable.",
    description: "Projet de portfolio avec administration et préproduction.",
    status: "IN_PROGRESS",
    visibility: "PUBLIC",
    repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
    demoUrl: "https://portfolio.justdoeat.org",
    startedAt: "2026-01-10",
    endedAt: "2026-05-20",
    stacks: "Next.js, Prisma, Docker",
    tags: "en-cours",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("project helpers", () => {
  it("normalizes project slugs", () => {
    expect(normalizeProjectSlug("Projet Master Portfolio")).toBe(
      "projet-master-portfolio",
    );
    expect(normalizeProjectSlug("Démo  API!!")).toBe("demo-api");
  });

  it("parses a defined project tag", () => {
    expect(parseProjectTagsInput("Terminé")).toEqual([
      {
        label: "Terminé",
        slug: "termine",
      },
    ]);
  });

  it("parses and deduplicates project technologies", () => {
    expect(parseProjectStacksInput("Next.js, Prisma, next js, Docker")).toEqual(
      [
        {
          label: "Next.js",
          slug: "next-js",
        },
        {
          label: "Prisma",
          slug: "prisma",
        },
        {
          label: "Docker",
          slug: "docker",
        },
      ],
    );
  });

  it("parses a project form payload", () => {
    const result = parseProjectFormData(createProjectFormData());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toMatchObject({
        title: "Portfolio master",
        slug: "portfolio-master",
        shortDescription: "Portfolio administrable.",
        description:
          "Projet de portfolio avec administration et préproduction.",
        status: "IN_PROGRESS",
        visibility: "PUBLIC",
        showDetails: true,
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        demoUrl: "https://portfolio.justdoeat.org",
        stacks: [
          {
            label: "Next.js",
            slug: "next-js",
          },
          {
            label: "Prisma",
            slug: "prisma",
          },
          {
            label: "Docker",
            slug: "docker",
          },
        ],
        tags: [
          {
            label: "En cours",
            slug: "en-cours",
          },
        ],
      });
      expect(result.data.startedAt?.toISOString()).toBe(
        "2026-01-10T00:00:00.000Z",
      );
      expect(result.data.endedAt?.toISOString()).toBe(
        "2026-05-20T00:00:00.000Z",
      );
    }
  });

  it("rejects invalid date ordering", () => {
    const result = parseProjectFormData(
      createProjectFormData({
        endedAt: "2025-12-31",
        startedAt: "2026-01-10",
      }),
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endedAt?.[0]).toBe(
        "La date de fin doit être postérieure à la date de début.",
      );
    }
  });

  it("parses unchecked public section visibility options", () => {
    const result = parseProjectFormData(
      createProjectFormData({
        showDetails: "off",
        showExternalLinks: "off",
        showMedia: "off",
        showMetadata: "off",
        showTechnologies: "off",
      }),
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toMatchObject({
        showDetails: false,
        showExternalLinks: false,
        showMedia: false,
        showMetadata: false,
        showTechnologies: false,
      });
    }
  });
});
