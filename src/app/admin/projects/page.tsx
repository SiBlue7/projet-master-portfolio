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
          Retour au tableau de bord admin
        </Link>

        <p className={styles.eyebrow}>Projets</p>
        <h1 id="projects-title" className={styles.title}>
          Gestion des projets
        </h1>
        <p className={styles.description}>
          Importez un dépôt GitHub ou créez manuellement un projet, puis
          retrouvez-le dans la liste pour le modifier depuis sa page détail
          admin.
        </p>

        <div className={styles.pageActions}>
          <Link className={styles.secondaryLink} href="/admin/projects/list">
            Voir les projets existants
          </Link>
        </div>

        <div className={styles.manager}>
          <section
            className={styles.panel}
            aria-labelledby="github-import-title"
          >
            <h2 id="github-import-title" className={styles.panelTitle}>
              Importer depuis GitHub
            </h2>
            <GithubImportProjectForm />
          </section>

          <section className={styles.panel} aria-labelledby="create-title">
            <h2 id="create-title" className={styles.panelTitle}>
              Créer un projet
            </h2>
            <CreateProjectForm />
          </section>
        </div>
      </section>
    </main>
  );
}
