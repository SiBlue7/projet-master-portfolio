import { Buffer } from "node:buffer";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { AdminNavigation } from "@/app/admin/admin-navigation";
import { authOptions } from "@/lib/auth";
import { isDefinedProjectTag } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { ProjectDetailEditor } from "../project-detail-editor";
import type { ProjectViewModel } from "../project-form";
import type { RunbookViewModel } from "../runbook-manager";
import styles from "../page.module.css";

type AdminProjectDetailsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

function dateToDateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function createProjectMediaUrl(imageData: Uint8Array, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(imageData).toString("base64")}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function dateToDateTimeLabel(date: Date | null) {
  if (!date) {
    return "";
  }

  return dateTimeFormatter.format(date);
}

export default async function AdminProjectDetailsPage({
  params,
}: AdminProjectDetailsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      status: true,
      visibility: true,
      showDetails: true,
      showTechnologies: true,
      showExternalLinks: true,
      showMedia: true,
      showMetadata: true,
      repositoryUrl: true,
      demoUrl: true,
      startedAt: true,
      endedAt: true,
      githubPushedAt: true,
      githubVisibility: true,
      githubIsPrivate: true,
      githubReadme: true,
      media: {
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          id: true,
          altText: true,
          fileName: true,
          imageData: true,
          mimeType: true,
          sortOrder: true,
        },
      },
      runbooks: {
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          isActive: true,
          isPublic: true,
          sortOrder: true,
          environments: {
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
            select: {
              id: true,
              kind: true,
              name: true,
              slug: true,
              baseUrl: true,
              sortOrder: true,
            },
          },
          steps: {
            orderBy: [
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
            select: {
              id: true,
              environmentId: true,
              title: true,
              description: true,
              type: true,
              command: true,
              url: true,
              httpMethod: true,
              expectedResult: true,
              isExecutable: true,
              sortOrder: true,
            },
          },
        },
      },
      stacks: {
        orderBy: {
          stack: {
            label: "asc",
          },
        },
        select: {
          stack: {
            select: {
              label: true,
              slug: true,
            },
          },
        },
      },
      tags: {
        orderBy: {
          tag: {
            label: "asc",
          },
        },
        select: {
          tag: {
            select: {
              label: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const stacks = project.stacks.map(({ stack }) => stack);
  const tags = project.tags.map(({ tag }) => tag).filter(isDefinedProjectTag);
  const projectViewModel: ProjectViewModel = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    description: project.description,
    stacks: stacks.map((stack) => stack.label).join(", "),
    stackList: stacks,
    tagSlug: tags[0]?.slug ?? "",
    tagList: tags,
    status: project.status,
    visibility: project.visibility,
    showDetails: project.showDetails,
    showTechnologies: project.showTechnologies,
    showExternalLinks: project.showExternalLinks,
    showMedia: project.showMedia,
    showMetadata: project.showMetadata,
    repositoryUrl: project.repositoryUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    startedAt: dateToDateInputValue(project.startedAt),
    endedAt: dateToDateInputValue(project.endedAt),
    githubPushedAt: dateToDateTimeLabel(project.githubPushedAt),
    githubVisibility: project.githubVisibility ?? "",
    githubIsPrivate: project.githubIsPrivate,
    githubReadme: project.githubReadme ?? "",
    media: project.media.map((media) => ({
      id: media.id,
      altText: media.altText ?? "",
      fileName: media.fileName,
      sortOrder: media.sortOrder,
      src: createProjectMediaUrl(media.imageData, media.mimeType),
    })),
  };
  const runbooks: RunbookViewModel[] = project.runbooks.map((runbook) => ({
    id: runbook.id,
    title: runbook.title,
    slug: runbook.slug,
    description: runbook.description ?? "",
    isActive: runbook.isActive,
    isPublic: runbook.isPublic,
    sortOrder: runbook.sortOrder,
    environments: runbook.environments.map((environment) => ({
      id: environment.id,
      kind: environment.kind,
      name: environment.name,
      slug: environment.slug,
      baseUrl: environment.baseUrl ?? "",
      sortOrder: environment.sortOrder,
    })),
    steps: runbook.steps.map((step) => ({
      id: step.id,
      environmentId: step.environmentId ?? "",
      title: step.title,
      description: step.description ?? "",
      type: step.type,
      command: step.command ?? "",
      url: step.url ?? "",
      httpMethod: step.httpMethod ?? "GET",
      expectedResult: step.expectedResult ?? "",
      isExecutable: step.isExecutable,
      sortOrder: step.sortOrder,
    })),
  }));

  return (
    <main className={styles.page}>
      <AdminNavigation activeItem="project-list" />

      <section className={styles.main} aria-labelledby="project-detail-title">
        <Link className={styles.backLink} href="/admin/projects/list">
          ← retour à la liste — {project.slug}
        </Link>

        <p className={styles.eyebrow}>~/admin/projects/{project.slug}</p>
        <h1 id="project-detail-title" className={styles.title}>
          {project.title}
          <span className={styles.titleDot}>.</span>
        </h1>
        <p className={styles.description}>
          Modifiez les informations publiques, les technologies, les liens et
          les captures de ce projet.
        </p>

        <ProjectDetailEditor project={projectViewModel} runbooks={runbooks} />
      </section>
    </main>
  );
}
