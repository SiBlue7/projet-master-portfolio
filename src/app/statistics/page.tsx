import Link from "next/link";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  type ProjectStatus,
} from "@/lib/projects";
import {
  PROFILE_TIMELINE_ITEM_TYPE_LABELS,
  PROFILE_TIMELINE_ITEM_TYPES,
  type ProfileTimelineItemType,
} from "@/lib/profile-timeline";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

type StatisticProject = {
  id: string;
  status: ProjectStatus;
  showExternalLinks: boolean;
  showMedia: boolean;
  showMetadata: boolean;
  showTechnologies: boolean;
  repositoryUrl: string | null;
  demoUrl: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  updatedAt: Date;
  media: {
    id: string;
  }[];
  stacks: {
    stack: {
      label: string;
      slug: string;
    };
  }[];
  tags: {
    tag: {
      label: string;
      slug: string;
    };
  }[];
};

type TimelineItem = {
  id: string;
  type: ProfileTimelineItemType;
  updatedAt: Date;
};

type CountItem = {
  label: string;
  count: number;
};

const numberFormatter = new Intl.NumberFormat("fr-FR");
const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function getBarWidth(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.max(8, Math.round((value / total) * 100))}%`;
}

function countByLabel(items: CountItem[]) {
  return items
    .filter((item) => item.count > 0)
    .sort((first, second) => {
      if (second.count !== first.count) {
        return second.count - first.count;
      }

      return first.label.localeCompare(second.label, "fr");
    });
}

function incrementMap(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapToCountItems(map: Map<string, number>) {
  return countByLabel(
    Array.from(map.entries()).map(([label, count]) => ({
      count,
      label,
    })),
  );
}

function getLatestUpdate(projects: StatisticProject[], items: TimelineItem[]) {
  const timestamps = [
    ...projects.map((project) => project.updatedAt.getTime()),
    ...items.map((item) => item.updatedAt.getTime()),
  ].filter((timestamp) => Number.isFinite(timestamp));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

function getVisibleTechnologyStats(projects: StatisticProject[]) {
  const technologies = new Map<string, number>();

  projects
    .filter((project) => project.showTechnologies)
    .forEach((project) => {
      project.stacks.forEach(({ stack }) => {
        incrementMap(technologies, stack.label);
      });
    });

  return mapToCountItems(technologies);
}

function getVisibleTagStats(projects: StatisticProject[]) {
  const tags = new Map<string, number>();

  projects.forEach((project) => {
    project.tags.forEach(({ tag }) => {
      incrementMap(tags, tag.label);
    });
  });

  return mapToCountItems(tags);
}

function getProjectStatusStats(projects: StatisticProject[]) {
  const visibleStatusProjects = projects.filter(
    (project) => project.showMetadata,
  );
  const statusItems = PROJECT_STATUSES.map((status) => ({
    count: visibleStatusProjects.filter((project) => project.status === status)
      .length,
    label: PROJECT_STATUS_LABELS[status],
  }));

  return {
    items: countByLabel(statusItems),
    total: visibleStatusProjects.length,
  };
}

function getTimelineStats(items: TimelineItem[]) {
  return PROFILE_TIMELINE_ITEM_TYPES.map((type) => ({
    count: items.filter((item) => item.type === type).length,
    label: PROFILE_TIMELINE_ITEM_TYPE_LABELS[type],
  })).filter((item) => item.count > 0);
}

function BarList({
  items,
  total,
  variant = "accent",
}: {
  items: CountItem[];
  total: number;
  variant?: "accent" | "success";
}) {
  if (items.length === 0) {
    return (
      <p className={styles.emptyState}>
        Aucune donnée publique disponible pour le moment.
      </p>
    );
  }

  return (
    <div className={styles.barList}>
      {items.map((item) => (
        <div className={styles.barItem} key={item.label}>
          <div className={styles.barHeader}>
            <span>{item.label}</span>
            <span className={styles.barMeta}>
              {formatNumber(item.count)} · {formatPercent(item.count, total)}
            </span>
          </div>
          <div className={styles.barTrack} aria-hidden="true">
            <span
              className={styles.barFill}
              data-variant={variant}
              style={{
                width: getBarWidth(item.count, total),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StatisticsPage() {
  const [projects, timelineItems] = await Promise.all([
    prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
      ],
      select: {
        id: true,
        status: true,
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
        showTechnologies: true,
        repositoryUrl: true,
        demoUrl: true,
        startedAt: true,
        endedAt: true,
        updatedAt: true,
        media: {
          select: {
            id: true,
          },
        },
        stacks: {
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
    }),
    prisma.profileTimelineItem.findMany({
      select: {
        id: true,
        type: true,
        updatedAt: true,
      },
    }),
  ]);

  const technologyStats = getVisibleTechnologyStats(projects);
  const tagStats = getVisibleTagStats(projects);
  const statusStats = getProjectStatusStats(projects);
  const timelineStats = getTimelineStats(timelineItems);
  const visibleMediaCount = projects
    .filter((project) => project.showMedia)
    .reduce((total, project) => total + project.media.length, 0);
  const latestUpdate = getLatestUpdate(projects, timelineItems);
  const demoProjects = projects.filter(
    (project) => project.showExternalLinks && project.demoUrl,
  ).length;
  const githubProjects = projects.filter(
    (project) => project.showExternalLinks && project.repositoryUrl,
  ).length;
  const projectsWithMedia = projects.filter(
    (project) => project.showMedia && project.media.length > 0,
  ).length;
  const projectsWithPeriod = projects.filter(
    (project) => project.showMetadata && (project.startedAt || project.endedAt),
  ).length;

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Navigation principale">
        <Link className={styles.brand} href="/">
          enzo<span>@portfolio:~$</span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/#projets">./projets</Link>
          <Link href="/#parcours">./parcours</Link>
          <a className={styles.navLinkActive} href="/statistics">
            ./stats
          </a>
          <Link href="/#contact">./contact</Link>
        </div>
      </nav>

      <div className={styles.main}>
        <section className={styles.hero} aria-labelledby="statistics-title">
          <div>
            <p className={styles.eyebrow}>~/statistics — données publiques</p>
            <h1 id="statistics-title" className={styles.title}>
              Lecture chiffrée
              <br />
              <span className={styles.titleAccent}>du portfolio.</span>
            </h1>
            <p className={styles.description}>
              Cette page synthétise les projets publics, les technologies
              visibles, les captures ajoutées et les éléments de parcours déjà
              renseignés dans l’administration.
            </p>
          </div>

          <aside className={styles.summaryPanel}>
            <p className={styles.summaryLabel}>dernière mise à jour</p>
            <p className={styles.summaryValue}>
              {latestUpdate
                ? dateTimeFormatter.format(latestUpdate)
                : "Aucune donnée"}
            </p>
            <p className={styles.summaryHint}>
              Calculée à partir des projets publics et du parcours.
            </p>
          </aside>
        </section>

        <p className={styles.sectionLabel}>01 — indicateurs / overview</p>
        <section className={styles.metricsGrid} aria-label="Indicateurs clés">
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Projets publics</span>
            <span className={styles.metricValue}>
              {formatNumber(projects.length)}
            </span>
            <span className={styles.metricHelp}>
              Projets visibles sur le portfolio.
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Technologies visibles</span>
            <span className={styles.metricValue}>
              {formatNumber(technologyStats.length)}
            </span>
            <span className={styles.metricHelp}>
              Technologies distinctes affichées publiquement.
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Captures</span>
            <span className={styles.metricValue}>
              {formatNumber(visibleMediaCount)}
            </span>
            <span className={styles.metricHelp}>
              Screenshots visibles dans les projets.
            </span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Parcours</span>
            <span className={styles.metricValue}>
              {formatNumber(timelineItems.length)}
            </span>
            <span className={styles.metricHelp}>
              Formations, expériences et certifications.
            </span>
          </div>
        </section>

        <div className={styles.twoColumnGrid}>
          <article className={styles.panel} aria-labelledby="statuses-title">
            <p className={styles.sectionLabel} id="statuses-title">
              02 — statuts / status
            </p>
            <BarList items={statusStats.items} total={statusStats.total} />
          </article>
          <article className={styles.panel} aria-labelledby="tags-title">
            <p className={styles.sectionLabel} id="tags-title">
              03 — tags / labels
            </p>
            {tagStats.length > 0 ? (
              <div className={styles.tagCloud}>
                {tagStats.map((tag) => (
                  <span className={styles.tag} key={tag.label}>
                    {tag.label} · {formatNumber(tag.count)}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.emptyState}>
                Aucun tag public n’est encore associé aux projets.
              </p>
            )}
          </article>
        </div>

        <article className={styles.panel} aria-labelledby="technologies-title">
          <p className={styles.sectionLabel} id="technologies-title">
            04 — technologies / stacks
          </p>
          <BarList
            items={technologyStats.slice(0, 8)}
            total={projects.length}
          />
        </article>

        <div className={styles.twoColumnGrid}>
          <article className={styles.panel} aria-labelledby="coverage-title">
            <p className={styles.sectionLabel} id="coverage-title">
              05 — complétude / coverage
            </p>
            <div className={styles.coverageGrid}>
              <div className={styles.coverageItem}>
                <span className={styles.coverageLabel}>lien démo</span>
                <span className={styles.coverageValue}>
                  {formatPercent(demoProjects, projects.length)}
                </span>
                <span className={styles.coverageHelp}>
                  {formatNumber(demoProjects)} projet
                  {demoProjects > 1 ? "s" : ""} avec démo.
                </span>
              </div>
              <div className={styles.coverageItem}>
                <span className={styles.coverageLabel}>lien github</span>
                <span className={styles.coverageValue}>
                  {formatPercent(githubProjects, projects.length)}
                </span>
                <span className={styles.coverageHelp}>
                  {formatNumber(githubProjects)} projet
                  {githubProjects > 1 ? "s" : ""} avec dépôt.
                </span>
              </div>
              <div className={styles.coverageItem}>
                <span className={styles.coverageLabel}>captures</span>
                <span className={styles.coverageValue}>
                  {formatPercent(projectsWithMedia, projects.length)}
                </span>
                <span className={styles.coverageHelp}>
                  {formatNumber(projectsWithMedia)} projet
                  {projectsWithMedia > 1 ? "s" : ""} illustré
                  {projectsWithMedia > 1 ? "s" : ""}.
                </span>
              </div>
              <div className={styles.coverageItem}>
                <span className={styles.coverageLabel}>période</span>
                <span className={styles.coverageValue}>
                  {formatPercent(projectsWithPeriod, projects.length)}
                </span>
                <span className={styles.coverageHelp}>
                  {formatNumber(projectsWithPeriod)} projet
                  {projectsWithPeriod > 1 ? "s" : ""} daté
                  {projectsWithPeriod > 1 ? "s" : ""}.
                </span>
              </div>
            </div>
          </article>

          <article className={styles.panel} aria-labelledby="timeline-title">
            <p className={styles.sectionLabel} id="timeline-title">
              06 — parcours / timeline
            </p>
            <BarList
              items={timelineStats}
              total={timelineItems.length}
              variant="success"
            />
          </article>
        </div>
      </div>
    </main>
  );
}
