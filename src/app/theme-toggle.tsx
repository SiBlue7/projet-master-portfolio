"use client";

import { useSyncExternalStore } from "react";
import styles from "./page.module.css";

type ThemeName = "light" | "dark";

type ThemeToggleProps = {
  buttonClassName?: string;
  className?: string;
};

const themes: { label: string; value: ThemeName }[] = [
  {
    label: "Clair",
    value: "light",
  },
  {
    label: "Sombre",
    value: "dark",
  },
];

function applyTheme(theme: ThemeName) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem("portfolio-theme", theme);
  window.dispatchEvent(new Event("portfolio-theme-change"));
}

function getThemeSnapshot(): ThemeName {
  const theme = document.documentElement.dataset.theme;

  return theme === "dark" || theme === "light" ? theme : "light";
}

function getServerThemeSnapshot(): ThemeName {
  return "light";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener("portfolio-theme-change", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("portfolio-theme-change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function ThemeToggle({ buttonClassName, className }: ThemeToggleProps) {
  const selectedTheme = useSyncExternalStore(
    subscribeToThemeChange,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  return (
    <div
      className={className ?? styles.themeToggle}
      aria-label="Choisir le theme"
      role="group"
    >
      {themes.map((theme) => (
        <button
          aria-pressed={selectedTheme === theme.value}
          className={buttonClassName ?? styles.themeToggleButton}
          data-selected={selectedTheme === theme.value}
          key={theme.value}
          onClick={() => {
            applyTheme(theme.value);
          }}
          type="button"
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}
