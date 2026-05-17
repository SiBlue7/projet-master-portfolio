import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import styles from "./page.module.css";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className={styles.page}>
      <section className={styles.main} aria-labelledby="admin-title">
        <p className={styles.eyebrow}>Portfolio technique</p>
        <h1 id="admin-title" className={styles.title}>
          Administration
        </h1>
        <p className={styles.description}>
          Connecté en tant que {session.user.pseudo}.
        </p>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Espace administrateur</h2>
          <p className={styles.panelText}>
            Cette zone accueillera les prochains écrans de gestion du portfolio.
          </p>
        </div>
      </section>
    </main>
  );
}
