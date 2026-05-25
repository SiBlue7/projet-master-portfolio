import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";
import { LogoutButton } from "./logout-button";
import styles from "./admin-navigation.module.css";

type AdminNavigationItem =
  | "dashboard"
  | "logs"
  | "profile"
  | "project-create"
  | "project-list"
  | "site"
  | "timeline";

type AdminNavigationProps = {
  activeItem: AdminNavigationItem;
};

const links: { href: string; id: AdminNavigationItem; label: string }[] = [
  {
    href: "/admin/projects",
    id: "project-create",
    label: "Nouveau projet",
  },
  {
    href: "/admin/projects/list",
    id: "project-list",
    label: "Tous les projets",
  },
  {
    href: "/admin/profile",
    id: "profile",
    label: "Profil",
  },
  {
    href: "/admin/profile/timeline",
    id: "timeline",
    label: "Parcours",
  },
  {
    href: "/admin/logs",
    id: "logs",
    label: "Logs",
  },
  {
    href: "/",
    id: "site",
    label: "Site public",
  },
];

export function AdminNavigation({ activeItem }: AdminNavigationProps) {
  return (
    <nav className={styles.adminNavigation} aria-label="Navigation admin">
      <Link
        aria-current={activeItem === "dashboard" ? "page" : undefined}
        className={styles.brand}
        href="/admin"
      >
        Dashboard admin
      </Link>

      <div className={styles.navLinks}>
        {links.map((link) => (
          <Link
            aria-current={activeItem === link.id ? "page" : undefined}
            className={styles.navLink}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className={styles.controls}>
        <ThemeToggle
          buttonClassName={styles.themeToggleButton}
          className={styles.themeToggle}
        />
        <LogoutButton className={styles.logoutButton} />
      </div>
    </nav>
  );
}
