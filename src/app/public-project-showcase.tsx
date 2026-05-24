"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

const projectMediaAutoplayDelay = 5000;

export type PublicProjectCardViewModel = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  statusLabel: string | null;
  period: string | null;
  repositoryUrl: string | null;
  demoUrl: string | null;
  media: {
    id: string;
    altText: string;
    src: string;
  }[];
  stacks: {
    label: string;
    slug: string;
  }[];
  tags: {
    label: string;
    slug: string;
  }[];
};

type PublicProjectShowcaseProps = {
  projects: PublicProjectCardViewModel[];
  sectionId?: string;
};

function ProjectCardMediaPreview({
  project,
}: {
  project: PublicProjectCardViewModel;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMedia = project.media.length > 0;
  const hasMultipleMedia = project.media.length > 1;

  useEffect(() => {
    if (!hasMultipleMedia) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) =>
        currentIndex === project.media.length - 1 ? 0 : currentIndex + 1,
      );
    }, projectMediaAutoplayDelay);

    return () => window.clearInterval(intervalId);
  }, [hasMultipleMedia, project.media.length]);

  function showPreviousMedia() {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? project.media.length - 1 : currentIndex - 1,
    );
  }

  function showNextMedia() {
    setActiveIndex((currentIndex) =>
      currentIndex === project.media.length - 1 ? 0 : currentIndex + 1,
    );
  }

  if (!hasMedia) {
    return (
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
    );
  }

  return (
    <div
      className={styles.projectPreview}
      aria-label={`Captures du projet ${project.title}`}
    >
      <div
        className={styles.projectMediaTrack}
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
        }}
      >
        {project.media.map((media, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.projectPreviewImage}
            src={media.src}
            alt={index === activeIndex ? media.altText : ""}
            aria-hidden={index !== activeIndex}
            key={media.id}
          />
        ))}
      </div>

      {hasMultipleMedia ? (
        <div className={styles.projectMediaControls}>
          <button
            className={styles.projectMediaButton}
            type="button"
            aria-label={`Capture précédente du projet ${project.title}`}
            onClick={showPreviousMedia}
          >
            &lt;
          </button>

          <span className={styles.projectMediaStatus}>
            {activeIndex + 1}/{project.media.length}
          </span>

          <button
            className={styles.projectMediaButton}
            type="button"
            aria-label={`Capture suivante du projet ${project.title}`}
            onClick={showNextMedia}
          >
            &gt;
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function PublicProjectShowcase({
  projects,
  sectionId,
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
      id={sectionId}
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
              <ProjectCardMediaPreview project={project} />

              <div className={styles.projectCardBody}>
                {project.statusLabel || project.period ? (
                  <div className={styles.projectCardHeader}>
                    {project.statusLabel ? (
                      <span className={styles.projectStatus}>
                        {project.statusLabel}
                      </span>
                    ) : null}
                    {project.period ? (
                      <span className={styles.projectPeriod}>
                        {project.period}
                      </span>
                    ) : null}
                  </div>
                ) : null}
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
                {project.stacks.length > 0 ? (
                  <div
                    className={styles.projectStackList}
                    aria-label={`Technologies du projet ${project.title}`}
                  >
                    {project.stacks.map((stack) => (
                      <span className={styles.projectStack} key={stack.slug}>
                        {stack.label}
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
