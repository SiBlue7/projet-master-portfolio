import styles from "./page.module.css";

const foundations = [
  { label: "Application", value: "Next.js" },
  { label: "Langage", value: "TypeScript" },
  { label: "Données", value: "PostgreSQL + Prisma" },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.main} aria-labelledby="home-title">
        <p className={styles.eyebrow}>Initialisation projet master</p>
        <h1 id="home-title" className={styles.title}>
          Portfolio technique
        </h1>
        <p className={styles.description}>
          Socle applicatif prêt pour les prochains tickets : espace public,
          administration sécurisée, runbooks, synchronisation GitHub et
          observabilité.
        </p>

        <div className={styles.statusGrid} aria-label="Socle technique">
          {foundations.map((item) => (
            <div className={styles.statusItem} key={item.label}>
              <span className={styles.statusLabel}>{item.label}</span>
              <span className={styles.statusValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
