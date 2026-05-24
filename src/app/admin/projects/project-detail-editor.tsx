"use client";

import { useActionState } from "react";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_VISIBILITY_LABELS,
  type ProjectFormState,
} from "@/lib/projects";
import { deleteProject, updateProject } from "./actions";
import {
  ProjectFormFields,
  ProjectMediaManager,
  StateMessage,
  type ProjectViewModel,
} from "./project-form";
import styles from "./page.module.css";
import { RunbookManager, type RunbookViewModel } from "./runbook-manager";

const initialState: ProjectFormState = {
  status: "idle",
};

export function ProjectDetailEditor({
  project,
  runbooks,
}: {
  project: ProjectViewModel;
  runbooks: RunbookViewModel[];
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProject.bind(null, project.id),
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteProject.bind(null, project.id),
    initialState,
  );

  return (
    <div className={styles.manager}>
      <section className={styles.panel} aria-labelledby="edit-project-title">
        <div className={styles.editorHeader}>
          <div>
            <span className={styles.projectSlug}>{project.slug}</span>
            <h2 id="edit-project-title" className={styles.panelTitle}>
              Modifier le projet
            </h2>
            <p className={styles.projectDescription}>
              {project.shortDescription}
            </p>
          </div>
          <span className={styles.projectSummaryAside}>
            <span className={styles.badge}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
            <span className={styles.badge}>
              {PROJECT_VISIBILITY_LABELS[project.visibility]}
            </span>
            <span className={styles.mediaSummary}>
              {project.media.length} capture
              {project.media.length > 1 ? "s" : ""}
            </span>
          </span>
        </div>

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
      </section>

      <section className={styles.panel}>
        <ProjectMediaManager project={project} />
      </section>

      <RunbookManager projectId={project.id} runbooks={runbooks} />

      <section className={styles.panel} aria-labelledby="delete-project-title">
        <h2 id="delete-project-title" className={styles.panelTitle}>
          Suppression
        </h2>
        <p className={styles.emptyState}>
          La suppression retire le projet, ses technologies, ses tags et ses
          captures associées.
        </p>
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
      </section>
    </div>
  );
}
