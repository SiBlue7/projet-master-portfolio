import { Buffer } from "node:buffer";
import {
  isDefinedProjectTag,
  PROJECT_STATUS_LABELS,
  type ProjectStatus,
} from "@/lib/projects";
import {
  PROFILE_TIMELINE_ITEM_TYPE_LABELS,
  PROFILE_TIMELINE_ITEM_TYPES,
  type ProfileTimelineItemType,
} from "@/lib/profile-timeline";
import { PUBLIC_PROFILE_ID } from "@/lib/public-profile";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import {
  PublicProjectShowcase,
  type PublicProjectCardViewModel,
} from "./public-project-showcase";
import { PublicTimelineGroup } from "./public-timeline-group";

export const dynamic = "force-dynamic";

const fallbackProfile = {
  displayName: "Portfolio technique",
  headline: "Cybersécurité, développement fullstack et projets techniques",
  bio: "Bienvenue sur mon portfolio. Cette page évoluera avec mes projets, mon parcours et les expériences que je souhaite mettre en avant.",
  contactEmail: "admin@example.com",
  githubUrl: null,
  linkedinUrl: null,
  avatarData: null,
  avatarMimeType: null,
};

const highlights = [
  { label: "Domaine", value: "Cybersécurité" },
  { label: "Approche", value: "Fullstack" },
  { label: "Déploiement", value: "CI/CD" },
];

const foundations = [
  { label: "Frontend", value: "Next.js + React" },
  { label: "Données", value: "PostgreSQL + Prisma" },
  { label: "Sécurité", value: "NextAuth" },
];

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

type PublicTimelineItem = {
  id: string;
  type: ProfileTimelineItemType;
  title: string;
  organization: string;
  location: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
};

type PublicProject = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  status: ProjectStatus;
  repositoryUrl: string | null;
  demoUrl: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  tags: {
    tag: {
      label: string;
      slug: string;
    };
  }[];
};

function getInitials(displayName: string) {
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("");

  return initials || "EC";
}

function createAvatarUrl(
  avatarData: Uint8Array | null,
  avatarMimeType: string | null,
) {
  if (!avatarData || !avatarMimeType) {
    return null;
  }

  return `data:${avatarMimeType};base64,${Buffer.from(avatarData).toString(
    "base64",
  )}`;
}

function formatTimelineDate(date: Date | null) {
  if (!date) {
    return null;
  }

  const formattedDate = monthYearFormatter.format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
}

function formatPublicTimelinePeriod(item: PublicTimelineItem) {
  const startDate = formatTimelineDate(item.startDate);
  const endDate = item.isCurrent
    ? "Aujourd'hui"
    : formatTimelineDate(item.endDate);

  if (startDate && endDate) {
    return `${startDate} - ${endDate}`;
  }

  if (startDate) {
    return `Depuis ${startDate}`;
  }

  if (endDate) {
    return endDate;
  }

  return "Période à préciser";
}

function formatPublicProjectPeriod(project: PublicProject) {
  const startedAt = formatTimelineDate(project.startedAt);
  const endedAt = formatTimelineDate(project.endedAt);

  if (startedAt && endedAt) {
    return `${startedAt} - ${endedAt}`;
  }

  if (startedAt) {
    return `Depuis ${startedAt}`;
  }

  if (endedAt) {
    return `Jusqu'à ${endedAt}`;
  }

  return "Dates à préciser";
}

export default async function Home() {
  const [profile, timelineItems, projects] = await Promise.all([
    prisma.publicProfile.findUnique({
      where: {
        id: PUBLIC_PROFILE_ID,
      },
      select: {
        displayName: true,
        headline: true,
        bio: true,
        contactEmail: true,
        githubUrl: true,
        linkedinUrl: true,
        avatarData: true,
        avatarMimeType: true,
      },
    }),
    prisma.profileTimelineItem.findMany({
      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      select: {
        id: true,
        type: true,
        title: true,
        organization: true,
        location: true,
        description: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    }),
    prisma.project.findMany({
      where: {
        visibility: "PUBLIC",
      },
      orderBy: [
        {
          startedAt: "desc",
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
        repositoryUrl: true,
        demoUrl: true,
        startedAt: true,
        endedAt: true,
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
    }),
  ]);
  const timelineGroups = PROFILE_TIMELINE_ITEM_TYPES.map((type) => ({
    type,
    items: timelineItems
      .filter((item) => item.type === type)
      .map((item) => ({
        id: item.id,
        title: item.title,
        organization: item.organization,
        location: item.location,
        description: item.description,
        period: formatPublicTimelinePeriod(item),
      })),
    label: PROFILE_TIMELINE_ITEM_TYPE_LABELS[type],
  })).filter((group) => group.items.length > 0);
  const hasTimelineItems = timelineGroups.length > 0;
  const publicProfile = profile ?? fallbackProfile;
  const initials = getInitials(publicProfile.displayName);
  const avatarUrl = createAvatarUrl(
    publicProfile.avatarData,
    publicProfile.avatarMimeType,
  );
  const publicProjects: PublicProjectCardViewModel[] = projects.map(
    (project) => ({
      id: project.id,
      title: project.title,
      slug: project.slug,
      shortDescription: project.shortDescription,
      statusLabel: PROJECT_STATUS_LABELS[project.status],
      period: formatPublicProjectPeriod(project),
      repositoryUrl: project.repositoryUrl,
      demoUrl: project.demoUrl,
      tags: project.tags.map(({ tag }) => tag).filter(isDefinedProjectTag),
    }),
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.content}>
          <p className={styles.eyebrow}>Portfolio technique</p>
          <h1 id="home-title" className={styles.title}>
            {publicProfile.displayName}
          </h1>
          <p className={styles.headline}>{publicProfile.headline}</p>
          <p className={styles.description}>{publicProfile.bio}</p>

          <div className={styles.actions} aria-label="Liens de contact">
            <a
              className={styles.primaryAction}
              href={`mailto:${publicProfile.contactEmail}`}
            >
              Me contacter
            </a>
            {publicProfile.githubUrl ? (
              <a
                className={styles.secondaryAction}
                href={publicProfile.githubUrl}
                rel="noreferrer"
                target="_blank"
              >
                GitHub
              </a>
            ) : null}
            {publicProfile.linkedinUrl ? (
              <a
                className={styles.secondaryAction}
                href={publicProfile.linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
            ) : null}
          </div>
        </div>

        <aside className={styles.profileCard} aria-label="Résumé du profil">
          {avatarUrl ? (
            <div className={styles.avatar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`Avatar de ${publicProfile.displayName}`}
                src={avatarUrl}
              />
            </div>
          ) : (
            <div className={styles.avatar} aria-hidden="true">
              {initials}
            </div>
          )}
          <div>
            <p className={styles.cardLabel}>Profil</p>
            <p className={styles.cardName}>{publicProfile.displayName}</p>
            <p className={styles.cardHeadline}>{publicProfile.headline}</p>
          </div>
          <dl className={styles.contactList}>
            <div>
              <dt>E-mail</dt>
              <dd>
                <a href={`mailto:${publicProfile.contactEmail}`}>
                  {publicProfile.contactEmail}
                </a>
              </dd>
            </div>
            {publicProfile.githubUrl ? (
              <div>
                <dt>GitHub</dt>
                <dd>
                  <a
                    href={publicProfile.githubUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {publicProfile.githubUrl}
                  </a>
                </dd>
              </div>
            ) : null}
            {publicProfile.linkedinUrl ? (
              <div>
                <dt>LinkedIn</dt>
                <dd>
                  <a
                    href={publicProfile.linkedinUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {publicProfile.linkedinUrl}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </aside>
      </section>

      <section className={styles.band} aria-label="Points forts">
        {highlights.map((item) => (
          <div className={styles.highlightItem} key={item.label}>
            <span className={styles.highlightLabel}>{item.label}</span>
            <span className={styles.highlightValue}>{item.value}</span>
          </div>
        ))}
      </section>

      {publicProjects.length > 0 ? (
        <PublicProjectShowcase projects={publicProjects} />
      ) : null}

      {hasTimelineItems ? (
        <section
          className={styles.timelineSection}
          aria-labelledby="timeline-title"
        >
          <div className={styles.timelineSectionHeader}>
            <p className={styles.sectionEyebrow}>Parcours</p>
            <div>
              <h2 id="timeline-title" className={styles.timelineSectionTitle}>
                Un profil construit par l&apos;expérience, la formation et la
                pratique
              </h2>
              <p className={styles.timelineSectionIntro}>
                Les étapes clés sont organisées par type pour retrouver
                rapidement le cursus, les expériences et les validations
                techniques.
              </p>
            </div>
          </div>

          <div className={styles.timelineGroups}>
            {timelineGroups.map((group) => (
              <PublicTimelineGroup
                items={group.items}
                key={group.type}
                label={group.label}
                type={group.type}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section
        className={styles.foundationSection}
        aria-labelledby="stack-title"
      >
        <div>
          <p className={styles.sectionEyebrow}>Socle applicatif</p>
          <h2 id="stack-title" className={styles.sectionTitle}>
            Une base technique prête pour les projets
          </h2>
        </div>

        <div className={styles.statusGrid}>
          {foundations.map((item) => (
            <div className={styles.statusItem} key={item.label}>
              <span className={styles.statusLabel}>{item.label}</span>
              <span className={styles.statusValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
