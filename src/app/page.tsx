import { Buffer } from "node:buffer";
import { PUBLIC_PROFILE_ID } from "@/lib/public-profile";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

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

export default async function Home() {
  const profile = await prisma.publicProfile.findUnique({
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
  });
  const publicProfile = profile ?? fallbackProfile;
  const initials = getInitials(publicProfile.displayName);
  const avatarUrl = createAvatarUrl(
    publicProfile.avatarData,
    publicProfile.avatarMimeType,
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
