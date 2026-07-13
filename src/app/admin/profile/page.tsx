import { Buffer } from "node:buffer";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AdminNavigation } from "@/app/admin/admin-navigation";
import { authOptions } from "@/lib/auth";
import { PUBLIC_PROFILE_ID } from "@/lib/public-profile";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";
import styles from "./page.module.css";

function createAvatarPreviewUrl(
  avatarData: Uint8Array | null,
  avatarMimeType: string | null,
) {
  if (!avatarData || !avatarMimeType) {
    return null;
  }

  return `data:${avatarMimeType};base64,${Buffer.from(avatarData).toString(
    "base64",
  )}`;
}

export default async function AdminProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/admin/login");
  }

  const profile = await prisma.publicProfile.findUnique({
    where: {
      id: PUBLIC_PROFILE_ID,
    },
    select: {
      displayName: true,
      headline: true,
      bio: true,
      contactEmail: true,
      githubUrl: true,
      linkedinUrl: true,
      avatarData: true,
      avatarMimeType: true,
    },
  });
  const avatarPreviewUrl = profile
    ? createAvatarPreviewUrl(profile.avatarData, profile.avatarMimeType)
    : null;

  return (
    <main className={styles.page}>
      <AdminNavigation activeItem="profile" />

      <section className={styles.main} aria-labelledby="profile-title">
        <Link className={styles.backLink} href="/admin">
          ← retour au dashboard
        </Link>

        <p className={styles.eyebrow}>~/admin/profile — whoami --edit</p>
        <h1 id="profile-title" className={styles.title}>
          Profil public<span className={styles.titleDot}>.</span>
        </h1>
        <p className={styles.description}>
          Ces informations serviront à alimenter la partie publique du
          portfolio.
        </p>

        <div className={styles.panel}>
          <ProfileForm avatarPreviewUrl={avatarPreviewUrl} profile={profile} />
        </div>
      </section>
    </main>
  );
}
