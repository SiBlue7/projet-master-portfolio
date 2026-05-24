import { Buffer } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  importGithubRepositoryProject,
  parseGithubRepositoryUrl,
} from "./github-import";

function githubResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    headers: {
      "content-type": "application/json",
    },
    status,
  });
}

describe("github import helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses GitHub repository URLs", () => {
    expect(
      parseGithubRepositoryUrl(
        "https://github.com/SiBlue7/projet-master-portfolio/tree/dev",
      ),
    ).toEqual({
      normalizedUrl: "https://github.com/SiBlue7/projet-master-portfolio",
      owner: "SiBlue7",
      repo: "projet-master-portfolio",
    });
  });

  it("parses SSH GitHub repository URLs", () => {
    expect(
      parseGithubRepositoryUrl("git@github.com:SiBlue7/projet-master.git"),
    ).toEqual({
      normalizedUrl: "https://github.com/SiBlue7/projet-master",
      owner: "SiBlue7",
      repo: "projet-master",
    });
  });

  it("imports repository metadata and languages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        githubResponse({
          archived: false,
          created_at: "2026-01-10T12:00:00Z",
          description: "Portfolio administrable.",
          full_name: "SiBlue7/projet-master-portfolio",
          homepage: "https://portfolio.justdoeat.org",
          html_url: "https://github.com/SiBlue7/projet-master-portfolio",
          language: "TypeScript",
          name: "projet-master-portfolio",
          private: false,
          pushed_at: "2026-05-20T08:30:00Z",
          visibility: "public",
        }),
      )
      .mockResolvedValueOnce(
        githubResponse({
          CSS: 400,
          TypeScript: 2000,
        }),
      )
      .mockResolvedValueOnce(
        githubResponse({
          content: Buffer.from("# Portfolio\n\nImported README.").toString(
            "base64",
          ),
          encoding: "base64",
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    const importedProject = await importGithubRepositoryProject(
      "https://github.com/SiBlue7/projet-master-portfolio",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/SiBlue7/projet-master-portfolio",
      expect.objectContaining({
        cache: "no-store",
      }),
    );
    expect(importedProject).toMatchObject({
      fullName: "SiBlue7/projet-master-portfolio",
      project: {
        demoUrl: "https://portfolio.justdoeat.org/",
        githubIsPrivate: false,
        githubReadme: "# Portfolio\n\nImported README.",
        githubVisibility: "public",
        repositoryUrl: "https://github.com/SiBlue7/projet-master-portfolio",
        shortDescription: "Portfolio administrable.",
        slug: "projet-master-portfolio",
        status: "DRAFT",
        title: "Projet master portfolio",
        visibility: "PRIVATE",
      },
    });
    expect(importedProject.project.startedAt?.toISOString()).toBe(
      "2026-01-10T12:00:00.000Z",
    );
    expect(importedProject.project.githubPushedAt?.toISOString()).toBe(
      "2026-05-20T08:30:00.000Z",
    );
    expect(importedProject.project.stacks).toEqual([
      {
        label: "TypeScript",
        slug: "typescript",
      },
      {
        label: "CSS",
        slug: "css",
      },
    ]);
  });

  it("throws a readable error for inaccessible repositories", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(githubResponse({}, 404)));

    await expect(
      importGithubRepositoryProject("https://github.com/SiBlue7/missing"),
    ).rejects.toThrow("Dépôt GitHub introuvable ou inaccessible.");
  });
});
