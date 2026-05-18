import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { dateToMonthValue } from "@/lib/profile-timeline";
import { prisma } from "@/lib/prisma";
import {
  TimelineManager,
  type TimelineItemViewModel,
} from "./timeline-manager";
import styles from "./page.module.css";

function mapTimelineItem(item: {
  id: string;
  type: TimelineItemViewModel["type"];
  title: string;
  organization: string;
  location: string | null;
  description: string | null;
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
  sortOrder: number;
}): TimelineItemViewModel {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    organization: item.organization,
    location: item.location ?? "",
    description: item.description ?? "",
    startMonth: dateToMonthValue(item.startDate),
    endMonth: dateToMonthValue(item.endDate),
    isCurrent: item.isCurrent,
    sortOrder: item.sortOrder,
  };
}

export default async function AdminProfileTimelinePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const timelineItems = await prisma.profileTimelineItem.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        startDate: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      type: true,
      title: true,
      organization: true,
      location: true,
      description: true,
      startDate: true,
      endDate: true,
      isCurrent: true,
      sortOrder: true,
    },
  });

  return (
    <main className={styles.page}>
      <section className={styles.main} aria-labelledby="timeline-title">
        <div className={styles.navLinks}>
          <Link className={styles.backLink} href="/admin">
            Retour au tableau de bord admin
          </Link>
          <Link className={styles.backLink} href="/admin/profile">
            Retour au profil public
          </Link>
        </div>

        <p className={styles.eyebrow}>Profil public</p>
        <h1 id="timeline-title" className={styles.title}>
          Parcours
        </h1>
        <p className={styles.description}>
          Gérez les formations, expériences et certifications qui composeront le
          parcours affiché sur le portfolio.
        </p>

        <TimelineManager items={timelineItems.map(mapTimelineItem)} />
      </section>
    </main>
  );
}
