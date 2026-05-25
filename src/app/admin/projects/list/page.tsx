import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  isDefinedProjectTag,
  PROJECT_STATUS_LABELS,
  PROJECT_VISIBILITY_LABELS,
} from "@/lib/projects";
import { AdminNavigation } from "@/app/admin/admin-navigation";
import { prisma } from "@/lib/prisma";
import styles from "../page.module.css";

export default async function AdminProjectsListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const projects = await prisma.project.findMany({
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      status: true,
      visibility: true,
      updatedAt: true,
      _count: {
        select: {
          media: true,
          stacks: true,
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

  return (
    <main className={styles.page}>
      <AdminNavigation activeItem="project-list" />

      <section className={styles.main} aria-labelledby="projects-list-title">
        <Link className={styles.backLink} href="/admin">
          Retour au dashboard admin
        </Link>

        <p className={styles.eyebrow}>Projets existants</p>
        <h1 id="projects-list-title" className={styles.title}>
          Liste des projets
        </h1>
        <p className={styles.description}>
          Retrouvez rapidement un projet, son statut, sa visibilité et accédez à
          sa page détail pour le modifier.
        </p>

        <div className={styles.pageActions}>
          <Link className={styles.secondaryLink} href="/admin/projects">
            Créer un projet
          </Link>
        </div>

        <section className={styles.panel} aria-labelledby="existing-title">
          <h2 id="existing-title" className={styles.panelTitle}>
            Projets renseignés
          </h2>

          {projects.length > 0 ? (
            <div className={styles.projectList}>
              {projects.map((project) => {
                const tags = project.tags
                  .map(({ tag }) => tag)
                  .filter(isDefinedProjectTag);

                return (
                  <article className={styles.projectListItem} key={project.id}>
                    <div className={styles.projectSummaryMain}>
                      <span className={styles.projectSlug}>{project.slug}</span>
                      <h3 className={styles.projectTitle}>{project.title}</h3>
                      <p className={styles.projectDescription}>
                        {project.shortDescription}
                      </p>
                      <span className={styles.projectMetaLine}>
                        {project._count.stacks} technologie
                        {project._count.stacks > 1 ? "s" : ""} ·{" "}
                        {project._count.media} capture
                        {project._count.media > 1 ? "s" : ""}
                      </span>
                      {tags.length > 0 ? (
                        <span className={styles.tagList}>
                          {tags.map((tag) => (
                            <span className={styles.tagBadge} key={tag.slug}>
                              {tag.label}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </div>

                    <div className={styles.projectSummaryAside}>
                      <span className={styles.badge}>
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                      <span className={styles.badge}>
                        {PROJECT_VISIBILITY_LABELS[project.visibility]}
                      </span>
                      <Link
                        className={styles.detailLink}
                        href={`/admin/projects/${project.id}`}
                      >
                        Détails
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyState}>
              Aucun projet renseigné pour le moment.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
