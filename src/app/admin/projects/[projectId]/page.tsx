import { Buffer } from "node:buffer";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isDefinedProjectTag } from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { ProjectDetailEditor } from "../project-detail-editor";
import type { ProjectViewModel } from "../project-form";
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
      repositoryUrl: true,
      demoUrl: true,
      startedAt: true,
      endedAt: true,
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
    repositoryUrl: project.repositoryUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    startedAt: dateToDateInputValue(project.startedAt),
    endedAt: dateToDateInputValue(project.endedAt),
    media: project.media.map((media) => ({
      id: media.id,
      altText: media.altText ?? "",
      fileName: media.fileName,
      sortOrder: media.sortOrder,
      src: createProjectMediaUrl(media.imageData, media.mimeType),
    })),
  };

  return (
    <main className={styles.page}>
      <section className={styles.main} aria-labelledby="project-detail-title">
        <Link className={styles.backLink} href="/admin/projects/list">
          Retour à la liste des projets
        </Link>

        <p className={styles.eyebrow}>Détail admin</p>
        <h1 id="project-detail-title" className={styles.title}>
          {project.title}
        </h1>
        <p className={styles.description}>
          Modifiez les informations publiques, les technologies, les liens et
          les captures de ce projet.
        </p>

        <ProjectDetailEditor project={projectViewModel} />
      </section>
    </main>
  );
}
