import { Buffer } from "node:buffer";
import Link from "next/link";
import { PUBLIC_PROFILE_ID } from "@/lib/public-profile";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";
import { ScrollReveal } from "./scroll-reveal";
import { ThemeToggle } from "./theme-toggle";

export const dynamic = "force-dynamic";

const fallbackProfile = {
  displayName: "Enzo Chevalier",
  headline: "fullstack & cybersécurité.",
  bio: "Je conçois des applications complètes et sécurisées — du schéma de base de données au déploiement CI/CD. Ce portfolio est lui-même piloté par un dashboard privé que j'ai développé.",
  contactEmail: "admin@example.com",
  githubUrl: null,
  linkedinUrl: null,
  avatarData: null,
  avatarMimeType: null,
};

// ponytail: liste en dur (cf. handoff) — brancher sur les stacks en base si besoin.
const skills = [
  "TypeScript",
  "Next.js",
  "Prisma",
  "PostgreSQL",
  "Docker",
  "CI/CD",
  "Sécurité applicative",
  "Cloudflare",
];

const monthYearFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

function createDataUrl(data: Uint8Array | null, mimeType: string | null) {
  if (!data || !mimeType) {
    return null;
  }

  return `data:${mimeType};base64,${Buffer.from(data).toString("base64")}`;
}

function formatDate(date: Date | null) {
  if (!date) {
    return null;
  }

  const formatted = monthYearFormatter.format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatPeriod(
  startDate: Date | null,
  endDate: Date | null,
  isCurrent: boolean,
) {
  const start = formatDate(startDate);
  const end = isCurrent ? "Aujourd'hui" : formatDate(endDate);

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return `Depuis ${start}`;
  }

  if (end) {
    return end;
  }

  return "Période à préciser";
}

export default async function Home() {
  const [profile, timelineItems, projects] = await Promise.all([
    prisma.publicProfile.findUnique({
      where: { id: PUBLIC_PROFILE_ID },
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
        { sortOrder: "asc" },
        { startDate: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        title: true,
        organization: true,
        description: true,
        startDate: true,
        endDate: true,
        isCurrent: true,
      },
    }),
    prisma.project.findMany({
      where: { visibility: "PUBLIC" },
      orderBy: [{ startedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        showTechnologies: true,
        showExternalLinks: true,
        showMedia: true,
        repositoryUrl: true,
        demoUrl: true,
        media: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          take: 1,
          select: { id: true, altText: true, imageData: true, mimeType: true },
        },
        stacks: {
          orderBy: { stack: { label: "asc" } },
          select: { stack: { select: { label: true } } },
        },
      },
    }),
  ]);

  const publicProfile = profile ?? fallbackProfile;
  const avatarUrl = createDataUrl(
    publicProfile.avatarData,
    publicProfile.avatarMimeType,
  );

  return (
    <main className={styles.page}>
      <ScrollReveal />
      <nav className={styles.nav} aria-label="Navigation principale">
        <Link className={styles.brand} href="/">
          enzo<span>@portfolio:~$</span>
        </Link>
        <div className={styles.navLinks}>
          <a href="#projets">./projets</a>
          <a href="#parcours">./parcours</a>
          <a href="/statistics">./stats</a>
          <a href="#contact">./contact</a>
          <ThemeToggle />
        </div>
      </nav>

      <section
        className={styles.hero}
        id="accueil"
        aria-labelledby="home-title"
      >
        <div>
          <p className={styles.heroStatus}>
            <span className={styles.heroStatusDot} aria-hidden="true">
              ●
            </span>{" "}
            M2 Cyber — open to work / à l&apos;écoute d&apos;opportunités
          </p>
          <h1 id="home-title" className={styles.title}>
            {publicProfile.displayName}
            <br />
            <span className={styles.titleAccent}>{publicProfile.headline}</span>
          </h1>
          <p className={styles.description}>{publicProfile.bio}</p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="#projets">
              Voir mes projets ↓
            </a>
            {publicProfile.githubUrl ? (
              <a
                className={styles.secondaryAction}
                href={publicProfile.githubUrl}
                rel="noreferrer"
                target="_blank"
              >
                github ↗
              </a>
            ) : null}
          </div>
        </div>
        <div className={styles.heroPortrait}>
          <div className={styles.portraitFrame}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Portrait de ${publicProfile.displayName}`}
                src={avatarUrl}
              />
            ) : null}
          </div>
          {avatarUrl ? null : (
            <p className={styles.portraitCaption}>
              {"// portrait — à renseigner depuis le dashboard"}
            </p>
          )}
        </div>
      </section>

      <section
        className={styles.section}
        data-reveal=""
        id="projets"
        aria-labelledby="projects-label"
      >
        <p className={styles.sectionLabel} id="projects-label">
          01 — projets / projects
        </p>
        <div className={styles.projectList}>
          {projects.map((project, index) => {
            const media = project.showMedia ? project.media.at(0) : undefined;
            const mediaUrl = media
              ? createDataUrl(media.imageData, media.mimeType)
              : null;

            return (
              <article className={styles.projectCard} key={project.id}>
                <span className={styles.projectIndex} aria-hidden="true">
                  /{String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className={styles.projectTitle}>{project.title}</h2>
                  <p className={styles.projectDescription}>
                    {project.shortDescription}
                  </p>
                  {project.showTechnologies && project.stacks.length > 0 ? (
                    <p className={styles.projectStacks}>
                      {project.stacks
                        .map(({ stack }) => stack.label.toLowerCase())
                        .join(" · ")}
                    </p>
                  ) : null}
                  <div className={styles.projectLinks}>
                    <Link href={`/projects/${project.slug}`}>
                      voir le projet →
                    </Link>
                    {project.showExternalLinks && project.repositoryUrl ? (
                      <a
                        href={project.repositoryUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        github ↗
                      </a>
                    ) : null}
                    {project.showExternalLinks && project.demoUrl ? (
                      <a href={project.demoUrl} rel="noreferrer" target="_blank">
                        démo ↗
                      </a>
                    ) : null}
                  </div>
                </div>
                {mediaUrl ? (
                  <div className={styles.projectMedia}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={
                        media?.altText || `Capture du projet ${project.title}`
                      }
                      src={mediaUrl}
                    />
                  </div>
                ) : (
                  <div className={styles.projectMediaEmpty} aria-hidden="true">
                    capture d&apos;écran du projet
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section
        className={styles.section}
        data-reveal=""
        aria-labelledby="skills-label"
      >
        <p className={styles.sectionLabel} id="skills-label">
          02 — compétences / skills
        </p>
        <div className={styles.skills}>
          {skills.map((skill) => (
            <span className={styles.skill} key={skill}>
              {skill}
            </span>
          ))}
        </div>
      </section>

      <div className={styles.split} id="parcours">
        <section
          className={styles.splitLeft}
          data-reveal=""
          aria-labelledby="timeline-label"
        >
          <p className={styles.sectionLabel} id="timeline-label">
            03 — parcours / timeline
          </p>
          <div className={styles.timeline}>
            {timelineItems.map((item) => (
              <div className={styles.timelineItem} key={item.id}>
                <span className={styles.timelinePeriod}>
                  {formatPeriod(item.startDate, item.endDate, item.isCurrent)}
                </span>
                <div>
                  <h3 className={styles.timelineTitle}>{item.title}</h3>
                  <p className={styles.timelineMeta}>
                    {item.organization}
                    {item.description ? ` — ${item.description}` : null}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className={styles.splitRight}
          data-reveal=""
          id="contact"
          aria-labelledby="contact-label"
        >
          <div>
            <p className={styles.sectionLabel} id="contact-label">
              04 — contact
            </p>
            <h2 className={styles.contactTitle}>
              Une opportunité, un projet, un retour technique&nbsp;?{" "}
              <span className={styles.titleAccent}>Écris-moi.</span>
            </h2>
          </div>
          <div className={styles.contactLinks}>
            <a href={`mailto:${publicProfile.contactEmail}`}>
              → {publicProfile.contactEmail}
            </a>
            {publicProfile.githubUrl ? (
              <a href={publicProfile.githubUrl} rel="noreferrer" target="_blank">
                → {publicProfile.githubUrl.replace("https://", "")}
              </a>
            ) : null}
            {publicProfile.linkedinUrl ? (
              <a
                href={publicProfile.linkedinUrl}
                rel="noreferrer"
                target="_blank"
              >
                → {publicProfile.linkedinUrl.replace("https://", "")}
              </a>
            ) : null}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <span>© 2026 — {publicProfile.displayName} · M2 Cyber</span>
        <span>next.js · typescript · prisma · docker</span>
      </footer>
    </main>
  );
}
