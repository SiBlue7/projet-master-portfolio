import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { CreateProjectForm } from "./project-form";
import styles from "./page.module.css";

export default async function AdminProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className={styles.page}>
      <section className={styles.main} aria-labelledby="projects-title">
        <Link className={styles.backLink} href="/admin">
          Retour au tableau de bord admin
        </Link>

        <p className={styles.eyebrow}>Projets</p>
        <h1 id="projects-title" className={styles.title}>
          Gestion des projets
        </h1>
        <p className={styles.description}>
          Créez manuellement un projet, puis retrouvez-le dans la liste pour le
          modifier depuis sa page détail admin.
        </p>

        <div className={styles.pageActions}>
          <Link className={styles.secondaryLink} href="/admin/projects/list">
            Voir les projets existants
          </Link>
        </div>

        <div className={styles.manager}>
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
