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
import { createProject, deleteProject, updateProject } from "./actions";
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
  repositoryUrl: string;
  demoUrl: string;
  startedAt: string;
  endedAt: string;
};

type ProjectManagerProps = {
  projects: ProjectViewModel[];
};

const initialState: ProjectFormState = {
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
  repositoryUrl: "",
  demoUrl: "",
  startedAt: "",
  endedAt: "",
};

function getFieldError(state: ProjectFormState, field: ProjectFormField) {
  return state.errors?.[field]?.[0];
}

function StateMessage({ state }: { state: ProjectFormState }) {
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

function ProjectFormFields({
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

function CreateProjectForm() {
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

function ProjectEditor({ project }: { project: ProjectViewModel }) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProject.bind(null, project.id),
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteProject.bind(null, project.id),
    initialState,
  );

  return (
    <details className={styles.projectItem}>
      <summary className={styles.projectSummary}>
        <div className={styles.projectSummaryMain}>
          <span className={styles.projectSlug}>{project.slug}</span>
          <span className={styles.projectTitle}>{project.title}</span>
          <span className={styles.projectDescription}>
            {project.shortDescription}
          </span>
          {project.tagList.length > 0 ? (
            <span className={styles.tagList}>
              {project.tagList.map((tag) => (
                <span className={styles.tagBadge} key={tag.slug}>
                  {tag.label}
                </span>
              ))}
            </span>
          ) : null}
          {project.stackList.length > 0 ? (
            <span className={styles.tagList}>
              {project.stackList.map((stack) => (
                <span className={styles.stackBadge} key={stack.slug}>
                  {stack.label}
                </span>
              ))}
            </span>
          ) : null}
        </div>
        <span className={styles.projectSummaryAside}>
          <span className={styles.badge}>
            {PROJECT_STATUS_LABELS[project.status]}
          </span>
          <span className={styles.badge}>
            {PROJECT_VISIBILITY_LABELS[project.visibility]}
          </span>
          <span className={styles.projectEditHint}>Modifier</span>
        </span>
      </summary>

      <div className={styles.projectDetails}>
        <form className={styles.form} action={updateAction}>
          <ProjectFormFields
            idPrefix={`project-${project.id}`}
            isPending={isUpdating}
            project={project}
            state={updateState}
          />
          <StateMessage state={updateState} />
          <div className={styles.actions}>
            <button
              className={styles.submitButton}
              type="submit"
              disabled={isUpdating}
            >
              {isUpdating ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>

        <form action={deleteAction}>
          <StateMessage state={deleteState} />
          <button
            className={styles.dangerButton}
            type="submit"
            disabled={isDeleting}
          >
            {isDeleting ? "Suppression..." : "Supprimer"}
          </button>
        </form>
      </div>
    </details>
  );
}

export function ProjectManager({ projects }: ProjectManagerProps) {
  return (
    <div className={styles.manager}>
      <section className={styles.panel} aria-labelledby="create-title">
        <h2 id="create-title" className={styles.panelTitle}>
          Créer un projet
        </h2>
        <CreateProjectForm />
      </section>

      <section className={styles.panel} aria-labelledby="existing-title">
        <h2 id="existing-title" className={styles.panelTitle}>
          Projets existants
        </h2>
        {projects.length > 0 ? (
          <div className={styles.projectList}>
            {projects.map((project) => (
              <ProjectEditor key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            Aucun projet renseigné pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}
