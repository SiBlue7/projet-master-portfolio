import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNavigation } from "@/app/admin/admin-navigation";
import { CreateProjectForm, GithubImportProjectForm } from "./project-form";
import styles from "./page.module.css";

export default async function AdminProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className={styles.page}>
      <AdminNavigation activeItem="project-create" />

      <section className={styles.main} aria-labelledby="projects-title">
        <Link className={styles.backLink} href="/admin">
          ← retour au dashboard
        </Link>

        <p className={styles.eyebrow}>~/admin/projects — nouveau projet</p>
        <h1 id="projects-title" className={styles.title}>
          Nouveau projet<span className={styles.titleDot}>.</span>
        </h1>
        <p className={styles.description}>
          Importez un dépôt GitHub ou créez manuellement un projet, puis
          retrouvez-le dans la liste pour le modifier depuis sa page détail
          admin.
        </p>

        <div className={styles.pageActions}>
          <Link className={styles.secondaryLink} href="/admin/projects/list">
            voir les projets →
          </Link>
        </div>

        <div className={styles.manager}>
          <section
            className={styles.panel}
            aria-labelledby="github-import-title"
          >
            <h2 id="github-import-title" className={styles.panelTitle}>
              01 — import github
            </h2>
            <GithubImportProjectForm />
          </section>

          <section className={styles.panel} aria-labelledby="create-title">
            <h2 id="create-title" className={styles.panelTitle}>
              02 — création manuelle
            </h2>
            <CreateProjectForm />
          </section>
        </div>
      </section>
    </main>
  );
}
