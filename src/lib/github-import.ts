import { Buffer } from "node:buffer";
import { z } from "zod";
import {
  normalizeProjectSlug,
  parseProjectStacksInput,
  type ProjectStackInput,
  type ProjectTagInput,
} from "@/lib/projects";

const githubRepositorySchema = z.object({
  archived: z.boolean(),
  created_at: z.string(),
  description: z.string().nullable(),
  full_name: z.string(),
  homepage: z.string().nullable(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  name: z.string(),
  private: z.boolean(),
  pushed_at: z.string().nullable(),
  visibility: z.string().nullable().optional(),
});

const githubLanguagesSchema = z.record(z.string(), z.number().nonnegative());
const githubReadmeSchema = z.object({
  content: z.string(),
  encoding: z.string(),
});

const githubOwnerPattern = /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i;
const githubRepositoryPattern = /^[a-z0-9._-]{1,100}$/i;

export class GithubImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GithubImportError";
  }
}

export type ParsedGithubRepositoryUrl = {
  normalizedUrl: string;
  owner: string;
  repo: string;
};

export type ImportedGithubProject = {
  fullName: string;
  project: {
    demoUrl: string | null;
    description: string;
    endedAt: Date | null;
    githubIsPrivate: boolean;
    githubPushedAt: Date | null;
    githubReadme: string | null;
    githubVisibility: string;
    repositoryUrl: string;
    shortDescription: string;
    showDetails: boolean;
    showExternalLinks: boolean;
    showMedia: boolean;
    showMetadata: boolean;
    showTechnologies: boolean;
    slug: string;
    stacks: ProjectStackInput[];
    startedAt: Date | null;
    status: "DRAFT" | "ARCHIVED";
    tags: ProjectTagInput[];
    title: string;
    visibility: "PRIVATE";
  };
};

function validateGithubPath(
  owner: string | undefined,
  repo: string | undefined,
) {
  const cleanRepo = repo?.replace(/\.git$/i, "");

  if (
    !owner ||
    !cleanRepo ||
    !githubOwnerPattern.test(owner) ||
    !githubRepositoryPattern.test(cleanRepo)
  ) {
    throw new GithubImportError("L'URL GitHub doit pointer vers un dépôt.");
  }

  return {
    owner,
    repo: cleanRepo,
  };
}

export function parseGithubRepositoryUrl(
  repositoryUrl: string,
): ParsedGithubRepositoryUrl {
  const trimmedUrl = repositoryUrl.trim();

  if (!trimmedUrl) {
    throw new GithubImportError("Renseignez l'URL du dépôt GitHub.");
  }

  const sshMatch = trimmedUrl.match(/^git@github\.com:([^/]+)\/(.+)$/i);

  if (sshMatch) {
    const { owner, repo } = validateGithubPath(sshMatch[1], sshMatch[2]);

    return {
      normalizedUrl: `https://github.com/${owner}/${repo}`,
      owner,
      repo,
    };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(
      trimmedUrl.startsWith("github.com/")
        ? `https://${trimmedUrl}`
        : trimmedUrl,
    );
  } catch {
    throw new GithubImportError("L'URL GitHub est invalide.");
  }

  if (!["github.com", "www.github.com"].includes(parsedUrl.hostname)) {
    throw new GithubImportError("L'URL doit provenir de github.com.");
  }

  const [ownerSegment, repoSegment] = parsedUrl.pathname
    .split("/")
    .filter(Boolean);
  const { owner, repo } = validateGithubPath(ownerSegment, repoSegment);

  return {
    normalizedUrl: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
  };
}

function getGithubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "projet-master-portfolio",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_ACCESS_TOKEN;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchGithubJson<T>(
  url: string,
  schema: z.ZodType<T>,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: getGithubHeaders(),
    });
  } catch {
    throw new GithubImportError("Impossible de contacter l'API GitHub.");
  }

  if (response.status === 404) {
    throw new GithubImportError("Dépôt GitHub introuvable ou inaccessible.");
  }

  if (response.status === 403) {
    throw new GithubImportError(
      "L'API GitHub refuse la requête. Réessayez plus tard ou ajoutez un token GitHub côté serveur.",
    );
  }

  if (!response.ok) {
    throw new GithubImportError("Le dépôt GitHub ne peut pas être importé.");
  }

  const parsedPayload = schema.safeParse(await response.json());

  if (!parsedPayload.success) {
    throw new GithubImportError(
      "La réponse GitHub ne contient pas les données attendues.",
    );
  }

  return parsedPayload.data;
}

async function fetchGithubLanguages(owner: string, repo: string) {
  try {
    const languages = await fetchGithubJson(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      githubLanguagesSchema,
    );

    return Object.entries(languages)
      .sort(([, firstBytes], [, secondBytes]) => secondBytes - firstBytes)
      .map(([language]) => language);
  } catch {
    return [];
  }
}

async function fetchGithubReadme(owner: string, repo: string) {
  try {
    const readme = await fetchGithubJson(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      githubReadmeSchema,
    );

    if (readme.encoding.toLowerCase() !== "base64") {
      return null;
    }

    const decodedReadme = Buffer.from(
      readme.content.replace(/\s/g, ""),
      "base64",
    )
      .toString("utf8")
      .trim();

    return decodedReadme ? truncateText(decodedReadme, 30000) : null;
  } catch {
    return null;
  }
}

function truncateText(text: string, maxLength: number) {
  const trimmedText = text.trim();

  if (trimmedText.length <= maxLength) {
    return trimmedText;
  }

  return `${trimmedText.slice(0, maxLength - 3).trimEnd()}...`;
}

function toProjectTitle(repoName: string) {
  const title = repoName.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

  return title ? `${title[0].toUpperCase()}${title.slice(1)}` : repoName;
}

function normalizeOptionalHttpUrl(url: string | null) {
  if (!url?.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    return ["http:", "https:"].includes(parsedUrl.protocol)
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

function parseGithubDate(dateValue: string | null | undefined) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  return Number.isNaN(date.getTime()) ? null : date;
}

export async function importGithubRepositoryProject(
  repositoryUrl: string,
): Promise<ImportedGithubProject> {
  const { owner, repo } = parseGithubRepositoryUrl(repositoryUrl);
  const repository = await fetchGithubJson(
    `https://api.github.com/repos/${owner}/${repo}`,
    githubRepositorySchema,
  );
  const languageLabels = await fetchGithubLanguages(owner, repo);
  const readme = await fetchGithubReadme(owner, repo);
  const stacks = parseProjectStacksInput(
    (languageLabels.length > 0
      ? languageLabels
      : [repository.language].filter(Boolean)
    )
      .slice(0, 16)
      .join(", "),
  );
  const fallbackDescription = `Projet importé depuis le dépôt GitHub ${repository.full_name}.`;
  const shortDescription = truncateText(
    repository.description || fallbackDescription,
    220,
  );
  const description = truncateText(
    [repository.description, fallbackDescription].filter(Boolean).join("\n\n"),
    3000,
  );

  return {
    fullName: repository.full_name,
    project: {
      demoUrl: normalizeOptionalHttpUrl(repository.homepage),
      description,
      endedAt: null,
      githubIsPrivate: repository.private,
      githubPushedAt: parseGithubDate(repository.pushed_at),
      githubReadme: readme,
      githubVisibility:
        repository.visibility ?? (repository.private ? "private" : "public"),
      repositoryUrl: repository.html_url,
      shortDescription,
      showDetails: true,
      showExternalLinks: true,
      showMedia: true,
      showMetadata: true,
      showTechnologies: true,
      slug: normalizeProjectSlug(repository.name),
      stacks,
      startedAt: parseGithubDate(repository.created_at),
      status: repository.archived ? "ARCHIVED" : "DRAFT",
      tags: repository.archived ? [{ label: "Archivé", slug: "archive" }] : [],
      title: toProjectTitle(repository.name),
      visibility: "PRIVATE",
    },
  };
}
