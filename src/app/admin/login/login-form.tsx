"use client";

import { useState } from "react";
import styles from "./page.module.css";

function EyeIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.toggleIcon}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M2.25 12s3.5-6.25 9.75-6.25S21.75 12 21.75 12 18.25 18.25 12 18.25 2.25 12 2.25 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      aria-hidden="true"
      className={styles.toggleIcon}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.55 5.9c.47-.1.96-.15 1.45-.15 6.25 0 9.75 6.25 9.75 6.25a18.2 18.2 0 0 1-2.82 3.55M6.16 7.48A18.6 18.6 0 0 0 2.25 12S5.75 18.25 12 18.25c1.36 0 2.59-.3 3.68-.78"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10.15 10.15a2.75 2.75 0 0 0 3.7 3.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const passwordToggleLabel = isPasswordVisible
    ? "Masquer le mot de passe"
    : "Afficher le mot de passe";

  return (
    <form
      className={styles.form}
      aria-label="Connexion administrateur"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="admin-pseudo">
          Pseudo
        </label>
        <input
          className={styles.input}
          id="admin-pseudo"
          name="pseudo"
          type="text"
          autoComplete="username"
          placeholder="enzo"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="admin-email">
          Adresse e-mail
        </label>
        <input
          className={styles.input}
          id="admin-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="admin-password">
          Mot de passe
        </label>
        <div className={styles.passwordControl}>
          <input
            className={`${styles.input} ${styles.passwordInput}`}
            id="admin-password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Votre mot de passe"
          />
          <button
            className={styles.togglePassword}
            type="button"
            aria-label={passwordToggleLabel}
            aria-controls="admin-password"
            aria-pressed={isPasswordVisible}
            title={passwordToggleLabel}
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <button className={styles.submitButton} type="submit">
        Se connecter
      </button>
    </form>
  );
}
