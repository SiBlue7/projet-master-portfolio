import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProjectManager, type ProjectViewModel } from "./project-form";
import styles from "./page.module.css";

function dateToDateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

export default async function AdminProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const projects = await prisma.project.findMany({
    orderBy: [
      {
        startedAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      slug: true,
      shortDescription: true,
      description: true,
      status: true,
      visibility: true,
      repositoryUrl: true,
      demoUrl: true,
      startedAt: true,
      endedAt: true,
    },
  });

  const projectViewModels: ProjectViewModel[] = projects.map((project) => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    description: project.description,
    status: project.status,
    visibility: project.visibility,
    repositoryUrl: project.repositoryUrl ?? "",
    demoUrl: project.demoUrl ?? "",
    startedAt: dateToDateInputValue(project.startedAt),
    endedAt: dateToDateInputValue(project.endedAt),
  }));

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
          Créez manuellement les projets qui seront ensuite affichés sur le
          portfolio public.
        </p>

        <ProjectManager projects={projectViewModels} />
      </section>
    </main>
  );
}
