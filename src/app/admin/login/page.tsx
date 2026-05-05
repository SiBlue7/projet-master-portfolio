import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Connexion administrateur | Portfolio technique",
  description: "Page d'authentification reservee a l'administration.",
};

export default function AdminLoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-labelledby="admin-login-title">
        <div>
          <p className={styles.eyebrow}>Administration</p>
          <h1 id="admin-login-title" className={styles.title}>
            Connexion administrateur
          </h1>
          <p className={styles.description}>
            Espace reserve a la gestion du portfolio technique, des projets et
            des donnees d&apos;exploitation.
          </p>
        </div>

        <aside className={styles.panel} aria-label="Acces administrateur">
          <h2 className={styles.panelTitle}>Acces reserve</h2>
          <p className={styles.panelText}>
            Cette page accueillera le parcours de connexion de
            l&apos;administrateur.
          </p>
          <div className={styles.divider} />
          <div className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            <span>Interface prete pour le prochain ticket</span>
          </div>
        </aside>
      </section>
    </main>
  );
}
