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

const identityTags = ["Next.js", "Prisma", "Docker", "Cloudflare"];

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
  showTechnologies: boolean;
  showExternalLinks: boolean;
  showMedia: boolean;
  showMetadata: boolean;
  repositoryUrl: string | null;
  demoUrl: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  media: {
    id: string;
    altText: string | null;
    imageData: Uint8Array;
    mimeType: string;
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

function createProjectMediaUrl(imageData: Uint8Array, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(imageData).toString("base64")}`;
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
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        showMetadata: true,
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
    (project) => {
      return {
        id: project.id,
        title: project.title,
        slug: project.slug,
        shortDescription: project.shortDescription,
        statusLabel: project.showMetadata
          ? PROJECT_STATUS_LABELS[project.status]
          : null,
        period: project.showMetadata
          ? formatPublicProjectPeriod(project)
          : null,
        repositoryUrl: project.showExternalLinks ? project.repositoryUrl : null,
        demoUrl: project.showExternalLinks ? project.demoUrl : null,
        media: project.showMedia
          ? project.media.map((media) => ({
              id: media.id,
              altText: media.altText || `Capture du projet ${project.title}`,
              src: createProjectMediaUrl(media.imageData, media.mimeType),
            }))
          : [],
        stacks: project.showTechnologies
          ? project.stacks.map(({ stack }) => stack)
          : [],
        tags: project.tags.map(({ tag }) => tag).filter(isDefinedProjectTag),
      };
    },
  );
  const heroStats = [
    {
      label: "Projets",
      value: publicProjects.length.toString(),
      detail: "publics",
    },
    {
      label: "Parcours",
      value: timelineItems.length.toString(),
      detail: "étapes",
    },
    {
      label: "Socle",
      value: "Fullstack",
      detail: "sécurité",
    },
  ];

  return (
    <main className={styles.page}>
      <nav
        className={styles.anchorNav}
        aria-label="Navigation de la page d'accueil"
      >
        <a href="#accueil">Accueil</a>
        {publicProjects.length > 0 ? <a href="#projets">Projets</a> : null}
        {hasTimelineItems ? <a href="#parcours">Parcours</a> : null}
        <a href="#socle">Socle</a>
        <a href="#contact">Contact</a>
      </nav>

      <section
        id="accueil"
        className={styles.hero}
        aria-labelledby="home-title"
      >
        <div className={styles.content}>
          <div className={styles.heroKicker}>
            <span className={styles.kickerDot} aria-hidden="true" />
            <span>Portfolio M2 Cyber</span>
            <span className={styles.kickerSeparator} aria-hidden="true" />
            <span>Fullstack & sécurité</span>
          </div>
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
            <a className={styles.secondaryAction} href="/statistics">
              Statistiques
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

          <dl className={styles.heroStats} aria-label="Repères du portfolio">
            {heroStats.map((stat) => (
              <div className={styles.heroStat} key={stat.label}>
                <dt>{stat.label}</dt>
                <dd>
                  <strong>{stat.value}</strong>
                  <span>{stat.detail}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className={styles.profileCard} aria-label="Résumé du profil">
          <div className={styles.profileCardHeader}>
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
              <p className={styles.cardLabel}>Profil public</p>
              <p className={styles.cardName}>{publicProfile.displayName}</p>
              <p className={styles.cardHeadline}>{publicProfile.headline}</p>
            </div>
          </div>

          <div
            className={styles.identityScreen}
            aria-label="Identité technique"
          >
            <div className={styles.identityScreenBar} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <dl className={styles.identityLines}>
              <div>
                <dt>focus</dt>
                <dd>cybersécurité applicative</dd>
              </div>
              <div>
                <dt>build</dt>
                <dd>interfaces admin & publiques</dd>
              </div>
              <div>
                <dt>deploy</dt>
                <dd>CI/CD, préprod, monitoring</dd>
              </div>
            </dl>
            <div className={styles.identityTags} aria-label="Technologies clés">
              {identityTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
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
        <PublicProjectShowcase projects={publicProjects} sectionId="projets" />
      ) : null}

      {hasTimelineItems ? (
        <section
          id="parcours"
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
        id="socle"
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

      <section
        id="contact"
        className={styles.contactSection}
        aria-labelledby="contact-title"
      >
        <div className={styles.contactContent}>
          <p className={styles.sectionEyebrow}>Contact</p>
          <h2 id="contact-title" className={styles.contactTitle}>
            Échanger autour d&apos;une opportunité, d&apos;un projet ou
            d&apos;un retour technique
          </h2>
          <p className={styles.contactDescription}>
            Le moyen le plus direct reste l&apos;e-mail. Les profils GitHub et
            LinkedIn permettent aussi de retrouver mon travail et mon parcours.
          </p>
        </div>

        <div className={styles.contactActions}>
          <a
            className={styles.contactPrimary}
            href={`mailto:${publicProfile.contactEmail}`}
          >
            {publicProfile.contactEmail}
          </a>
          {publicProfile.githubUrl ? (
            <a
              className={styles.contactSecondary}
              href={publicProfile.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
          ) : null}
          {publicProfile.linkedinUrl ? (
            <a
              className={styles.contactSecondary}
              href={publicProfile.linkedinUrl}
              rel="noreferrer"
              target="_blank"
            >
              LinkedIn
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
