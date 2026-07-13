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

const commands: Record<AdminNavigationItem, string> = {
  dashboard: "cd /admin",
  logs: "tail -f audit.log",
  profile: "whoami --edit",
  "project-create": "touch projet",
  "project-list": "ls projets/",
  site: "cd /",
  timeline: "cat timeline.log",
};

const links: { href: string; id: AdminNavigationItem; label: string }[] = [
  {
    href: "/admin",
    id: "dashboard",
    label: "./dashboard",
  },
  {
    href: "/admin/projects",
    id: "project-create",
    label: "./nouveau",
  },
  {
    href: "/admin/projects/list",
    id: "project-list",
    label: "./projets",
  },
  {
    href: "/admin/profile",
    id: "profile",
    label: "./profil",
  },
  {
    href: "/admin/profile/timeline",
    id: "timeline",
    label: "./parcours",
  },
  {
    href: "/admin/logs",
    id: "logs",
    label: "./logs",
  },
];

export function AdminNavigation({ activeItem }: AdminNavigationProps) {
  return (
    <nav className={styles.adminNavigation} aria-label="Navigation admin">
      <Link className={styles.brand} href="/admin">
        enzo<span className={styles.brandHost}>@portfolio:~$</span>{" "}
        <span className={styles.brandCommand}>{commands[activeItem]}</span>
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
        <Link className={styles.sitePill} href="/">
          site ↗
        </Link>
        <ThemeToggle
          buttonClassName={styles.themeToggleButton}
          className={styles.themeToggle}
        />
        <LogoutButton className={styles.logoutButton} />
      </div>
    </nav>
  );
}
