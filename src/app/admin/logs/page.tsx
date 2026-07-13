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
        <div className={styles.header}>
          <div>
            <Link className={styles.backLink} href="/admin">
              ← retour au dashboard
            </Link>

            <p className={styles.eyebrow}>~/admin/logs — tail -f audit.log</p>
            <h1 id="admin-logs-title" className={styles.title}>
              Logs d&apos;activité<span className={styles.titleDot}>.</span>
            </h1>
            <p className={styles.description}>
              Suivez les dernières actions réalisées dans l&apos;administration
              du portfolio.
            </p>
          </div>

          <dl className={styles.summaryPills} aria-label="Synthèse des logs">
            <div className={styles.summaryPill}>
              <dt>total</dt>
              <dd>{logs.length}</dd>
            </div>
            <div className={styles.summaryPill} data-tone="success">
              <dt>succès</dt>
              <dd>{successCount}</dd>
            </div>
            <div className={styles.summaryPill} data-tone="danger">
              <dt>échecs</dt>
              <dd>{failureCount}</dd>
            </div>
          </dl>
        </div>

        <section className={styles.panel} aria-labelledby="recent-logs-title">
          <h2 id="recent-logs-title" className={styles.panelTitle}>
            01 — activité récente / audit trail
          </h2>

          {logs.length > 0 ? (
            <div className={styles.logTable}>
              <div className={styles.logHeadRow} aria-hidden="true">
                <span>date</span>
                <span>statut</span>
                <span>événement</span>
                <span>entité</span>
                <span>acteur</span>
              </div>
              {logs.map((log) => (
                <article className={styles.logRow} key={log.id}>
                  <span className={styles.logDate}>
                    {formatLogDate(log.createdAt)}
                  </span>
                  <span className={styles.logStatus} data-status={log.status}>
                    {statusLabels[log.status]}
                  </span>
                  <span className={styles.logSummary}>
                    {log.summary}{" "}
                    <span className={styles.actionBadge}>
                      {actionLabels[log.action]}
                    </span>
                  </span>
                  <span className={styles.logEntity}>
                    {getEntityLabel(log.entityType)}
                    {log.entityId ? ` · ${log.entityId}` : ""}
                  </span>
                  <span className={styles.logActor}>{getActorLabel(log)}</span>
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
