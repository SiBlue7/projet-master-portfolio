"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { adminLoginRateLimitErrorCode } from "@/lib/auth-security";
import styles from "./page.module.css";

const adminRedirectPath = "/admin";

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
            {isPasswordVisible ? "[cacher]" : "[voir]"}
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
        {isSubmitting ? "Connexion en cours..." : "Se connecter →"}
      </button>

      <p className={styles.formNote}>{"// rate limit actif"}</p>
    </form>
  );
}
