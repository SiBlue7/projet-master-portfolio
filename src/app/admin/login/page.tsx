import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Connexion administrateur | Portfolio technique",
  description: "Page d'authentification réservée à l'administration.",
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
            Espace réservé à la gestion du portfolio technique, des projets et
            des données d&apos;exploitation.
          </p>
        </div>

        <aside className={styles.panel} aria-label="Accès administrateur">
          <h2 className={styles.panelTitle}>Accès réservé</h2>
          <p className={styles.panelText}>
            Identifiez-vous pour accéder à l&apos;administration du portfolio.
          </p>
          <LoginForm />
        </aside>
      </section>
    </main>
  );
}
