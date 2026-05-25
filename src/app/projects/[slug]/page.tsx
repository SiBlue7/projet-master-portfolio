import { Buffer } from "node:buffer";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isDefinedProjectTag,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects";
import { prisma } from "@/lib/prisma";
import {
  RUNBOOK_ENVIRONMENT_KIND_LABELS,
  RUNBOOK_STEP_TYPE_LABELS,
} from "@/lib/runbooks";
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
      showDetails: true,
      showTechnologies: true,
      showExternalLinks: true,
      showMedia: true,
      showMetadata: true,
      repositoryUrl: true,
      demoUrl: true,
      startedAt: true,
      endedAt: true,
      runbooks: {
        where: {
          isActive: true,
          isPublic: true,
        },
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
              baseUrl: true,
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
            },
          },
        },
      },
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
  const visibleProjectStacks = project.showTechnologies ? projectStacks : [];
  const visibleProjectMedia = project.showMedia ? projectMedia : [];
  const visibleRunbooks = project.runbooks;
  const coverMedia = visibleProjectMedia[0] ?? null;
  const hasExternalLinks =
    project.showExternalLinks && (project.demoUrl || project.repositoryUrl);
  const hasDetailSections =
    project.showMetadata ||
    project.showDetails ||
    visibleProjectStacks.length > 0 ||
    visibleProjectMedia.length > 0 ||
    visibleRunbooks.length > 0;

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

          {hasExternalLinks ? (
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
          ) : null}
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

      {hasDetailSections ? (
        <section className={styles.details} aria-label="Détails du projet">
          {project.showMetadata ? (
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
          ) : null}

          {project.showDetails ? (
            <article className={styles.descriptionPanel}>
              <h2 className={styles.sectionTitle}>Présentation</h2>
              <p className={styles.fullDescription}>{project.description}</p>
            </article>
          ) : null}

          {visibleProjectStacks.length > 0 ? (
            <article className={styles.descriptionPanel}>
              <h2 className={styles.sectionTitle}>Technologies utilisées</h2>
              <div
                className={styles.stackList}
                aria-label={`Technologies du projet ${project.title}`}
              >
                {visibleProjectStacks.map((stack) => (
                  <span className={styles.stack} key={stack.slug}>
                    {stack.label}
                  </span>
                ))}
              </div>
            </article>
          ) : null}

          {visibleProjectMedia.length > 0 ? (
            <article className={styles.descriptionPanel}>
              <h2 className={styles.sectionTitle}>Captures du projet</h2>
              <ProjectMediaCarousel
                items={visibleProjectMedia}
                projectTitle={project.title}
              />
            </article>
          ) : null}

          {visibleRunbooks.length > 0 ? (
            <article className={styles.descriptionPanel}>
              <h2 className={styles.sectionTitle}>Runbooks publics</h2>
              <p className={styles.runbookIntro}>
                Procédures documentées pour comprendre, vérifier ou exploiter le
                projet. Aucune action n&apos;est exécutée depuis cette page.
              </p>
              <div className={styles.runbookList}>
                {visibleRunbooks.map((runbook) => (
                  <section className={styles.runbookCard} key={runbook.id}>
                    <div className={styles.runbookHeader}>
                      <div>
                        <p className={styles.runbookSlug}>{runbook.slug}</p>
                        <h3 className={styles.runbookTitle}>{runbook.title}</h3>
                        {runbook.description ? (
                          <p className={styles.runbookDescription}>
                            {runbook.description}
                          </p>
                        ) : null}
                      </div>
                      <span className={styles.runbookCount}>
                        {runbook.steps.length} étape
                        {runbook.steps.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    {runbook.environments.length > 0 ? (
                      <div
                        className={styles.runbookEnvironmentList}
                        aria-label={`Environnements du runbook ${runbook.title}`}
                      >
                        {runbook.environments.map((environment) => (
                          <span
                            className={styles.runbookEnvironment}
                            key={environment.id}
                          >
                            <strong>{environment.name}</strong>
                            <small>
                              {
                                RUNBOOK_ENVIRONMENT_KIND_LABELS[
                                  environment.kind
                                ]
                              }
                            </small>
                            {environment.baseUrl ? (
                              <small>{environment.baseUrl}</small>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {runbook.steps.length > 0 ? (
                      <ol className={styles.runbookStepList}>
                        {runbook.steps.map((step) => {
                          const environment = runbook.environments.find(
                            (candidate) => candidate.id === step.environmentId,
                          );

                          return (
                            <li className={styles.runbookStep} key={step.id}>
                              <div className={styles.runbookStepHeader}>
                                <span className={styles.runbookStepType}>
                                  {RUNBOOK_STEP_TYPE_LABELS[step.type]}
                                </span>
                                {environment ? (
                                  <span className={styles.runbookStepEnv}>
                                    {environment.name}
                                  </span>
                                ) : null}
                              </div>
                              <h4 className={styles.runbookStepTitle}>
                                {step.title}
                              </h4>
                              {step.description ? (
                                <p className={styles.runbookStepText}>
                                  {step.description}
                                </p>
                              ) : null}
                              {step.command ? (
                                <pre className={styles.runbookCode}>
                                  <code>{step.command}</code>
                                </pre>
                              ) : null}
                              {step.url ? (
                                <p className={styles.runbookEndpoint}>
                                  <span>{step.httpMethod ?? "GET"}</span>
                                  <code>{step.url}</code>
                                </p>
                              ) : null}
                              {step.expectedResult ? (
                                <p className={styles.runbookExpected}>
                                  <strong>Résultat attendu</strong>
                                  {step.expectedResult}
                                </p>
                              ) : null}
                            </li>
                          );
                        })}
                      </ol>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
