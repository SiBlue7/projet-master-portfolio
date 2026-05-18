"use client";

import { useActionState } from "react";
import type {
  PublicProfileFormField,
  PublicProfileFormState,
  PublicProfileFormValues,
} from "@/lib/public-profile";
import { savePublicProfile } from "./actions";
import styles from "./page.module.css";

type ProfileFormValues = {
  [Field in PublicProfileFormField]: PublicProfileFormValues[Field] | "";
};

type ProfileFormProps = {
  profile: ProfileFormValues | null;
};

const initialState: PublicProfileFormState = {
  status: "idle",
};

function getFieldError(
  state: PublicProfileFormState,
  field: PublicProfileFormField,
) {
  return state.errors?.[field]?.[0];
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(
    savePublicProfile,
    initialState,
  );

  const displayNameError = getFieldError(state, "displayName");
  const headlineError = getFieldError(state, "headline");
  const bioError = getFieldError(state, "bio");
  const contactEmailError = getFieldError(state, "contactEmail");
  const githubUrlError = getFieldError(state, "githubUrl");
  const linkedinUrlError = getFieldError(state, "linkedinUrl");

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="displayName">
            Nom affiché
          </label>
          <input
            className={styles.input}
            id="displayName"
            name="displayName"
            type="text"
            autoComplete="name"
            defaultValue={profile?.displayName ?? ""}
            aria-invalid={Boolean(displayNameError)}
            aria-describedby={
              displayNameError ? "displayName-error" : undefined
            }
            disabled={isPending}
            required
          />
          {displayNameError ? (
            <p className={styles.fieldError} id="displayName-error">
              {displayNameError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="headline">
            Titre court
          </label>
          <input
            className={styles.input}
            id="headline"
            name="headline"
            type="text"
            defaultValue={profile?.headline ?? ""}
            placeholder="Étudiant M2 Cybersécurité"
            aria-invalid={Boolean(headlineError)}
            aria-describedby={headlineError ? "headline-error" : undefined}
            disabled={isPending}
            required
          />
          {headlineError ? (
            <p className={styles.fieldError} id="headline-error">
              {headlineError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="bio">
          Présentation
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id="bio"
          name="bio"
          defaultValue={profile?.bio ?? ""}
          rows={7}
          aria-invalid={Boolean(bioError)}
          aria-describedby={bioError ? "bio-error" : undefined}
          disabled={isPending}
          required
        />
        {bioError ? (
          <p className={styles.fieldError} id="bio-error">
            {bioError}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contactEmail">
            E-mail de contact
          </label>
          <input
            className={styles.input}
            id="contactEmail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            defaultValue={profile?.contactEmail ?? ""}
            aria-invalid={Boolean(contactEmailError)}
            aria-describedby={
              contactEmailError ? "contactEmail-error" : undefined
            }
            disabled={isPending}
            required
          />
          {contactEmailError ? (
            <p className={styles.fieldError} id="contactEmail-error">
              {contactEmailError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="githubUrl">
            Lien GitHub
          </label>
          <input
            className={styles.input}
            id="githubUrl"
            name="githubUrl"
            type="url"
            autoComplete="url"
            defaultValue={profile?.githubUrl ?? ""}
            placeholder="https://github.com/..."
            aria-invalid={Boolean(githubUrlError)}
            aria-describedby={githubUrlError ? "githubUrl-error" : undefined}
            disabled={isPending}
          />
          {githubUrlError ? (
            <p className={styles.fieldError} id="githubUrl-error">
              {githubUrlError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="linkedinUrl">
            Lien LinkedIn
          </label>
          <input
            className={styles.input}
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            autoComplete="url"
            defaultValue={profile?.linkedinUrl ?? ""}
            placeholder="https://www.linkedin.com/in/..."
            aria-invalid={Boolean(linkedinUrlError)}
            aria-describedby={
              linkedinUrlError ? "linkedinUrl-error" : undefined
            }
            disabled={isPending}
          />
          {linkedinUrlError ? (
            <p className={styles.fieldError} id="linkedinUrl-error">
              {linkedinUrlError}
            </p>
          ) : null}
        </div>
      </div>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? styles.successMessage
              : styles.errorMessage
          }
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Enregistrement..." : "Enregistrer le profil"}
        </button>
      </div>
    </form>
  );
}
