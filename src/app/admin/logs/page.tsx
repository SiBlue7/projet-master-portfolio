import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { AuditLogAction, AuditLogStatus } from "@/generated/prisma/client";
import { AdminNavigation } from "@/app/admin/admin-navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

const actionLabels: Record<AuditLogAction, string> = {
  CREATE: "Création",
  DELETE: "Suppression",
  EXECUTE: "Exécution",
  LOGIN_FAILURE: "Connexion échouée",
  LOGIN_SUCCESS: "Connexion réussie",
  UPDATE: "Modification",
  UPLOAD: "Import",
};

const statusLabels: Record<AuditLogStatus, string> = {
  FAILURE: "Échec",
  SUCCESS: "Succès",
};

const entityLabels: Record<string, string> = {
  auth: "Authentification",
  profile_timeline_item: "Parcours",
  project: "Projet",
  project_media: "Capture projet",
  public_profile: "Profil public",
  runbook: "Runbook",
  runbook_environment: "Environnement",
  runbook_step: "Étape",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

function formatLogDate(date: Date) {
  return dateFormatter.format(date);
}

function getEntityLabel(entityType: string) {
  return entityLabels[entityType] ?? entityType;
}

function getActorLabel(log: {
  actorEmail: string | null;
  actorPseudo: string | null;
}) {
  return log.actorPseudo ?? log.actorEmail ?? "Système";
}

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      action: true,
      actorEmail: true,
      actorPseudo: true,
      createdAt: true,
      entityId: true,
      entityType: true,
      id: true,
      status: true,
      summary: true,
    },
    take: 100,
  });

  const successCount = logs.filter((log) => log.status === "SUCCESS").length;
  const failureCount = logs.filter((log) => log.status === "FAILURE").length;

  return (
    <main className={styles.page}>
      <AdminNavigation activeItem="logs" />

      <section className={styles.main} aria-labelledby="admin-logs-title">
        <Link className={styles.backLink} href="/admin">
          Retour à l&apos;administration
        </Link>

        <p className={styles.eyebrow}>Traçabilité</p>
        <h1 id="admin-logs-title" className={styles.title}>
          Logs d&apos;activité
        </h1>
        <p className={styles.description}>
          Suivez les dernières actions réalisées dans l&apos;administration du
          portfolio.
        </p>

        <dl className={styles.statsGrid} aria-label="Synthèse des logs">
          <div className={styles.statCard}>
            <dt>Total</dt>
            <dd>{logs.length}</dd>
          </div>
          <div className={styles.statCard}>
            <dt>Succès</dt>
            <dd>{successCount}</dd>
          </div>
          <div className={styles.statCard}>
            <dt>Échecs</dt>
            <dd>{failureCount}</dd>
          </div>
        </dl>

        <section className={styles.panel} aria-labelledby="recent-logs-title">
          <div className={styles.panelHeader}>
            <div>
              <h2 id="recent-logs-title" className={styles.panelTitle}>
                Activité récente
              </h2>
              <p className={styles.panelDescription}>
                Les 100 derniers événements enregistrés sont affichés ici.
              </p>
            </div>
          </div>

          {logs.length > 0 ? (
            <div className={styles.logList}>
              {logs.map((log) => (
                <article className={styles.logItem} key={log.id}>
                  <div className={styles.logMain}>
                    <div className={styles.logBadges}>
                      <span className={styles.actionBadge}>
                        {actionLabels[log.action]}
                      </span>
                      <span
                        className={
                          log.status === "SUCCESS"
                            ? styles.successBadge
                            : styles.failureBadge
                        }
                      >
                        {statusLabels[log.status]}
                      </span>
                    </div>
                    <h3 className={styles.logSummary}>{log.summary}</h3>
                    <p className={styles.logMeta}>
                      {getEntityLabel(log.entityType)}
                      {log.entityId ? ` · ${log.entityId}` : ""}
                    </p>
                  </div>

                  <div className={styles.logAside}>
                    <span>{formatLogDate(log.createdAt)}</span>
                    <span>{getActorLabel(log)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>
              Aucun log d&apos;activité enregistré pour le moment.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
