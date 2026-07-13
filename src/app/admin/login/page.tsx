import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/app/theme-toggle";
import { LoginForm } from "./login-form";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Connexion administrateur | Portfolio technique",
  description: "Page d'authentification réservée à l'administration.",
};

export default function AdminLoginPage() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Navigation">
        <span className={styles.brand}>
          enzo<span className={styles.brandHost}>@portfolio:~$</span>{" "}
          <span className={styles.brandCommand}>sudo login</span>
        </span>
        <div className={styles.navControls}>
          <Link className={styles.navPill} href="/">
            ← site public
          </Link>
          <ThemeToggle
            buttonClassName={styles.themeToggleButton}
            className={styles.themeToggle}
          />
        </div>
      </nav>

      <section className={styles.shell} aria-labelledby="admin-login-title">
        <p className={styles.sectionLabel}>00 — authentification / login</p>
        <h1 id="admin-login-title" className={styles.title}>
          Espace
          <br />
          <span className={styles.titleAccent}>administrateur.</span>
        </h1>
        <p className={styles.description}>
          Espace réservé à la gestion du portfolio technique, des projets et
          des données d&apos;exploitation.
        </p>

        <div className={styles.panel}>
          <LoginForm />
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 — Enzo Chevalier · M2 Cyber</span>
        <span>next.js · typescript · prisma · docker</span>
      </footer>
    </main>
  );
}
