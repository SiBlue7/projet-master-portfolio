import { Buffer } from "node:buffer";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isDefinedProjectTag,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import { ProjectMediaCarousel } from "./project-media-carousel";
import styles from "./page.module.css";

type ProjectDetailsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

function formatProjectDate(date: Date | null) {
  if (!date) {
    return null;
  }

  const formattedDate = monthYearFormatter.format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function formatProjectPeriod({
  endedAt,
  startedAt,
}: {
  endedAt: Date | null;
  startedAt: Date | null;
}) {
  const startDate = formatProjectDate(startedAt);
  const endDate = formatProjectDate(endedAt);

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) {
    return `Depuis ${startDate}`;
  }

  if (endDate) {
    return `Jusqu'à ${endDate}`;
  }

  return "Dates à préciser";
}

function createProjectMediaUrl(imageData: Uint8Array, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(imageData).toString("base64")}`;
}

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  const { slug } = await params;
  const project = await prisma.project.findFirst({
    where: {
      slug,
      visibility: "PUBLIC",
    },
    select: {
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      status: true,
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
          imageData: true,
          mimeType: true,
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

  const projectTags = project.tags
    .map(({ tag }) => tag)
    .filter(isDefinedProjectTag);
  const projectStacks = project.stacks.map(({ stack }) => stack);
  const projectMedia = project.media.map((media) => ({
    id: media.id,
    altText: media.altText || `Capture du projet ${project.title}`,
    src: createProjectMediaUrl(media.imageData, media.mimeType),
  }));
  const coverMedia = projectMedia[0] ?? null;

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="project-title">
        <div className={styles.content}>
          <Link className={styles.backLink} href="/">
            Retour au portfolio
          </Link>
          <p className={styles.eyebrow}>Projet public</p>
          <h1 id="project-title" className={styles.title}>
            {project.title}
          </h1>
          <p className={styles.shortDescription}>{project.shortDescription}</p>
          {projectTags.length > 0 ? (
            <div
              className={styles.tagList}
              aria-label={`Tags du projet ${project.title}`}
            >
              {projectTags.map((tag) => (
                <span className={styles.tag} key={tag.slug}>
                  {tag.label}
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.actions}>
            {project.demoUrl ? (
              <a
                className={styles.primaryAction}
                href={project.demoUrl}
                rel="noreferrer"
                target="_blank"
              >
                Voir la démo
              </a>
            ) : null}
            {project.repositoryUrl ? (
              <a
                className={styles.secondaryAction}
                href={project.repositoryUrl}
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            ) : null}
          </div>
        </div>

        {coverMedia ? (
          <aside className={styles.preview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.previewImage}
              src={coverMedia.src}
              alt={coverMedia.altText}
            />
          </aside>
        ) : (
          <aside className={styles.preview} aria-hidden="true">
            <div className={styles.previewTopbar}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.previewBody}>
              <span className={styles.previewMark}>{project.title.at(0)}</span>
              <span className={styles.previewLine} />
              <span className={styles.previewLine} />
            </div>
          </aside>
        )}
      </section>

      <section className={styles.details} aria-label="Détails du projet">
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Statut</span>
            <span className={styles.metaValue}>
              {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Période</span>
            <span className={styles.metaValue}>
              {formatProjectPeriod(project)}
            </span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Identifiant</span>
            <span className={styles.metaValue}>{project.slug}</span>
          </div>
        </div>

        <article className={styles.descriptionPanel}>
          <h2 className={styles.sectionTitle}>Présentation</h2>
          <p className={styles.fullDescription}>{project.description}</p>
        </article>

        {projectStacks.length > 0 ? (
          <article className={styles.descriptionPanel}>
            <h2 className={styles.sectionTitle}>Technologies utilisées</h2>
            <div
              className={styles.stackList}
              aria-label={`Technologies du projet ${project.title}`}
            >
              {projectStacks.map((stack) => (
                <span className={styles.stack} key={stack.slug}>
                  {stack.label}
                </span>
              ))}
            </div>
          </article>
        ) : null}

        {projectMedia.length > 0 ? (
          <article className={styles.descriptionPanel}>
            <h2 className={styles.sectionTitle}>Captures du projet</h2>
            <ProjectMediaCarousel
              items={projectMedia}
              projectTitle={project.title}
            />
          </article>
        ) : null}
      </section>
    </main>
  );
}
