import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LogoutButton } from "./logout-button";
import styles from "./page.module.css";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const adminEmail = session.user.email ?? "Non renseigné";

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

        <div className={styles.panels}>
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Compte administrateur</h2>
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
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Espace administrateur</h2>
            <p className={styles.panelText}>
              Cette zone accueillera les prochains écrans de gestion du
              portfolio.
            </p>
            <Link className={styles.panelLink} href="/admin/profile">
              Gérer le profil public
            </Link>
            <Link className={styles.panelLink} href="/admin/profile/timeline">
              Gérer le parcours
            </Link>
            <Link className={styles.panelLink} href="/admin/projects">
              Créer un projet
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
