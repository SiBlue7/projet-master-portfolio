"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./page.module.css";

export type PublicProjectCardViewModel = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  statusLabel: string;
  period: string;
  repositoryUrl: string | null;
  demoUrl: string | null;
  tags: {
    label: string;
    slug: string;
  }[];
};

type PublicProjectShowcaseProps = {
  projects: PublicProjectCardViewModel[];
};

export function PublicProjectShowcase({
  projects,
}: PublicProjectShowcaseProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedTag, setSelectedTag] = useState("all");
  const projectTags = Array.from(
    projects
      .flatMap((project) => project.tags)
      .reduce(
        (tagsBySlug, tag) => tagsBySlug.set(tag.slug, tag),
        new Map<string, PublicProjectCardViewModel["tags"][number]>(),
      )
      .values(),
  );
  const filteredProjects =
    selectedTag === "all"
      ? projects
      : projects.filter((project) =>
          project.tags.some((tag) => tag.slug === selectedTag),
        );
  const hasOverflowControls = filteredProjects.length > 2;

  function selectTag(tagSlug: string) {
    setSelectedTag(tagSlug);
    listRef.current?.scrollTo({
      behavior: "smooth",
      left: 0,
    });
  }

  function scrollProjects(direction: "previous" | "next") {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const firstCard = list.querySelector<HTMLElement>(`.${styles.projectCard}`);
    const scrollAmount = firstCard
      ? firstCard.offsetWidth + 20
      : list.clientWidth;

    list.scrollBy({
      behavior: "smooth",
      left: direction === "next" ? scrollAmount : -scrollAmount,
    });
  }

  return (
    <section
      className={styles.projectsSection}
      aria-labelledby="projects-title"
    >
      <div className={styles.projectsHeader}>
        <p className={styles.sectionEyebrow}>Projets</p>
        <div>
          <h2 id="projects-title" className={styles.projectsTitle}>
            Des réalisations pensées comme des produits complets
          </h2>
          <p className={styles.projectsIntro}>
            Une sélection de projets publics avec leur contexte, leur statut et
            leurs liens utiles.
          </p>
        </div>
      </div>

      {projectTags.length > 0 ? (
        <div className={styles.projectFilters} aria-label="Filtrer les projets">
          <button
            className={styles.projectFilterButton}
            type="button"
            data-selected={selectedTag === "all"}
            aria-pressed={selectedTag === "all"}
            onClick={() => selectTag("all")}
          >
            Tous les projets
          </button>
          {projectTags.map((tag) => (
            <button
              className={styles.projectFilterButton}
              type="button"
              data-selected={selectedTag === tag.slug}
              aria-pressed={selectedTag === tag.slug}
              key={tag.slug}
              onClick={() => selectTag(tag.slug)}
            >
              {tag.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.projectsCarousel}>
        {hasOverflowControls ? (
          <button
            className={`${styles.projectsArrow} ${styles.projectsArrowPrevious}`}
            type="button"
            aria-label="Voir les projets précédents"
            onClick={() => scrollProjects("previous")}
          >
            <span aria-hidden="true">&lt;</span>
          </button>
        ) : null}

        <div
          className={styles.projectsList}
          data-scrollable={hasOverflowControls}
          ref={listRef}
          tabIndex={hasOverflowControls ? 0 : undefined}
        >
          {filteredProjects.map((project) => (
            <article className={styles.projectCard} key={project.id}>
              <div className={styles.projectPreview} aria-hidden="true">
                <div className={styles.projectPreviewTopbar}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.projectPreviewBody}>
                  <span className={styles.projectPreviewMark}>
                    {project.title.at(0)}
                  </span>
                  <span className={styles.projectPreviewLine} />
                  <span className={styles.projectPreviewLine} />
                </div>
              </div>

              <div className={styles.projectCardBody}>
                <div className={styles.projectCardHeader}>
                  <span className={styles.projectStatus}>
                    {project.statusLabel}
                  </span>
                  <span className={styles.projectPeriod}>{project.period}</span>
                </div>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>
                  {project.shortDescription}
                </p>
                {project.tags.length > 0 ? (
                  <div
                    className={styles.projectTagList}
                    aria-label={`Tags du projet ${project.title}`}
                  >
                    {project.tags.map((tag) => (
                      <span className={styles.projectTag} key={tag.slug}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.projectActions}>
                <Link
                  className={styles.projectPrimaryLink}
                  href={`/projects/${project.slug}`}
                >
                  Voir les détails
                </Link>
                {project.repositoryUrl ? (
                  <a
                    className={styles.projectSecondaryLink}
                    href={project.repositoryUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    GitHub
                  </a>
                ) : null}
                {project.demoUrl ? (
                  <a
                    className={styles.projectSecondaryLink}
                    href={project.demoUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Démo
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        {hasOverflowControls ? (
          <button
            className={`${styles.projectsArrow} ${styles.projectsArrowNext}`}
            type="button"
            aria-label="Voir les projets suivants"
            onClick={() => scrollProjects("next")}
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}
