"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { adminLoginRateLimitErrorCode } from "@/lib/auth-security";
import styles from "./page.module.css";

const adminRedirectPath = "/admin";

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
  const router = useRouter();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordToggleLabel = isPasswordVisible
    ? "Masquer le mot de passe"
    : "Afficher le mot de passe";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!identifier || !password) {
      setErrorMessage(
        "Renseignez votre pseudo ou e-mail et votre mot de passe.",
      );
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
      callbackUrl: adminRedirectPath,
    });

    setIsSubmitting(false);

    if (result?.error === adminLoginRateLimitErrorCode) {
      setErrorMessage(
        "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
      );
      return;
    }

    if (!result || result.error) {
      setErrorMessage("Identifiants invalides.");
      return;
    }

    router.push(adminRedirectPath);
    router.refresh();
  }

  return (
    <form
      className={styles.form}
      aria-label="Connexion administrateur"
      onSubmit={handleSubmit}
    >
      <div className={styles.field}>
        <label className={styles.label} htmlFor="admin-identifier">
          Pseudo ou adresse e-mail
        </label>
        <input
          className={styles.input}
          id="admin-identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder="admin ou admin@example.com"
          disabled={isSubmitting}
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
            required
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            disabled={isSubmitting}
          />
          <button
            className={styles.togglePassword}
            type="button"
            aria-label={passwordToggleLabel}
            aria-controls="admin-password"
            aria-pressed={isPasswordVisible}
            title={passwordToggleLabel}
            disabled={isSubmitting}
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button
        className={styles.submitButton}
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Connexion en cours..." : "Se connecter"}
      </button>
    </form>
  );
}
