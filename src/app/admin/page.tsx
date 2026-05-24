import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_VISIBILITY_LABELS,
} from "@/lib/projects";
import { PUBLIC_PROFILE_ID } from "@/lib/public-profile";
import { LogoutButton } from "./logout-button";
import styles from "./page.module.css";

const adminDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function formatAdminDate(date: Date) {
  return adminDateFormatter.format(date);
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const adminEmail = session.user.email ?? "Non renseigné";
  const [
    totalProjects,
    publicProjects,
    privateProjects,
    timelineItems,
    mediaItems,
    activeRunbooks,
    projectsWithoutMedia,
    projectsWithoutRepository,
    publicProfile,
    recentProjects,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({
      where: {
        visibility: "PUBLIC",
      },
    }),
    prisma.project.count({
      where: {
        visibility: "PRIVATE",
      },
    }),
    prisma.profileTimelineItem.count(),
    prisma.projectMedia.count(),
    prisma.runbook.count({
      where: {
        isActive: true,
      },
    }),
    prisma.project.count({
      where: {
        media: {
          none: {},
        },
      },
    }),
    prisma.project.count({
      where: {
        OR: [
          {
            repositoryUrl: null,
          },
          {
            repositoryUrl: "",
          },
        ],
      },
    }),
    prisma.publicProfile.findUnique({
      where: {
        id: PUBLIC_PROFILE_ID,
      },
      select: {
        avatarData: true,
        githubUrl: true,
        linkedinUrl: true,
      },
    }),
    prisma.project.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        status: true,
        title: true,
        updatedAt: true,
        visibility: true,
      },
      take: 3,
    }),
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        action: true,
        createdAt: true,
        id: true,
        status: true,
        summary: true,
      },
      take: 4,
    }),
  ]);
  const profileMissingItems = [
    !publicProfile ? "profil public" : null,
    publicProfile && !publicProfile.githubUrl ? "GitHub" : null,
    publicProfile && !publicProfile.linkedinUrl ? "LinkedIn" : null,
    publicProfile && !publicProfile.avatarData ? "avatar" : null,
  ].filter(Boolean);
  const quickStats = [
    {
      detail: `${publicProjects} publics · ${privateProjects} privés`,
      label: "Projets",
      value: totalProjects.toString(),
    },
    {
      detail: "formations, expériences et certifications",
      label: "Parcours",
      value: timelineItems.toString(),
    },
    {
      detail: "captures et photos de projets",
      label: "Médias",
      value: mediaItems.toString(),
    },
    {
      detail: "procédures actives",
      label: "Runbooks",
      value: activeRunbooks.toString(),
    },
  ];
  const shortcuts = [
    {
      description: "Ajouter un projet manuel ou via GitHub.",
      href: "/admin/projects",
      label: "Créer un projet",
      variant: "primary",
    },
    {
      description: "Retrouver, ouvrir et modifier les projets existants.",
      href: "/admin/projects/list",
      label: "Liste des projets",
      variant: "default",
    },
    {
      description: "Mettre à jour les informations publiques du profil.",
      href: "/admin/profile",
      label: "Profil public",
      variant: "default",
    },
    {
      description: "Gérer formations, expériences et certifications.",
      href: "/admin/profile/timeline",
      label: "Parcours",
      variant: "default",
    },
    {
      description: "Suivre les actions réalisées dans l'administration.",
      href: "/admin/logs",
      label: "Logs d'activité",
      variant: "default",
    },
    {
      description: "Contrôler rapidement la disponibilité applicative.",
      href: "/api/health",
      label: "Healthcheck",
      variant: "default",
    },
  ];
  const attentionItems = [
    {
      detail: "Ajoute une capture pour enrichir les cards publiques.",
      href: "/admin/projects/list",
      label: "Projets sans média",
      value: projectsWithoutMedia,
    },
    {
      detail: "Ajoute un dépôt pour faciliter la vérification technique.",
      href: "/admin/projects/list",
      label: "Projets sans GitHub",
      value: projectsWithoutRepository,
    },
    {
      detail:
        profileMissingItems.length > 0
          ? `À compléter : ${profileMissingItems.join(", ")}.`
          : "Les informations principales sont renseignées.",
      href: "/admin/profile",
      label: "Profil public",
      value: profileMissingItems.length,
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.main} aria-labelledby="admin-title">
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Portfolio technique</p>
            <h1 id="admin-title" className={styles.title}>
              Administration
            </h1>
            <p className={styles.description}>
              Connecté en tant que {session.user.pseudo}.
            </p>
          </div>

          <LogoutButton />
        </div>

        <section className={styles.statsGrid} aria-label="Indicateurs rapides">
          {quickStats.map((stat) => (
            <article className={styles.statCard} key={stat.label}>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statDetail}>{stat.detail}</p>
            </article>
          ))}
        </section>

        <div className={styles.dashboardGrid}>
          <section className={styles.panel} aria-labelledby="shortcuts-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Actions</p>
                <h2 id="shortcuts-title" className={styles.panelTitle}>
                  Raccourcis
                </h2>
              </div>
              <Link className={styles.panelGhostLink} href="/">
                Voir le site
              </Link>
            </div>
            <div className={styles.shortcutGrid}>
              {shortcuts.map((shortcut) => (
                <Link
                  className={styles.shortcutCard}
                  data-variant={shortcut.variant}
                  href={shortcut.href}
                  key={shortcut.href}
                >
                  <span>{shortcut.label}</span>
                  <small>{shortcut.description}</small>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="attention-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Qualité</p>
                <h2 id="attention-title" className={styles.panelTitle}>
                  À surveiller
                </h2>
              </div>
            </div>
            <div className={styles.attentionList}>
              {attentionItems.map((item) => (
                <Link
                  className={styles.attentionItem}
                  data-state={item.value > 0 ? "warning" : "clear"}
                  href={item.href}
                  key={item.label}
                >
                  <span className={styles.attentionCount}>{item.value}</span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="recent-projects">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Contenu</p>
                <h2 id="recent-projects" className={styles.panelTitle}>
                  Projets récents
                </h2>
              </div>
              <Link
                className={styles.panelGhostLink}
                href="/admin/projects/list"
              >
                Tout voir
              </Link>
            </div>
            {recentProjects.length > 0 ? (
              <div className={styles.recentList}>
                {recentProjects.map((project) => (
                  <Link
                    className={styles.recentItem}
                    href={`/admin/projects/${project.id}`}
                    key={project.id}
                  >
                    <span>
                      <strong>{project.title}</strong>
                      <small>
                        Mis à jour le {formatAdminDate(project.updatedAt)}
                      </small>
                    </span>
                    <span className={styles.badgeGroup}>
                      <span>{PROJECT_STATUS_LABELS[project.status]}</span>
                      <span>
                        {PROJECT_VISIBILITY_LABELS[project.visibility]}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>
                Aucun projet créé pour le moment.
              </p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="recent-activity">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelKicker}>Audit</p>
                <h2 id="recent-activity" className={styles.panelTitle}>
                  Activité récente
                </h2>
              </div>
              <Link className={styles.panelGhostLink} href="/admin/logs">
                Tous les logs
              </Link>
            </div>
            {recentAuditLogs.length > 0 ? (
              <div className={styles.activityList}>
                {recentAuditLogs.map((log) => (
                  <article className={styles.activityItem} key={log.id}>
                    <span
                      className={styles.activityStatus}
                      data-status={log.status}
                    >
                      {log.status}
                    </span>
                    <span>
                      <strong>{log.summary}</strong>
                      <small>
                        {log.action} · {formatAdminDate(log.createdAt)}
                      </small>
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>
                Aucun log d&apos;activité enregistré pour le moment.
              </p>
            )}
          </section>

          <section className={styles.panel} aria-labelledby="account-title">
            <h2 id="account-title" className={styles.panelTitle}>
              Compte administrateur
            </h2>
            <dl className={styles.sessionList}>
              <div className={styles.sessionItem}>
                <dt>Pseudo</dt>
                <dd>{session.user.pseudo}</dd>
              </div>
              <div className={styles.sessionItem}>
                <dt>E-mail</dt>
                <dd>{adminEmail}</dd>
              </div>
              <div className={styles.sessionItem}>
                <dt>Rôle</dt>
                <dd>{session.user.role}</dd>
              </div>
            </dl>
          </section>
        </div>
      </section>
    </main>
  );
}
