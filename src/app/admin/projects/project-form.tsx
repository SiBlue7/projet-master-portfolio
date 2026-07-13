"use client";

import { useActionState } from "react";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  PROJECT_TAGS,
  PROJECT_VISIBILITIES,
  PROJECT_VISIBILITY_LABELS,
  type ProjectFormField,
  type ProjectFormState,
  type ProjectStatus,
  type ProjectVisibility,
} from "@/lib/projects";
import {
  addProjectMedia,
  createProject,
  deleteProjectMedia,
  importProjectFromGithub,
  type ProjectMediaFormField,
  type ProjectMediaFormState,
} from "./actions";
import styles from "./page.module.css";

export type ProjectViewModel = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  stacks: string;
  stackList: {
    label: string;
    slug: string;
  }[];
  tagSlug: string;
  tagList: {
    label: string;
    slug: string;
  }[];
  status: ProjectStatus;
  visibility: ProjectVisibility;
  showDetails: boolean;
  showTechnologies: boolean;
  showExternalLinks: boolean;
  showMedia: boolean;
  showMetadata: boolean;
  repositoryUrl: string;
  demoUrl: string;
  startedAt: string;
  endedAt: string;
  githubPushedAt: string;
  githubVisibility: string;
  githubIsPrivate: boolean | null;
  githubReadme: string;
  media: {
    id: string;
    altText: string;
    fileName: string;
    sortOrder: number;
    src: string;
  }[];
};

const initialState: ProjectFormState = {
  status: "idle",
};

const initialMediaState: ProjectMediaFormState = {
  status: "idle",
};

const emptyProject: ProjectViewModel = {
  id: "new",
  title: "",
  slug: "",
  shortDescription: "",
  description: "",
  stacks: "",
  stackList: [],
  tagSlug: "",
  tagList: [],
  status: "DRAFT",
  visibility: "PRIVATE",
  showDetails: true,
  showTechnologies: true,
  showExternalLinks: true,
  showMedia: true,
  showMetadata: true,
  repositoryUrl: "",
  demoUrl: "",
  startedAt: "",
  endedAt: "",
  githubPushedAt: "",
  githubVisibility: "",
  githubIsPrivate: null,
  githubReadme: "",
  media: [],
};

function getFieldError(state: ProjectFormState, field: ProjectFormField) {
  return state.errors?.[field]?.[0];
}

function getMediaFieldError(
  state: ProjectMediaFormState,
  field: ProjectMediaFormField,
) {
  return state.errors?.[field]?.[0];
}

export function StateMessage({
  state,
}: {
  state: { status: "idle" | "success" | "error"; message?: string };
}) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={
        state.status === "success" ? styles.successMessage : styles.errorMessage
      }
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </p>
  );
}

export function ProjectFormFields({
  idPrefix,
  isPending,
  project,
  state,
}: {
  idPrefix: string;
  isPending: boolean;
  project: ProjectViewModel;
  state: ProjectFormState;
}) {
  const titleError = getFieldError(state, "title");
  const slugError = getFieldError(state, "slug");
  const shortDescriptionError = getFieldError(state, "shortDescription");
  const descriptionError = getFieldError(state, "description");
  const statusError = getFieldError(state, "status");
  const visibilityError = getFieldError(state, "visibility");
  const repositoryUrlError = getFieldError(state, "repositoryUrl");
  const demoUrlError = getFieldError(state, "demoUrl");
  const startedAtError = getFieldError(state, "startedAt");
  const endedAtError = getFieldError(state, "endedAt");
  const stacksError = getFieldError(state, "stacks");
  const tagsError = getFieldError(state, "tags");

  return (
    <>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-title`}>
            Titre
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-title`}
            name="title"
            type="text"
            defaultValue={project.title}
            placeholder="Portfolio master"
            aria-invalid={Boolean(titleError)}
            aria-describedby={
              titleError ? `${idPrefix}-title-error` : undefined
            }
            disabled={isPending}
            required
          />
          {titleError ? (
            <p className={styles.fieldError} id={`${idPrefix}-title-error`}>
              {titleError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-slug`}>
            Slug
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-slug`}
            name="slug"
            type="text"
            defaultValue={project.slug}
            placeholder="portfolio-master"
            aria-invalid={Boolean(slugError)}
            aria-describedby={
              slugError ? `${idPrefix}-slug-error` : `${idPrefix}-slug-help`
            }
            disabled={isPending}
            required
          />
          <p className={styles.helpText} id={`${idPrefix}-slug-help`}>
            Utilisé comme identifiant public du projet.
          </p>
          {slugError ? (
            <p className={styles.fieldError} id={`${idPrefix}-slug-error`}>
              {slugError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label
          className={styles.label}
          htmlFor={`${idPrefix}-shortDescription`}
        >
          Description courte
        </label>
        <input
          className={styles.input}
          id={`${idPrefix}-shortDescription`}
          name="shortDescription"
          type="text"
          defaultValue={project.shortDescription}
          placeholder="Application de portfolio administrable"
          aria-invalid={Boolean(shortDescriptionError)}
          aria-describedby={
            shortDescriptionError
              ? `${idPrefix}-shortDescription-error`
              : undefined
          }
          disabled={isPending}
          required
        />
        {shortDescriptionError ? (
          <p
            className={styles.fieldError}
            id={`${idPrefix}-shortDescription-error`}
          >
            {shortDescriptionError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-description`}>
          Description complète
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={project.description}
          rows={6}
          placeholder="Objectifs, périmètre fonctionnel, contexte technique et points clés du projet."
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={
            descriptionError ? `${idPrefix}-description-error` : undefined
          }
          disabled={isPending}
          required
        />
        {descriptionError ? (
          <p className={styles.fieldError} id={`${idPrefix}-description-error`}>
            {descriptionError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-tags`}>
          Tag de tri
        </label>
        <select
          className={styles.input}
          id={`${idPrefix}-tags`}
          name="tags"
          defaultValue={project.tagSlug}
          aria-invalid={Boolean(tagsError)}
          aria-describedby={
            tagsError ? `${idPrefix}-tags-error` : `${idPrefix}-tags-help`
          }
          disabled={isPending}
        >
          <option value="">Aucun tag de tri</option>
          {PROJECT_TAGS.map((tag) => (
            <option key={tag.slug} value={tag.slug}>
              {tag.label}
            </option>
          ))}
        </select>
        <p className={styles.helpText} id={`${idPrefix}-tags-help`}>
          Choisissez un tag de tri parmi la liste définie. Il servira au tri sur
          la page d&apos;accueil.
        </p>
        {tagsError ? (
          <p className={styles.fieldError} id={`${idPrefix}-tags-error`}>
            {tagsError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-stacks`}>
          Technologies utilisées
        </label>
        <input
          className={styles.input}
          id={`${idPrefix}-stacks`}
          name="stacks"
          type="text"
          defaultValue={project.stacks}
          placeholder="Next.js, Prisma, Docker"
          aria-invalid={Boolean(stacksError)}
          aria-describedby={
            stacksError ? `${idPrefix}-stacks-error` : `${idPrefix}-stacks-help`
          }
          disabled={isPending}
        />
        <p className={styles.helpText} id={`${idPrefix}-stacks-help`}>
          Séparez les technologies par des virgules. Elles seront affichées sur
          le portfolio public.
        </p>
        {stacksError ? (
          <p className={styles.fieldError} id={`${idPrefix}-stacks-error`}>
            {stacksError}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-status`}>
            Statut
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-status`}
            name="status"
            defaultValue={project.status}
            aria-invalid={Boolean(statusError)}
            aria-describedby={
              statusError ? `${idPrefix}-status-error` : undefined
            }
            disabled={isPending}
            required
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROJECT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {statusError ? (
            <p className={styles.fieldError} id={`${idPrefix}-status-error`}>
              {statusError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-visibility`}>
            Visibilité
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-visibility`}
            name="visibility"
            defaultValue={project.visibility}
            aria-invalid={Boolean(visibilityError)}
            aria-describedby={
              visibilityError ? `${idPrefix}-visibility-error` : undefined
            }
            disabled={isPending}
            required
          >
            {PROJECT_VISIBILITIES.map((visibility) => (
              <option key={visibility} value={visibility}>
                {PROJECT_VISIBILITY_LABELS[visibility]}
              </option>
            ))}
          </select>
          {visibilityError ? (
            <p
              className={styles.fieldError}
              id={`${idPrefix}-visibility-error`}
            >
              {visibilityError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-repositoryUrl`}>
            Lien GitHub
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-repositoryUrl`}
            name="repositoryUrl"
            type="url"
            defaultValue={project.repositoryUrl}
            placeholder="https://github.com/SiBlue7/projet-master-portfolio"
            aria-invalid={Boolean(repositoryUrlError)}
            aria-describedby={
              repositoryUrlError ? `${idPrefix}-repositoryUrl-error` : undefined
            }
            disabled={isPending}
          />
          {repositoryUrlError ? (
            <p
              className={styles.fieldError}
              id={`${idPrefix}-repositoryUrl-error`}
            >
              {repositoryUrlError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-demoUrl`}>
            Lien démo
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-demoUrl`}
            name="demoUrl"
            type="url"
            defaultValue={project.demoUrl}
            placeholder="https://portfolio.justdoeat.org"
            aria-invalid={Boolean(demoUrlError)}
            aria-describedby={
              demoUrlError ? `${idPrefix}-demoUrl-error` : undefined
            }
            disabled={isPending}
          />
          {demoUrlError ? (
            <p className={styles.fieldError} id={`${idPrefix}-demoUrl-error`}>
              {demoUrlError}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset className={styles.checkboxGroup}>
        <legend className={styles.label}>Sections publiques visibles</legend>
        <p className={styles.helpText}>
          La visibilité globale du projet reste prioritaire. Ces options
          masquent uniquement certaines sections quand le projet est public.
        </p>

        <div className={styles.checkboxGrid}>
          <label
            className={styles.checkboxField}
            htmlFor={`${idPrefix}-showDetails`}
          >
            <input type="hidden" name="showDetails" value="off" />
            <input
              id={`${idPrefix}-showDetails`}
              name="showDetails"
              type="checkbox"
              value="on"
              defaultChecked={project.showDetails}
              disabled={isPending}
            />
            Présentation détaillée
          </label>

          <label
            className={styles.checkboxField}
            htmlFor={`${idPrefix}-showTechnologies`}
          >
            <input type="hidden" name="showTechnologies" value="off" />
            <input
              id={`${idPrefix}-showTechnologies`}
              name="showTechnologies"
              type="checkbox"
              value="on"
              defaultChecked={project.showTechnologies}
              disabled={isPending}
            />
            Technologies
          </label>

          <label
            className={styles.checkboxField}
            htmlFor={`${idPrefix}-showExternalLinks`}
          >
            <input type="hidden" name="showExternalLinks" value="off" />
            <input
              id={`${idPrefix}-showExternalLinks`}
              name="showExternalLinks"
              type="checkbox"
              value="on"
              defaultChecked={project.showExternalLinks}
              disabled={isPending}
            />
            Liens GitHub et démo
          </label>

          <label
            className={styles.checkboxField}
            htmlFor={`${idPrefix}-showMedia`}
          >
            <input type="hidden" name="showMedia" value="off" />
            <input
              id={`${idPrefix}-showMedia`}
              name="showMedia"
              type="checkbox"
              value="on"
              defaultChecked={project.showMedia}
              disabled={isPending}
            />
            Captures et carrousel
          </label>

          <label
            className={styles.checkboxField}
            htmlFor={`${idPrefix}-showMetadata`}
          >
            <input type="hidden" name="showMetadata" value="off" />
            <input
              id={`${idPrefix}-showMetadata`}
              name="showMetadata"
              type="checkbox"
              value="on"
              defaultChecked={project.showMetadata}
              disabled={isPending}
            />
            Statut, période et identifiant
          </label>
        </div>
      </fieldset>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-startedAt`}>
            Date de début
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-startedAt`}
            name="startedAt"
            type="date"
            defaultValue={project.startedAt}
            aria-invalid={Boolean(startedAtError)}
            aria-describedby={
              startedAtError ? `${idPrefix}-startedAt-error` : undefined
            }
            disabled={isPending}
          />
          {startedAtError ? (
            <p className={styles.fieldError} id={`${idPrefix}-startedAt-error`}>
              {startedAtError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-endedAt`}>
            Date de fin
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-endedAt`}
            name="endedAt"
            type="date"
            defaultValue={project.endedAt}
            aria-invalid={Boolean(endedAtError)}
            aria-describedby={
              endedAtError ? `${idPrefix}-endedAt-error` : undefined
            }
            disabled={isPending}
          />
          {endedAtError ? (
            <p className={styles.fieldError} id={`${idPrefix}-endedAt-error`}>
              {endedAtError}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function CreateProjectForm() {
  const [state, formAction, isPending] = useActionState(
    createProject,
    initialState,
  );

  return (
    <form className={styles.form} action={formAction}>
      <ProjectFormFields
        idPrefix="new-project"
        isPending={isPending}
        project={emptyProject}
        state={state}
      />
      <StateMessage state={state} />
      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Création..." : "Créer le projet"}
        </button>
      </div>
    </form>
  );
}

export function GithubImportProjectForm() {
  const [state, formAction, isPending] = useActionState(
    importProjectFromGithub,
    initialState,
  );
  const repositoryUrlError = getFieldError(state, "repositoryUrl");

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="github-import-url">
          URL GitHub du dépôt
        </label>
        <input
          className={styles.input}
          id="github-import-url"
          name="githubUrl"
          type="url"
          placeholder="https://github.com/SiBlue7/projet-master-portfolio"
          aria-invalid={Boolean(repositoryUrlError)}
          aria-describedby={
            repositoryUrlError
              ? "github-import-url-error"
              : "github-import-url-help"
          }
          disabled={isPending}
          required
        />
        <p className={styles.helpText} id="github-import-url-help">
          Le projet importé sera créé en brouillon privé, avec le lien GitHub et
          les technologies détectées.
        </p>
        {repositoryUrlError ? (
          <p className={styles.fieldError} id="github-import-url-error">
            {repositoryUrlError}
          </p>
        ) : null}
      </div>

      <StateMessage state={state} />

      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Import..." : "Importer depuis GitHub"}
        </button>
      </div>
    </form>
  );
}

function DeleteProjectMediaForm({ mediaId }: { mediaId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteProjectMedia.bind(null, mediaId),
    initialMediaState,
  );

  return (
    <form action={formAction}>
      <button
        className={styles.mediaDeleteButton}
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Suppression..." : "Supprimer"}
      </button>
      <StateMessage state={state} />
    </form>
  );
}

export function ProjectMediaManager({
  project,
}: {
  project: ProjectViewModel;
}) {
  const [state, formAction, isPending] = useActionState(
    addProjectMedia.bind(null, project.id),
    initialMediaState,
  );
  const imageError = getMediaFieldError(state, "image");
  const altTextError = getMediaFieldError(state, "altText");
  const sortOrderError = getMediaFieldError(state, "sortOrder");

  return (
    <section
      className={styles.mediaSection}
      aria-labelledby={`media-${project.id}`}
    >
      <div className={styles.mediaHeader}>
        <div>
          <h3 id={`media-${project.id}`} className={styles.mediaTitle}>
            03 — captures
          </h3>
          <p className={styles.mediaDescription}>
            Ajoutez des screenshots ou photos qui seront affichés sur le
            portfolio public.
          </p>
        </div>
        <span className={styles.mediaCount}>
          {project.media.length} capture{project.media.length > 1 ? "s" : ""}
        </span>
      </div>

      <form className={styles.mediaForm} action={formAction}>
        <div className={styles.mediaFieldGrid}>
          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor={`project-${project.id}-image`}
            >
              Image
            </label>
            <input
              className={styles.input}
              id={`project-${project.id}-image`}
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              aria-invalid={Boolean(imageError)}
              aria-describedby={
                imageError
                  ? `project-${project.id}-image-error`
                  : `project-${project.id}-image-help`
              }
              disabled={isPending}
              required
            />
            <p
              className={styles.helpText}
              id={`project-${project.id}-image-help`}
            >
              PNG, JPG, WebP ou GIF. Taille maximale : 5 Mo.
            </p>
            {imageError ? (
              <p
                className={styles.fieldError}
                id={`project-${project.id}-image-error`}
              >
                {imageError}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor={`project-${project.id}-altText`}
            >
              Texte alternatif
            </label>
            <input
              className={styles.input}
              id={`project-${project.id}-altText`}
              name="altText"
              type="text"
              placeholder="Capture de la page d'accueil"
              aria-invalid={Boolean(altTextError)}
              aria-describedby={
                altTextError ? `project-${project.id}-altText-error` : undefined
              }
              disabled={isPending}
            />
            {altTextError ? (
              <p
                className={styles.fieldError}
                id={`project-${project.id}-altText-error`}
              >
                {altTextError}
              </p>
            ) : null}
          </div>

          <div className={styles.field}>
            <label
              className={styles.label}
              htmlFor={`project-${project.id}-sortOrder`}
            >
              Ordre
            </label>
            <input
              className={styles.input}
              id={`project-${project.id}-sortOrder`}
              name="sortOrder"
              type="number"
              min="0"
              max="999"
              defaultValue="0"
              aria-invalid={Boolean(sortOrderError)}
              aria-describedby={
                sortOrderError
                  ? `project-${project.id}-sortOrder-error`
                  : undefined
              }
              disabled={isPending}
            />
            {sortOrderError ? (
              <p
                className={styles.fieldError}
                id={`project-${project.id}-sortOrder-error`}
              >
                {sortOrderError}
              </p>
            ) : null}
          </div>
        </div>

        <StateMessage state={state} />
        <div className={styles.actions}>
          <button
            className={styles.submitButton}
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Import..." : "Ajouter la capture"}
          </button>
        </div>
      </form>

      {project.media.length > 0 ? (
        <div className={styles.mediaGrid}>
          {project.media.map((media) => (
            <article className={styles.mediaItem} key={media.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.mediaPreview}
                src={media.src}
                alt={media.altText || `Capture du projet ${project.title}`}
              />
              <div className={styles.mediaMeta}>
                <span className={styles.mediaFileName}>{media.fileName}</span>
                <span className={styles.mediaOrder}>
                  Ordre #{media.sortOrder}
                </span>
              </div>
              <DeleteProjectMediaForm mediaId={media.id} />
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>
          Aucune capture ajoutée pour ce projet.
        </p>
      )}
    </section>
  );
}
