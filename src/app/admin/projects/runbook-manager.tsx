"use client";

import { useActionState } from "react";
import {
  RUNBOOK_ENVIRONMENT_KIND_LABELS,
  RUNBOOK_ENVIRONMENT_KINDS,
  RUNBOOK_HTTP_METHODS,
  RUNBOOK_STEP_TYPE_LABELS,
  RUNBOOK_STEP_TYPES,
  type RunbookEnvironmentFormField,
  type RunbookEnvironmentFormState,
  type RunbookEnvironmentKind,
  type RunbookFormField,
  type RunbookFormState,
  type RunbookStepFormField,
  type RunbookStepFormState,
  type RunbookStepType,
} from "@/lib/runbooks";
import { StateMessage } from "./project-form";
import {
  createRunbook,
  createRunbookEnvironment,
  createRunbookStep,
  deleteRunbook,
  deleteRunbookEnvironment,
  deleteRunbookStep,
  updateRunbook,
  updateRunbookEnvironment,
  updateRunbookStep,
} from "./runbook-actions";
import styles from "./page.module.css";

export type RunbookViewModel = {
  id: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  environments: RunbookEnvironmentViewModel[];
  steps: RunbookStepViewModel[];
};

export type RunbookEnvironmentViewModel = {
  id: string;
  kind: RunbookEnvironmentKind;
  name: string;
  slug: string;
  baseUrl: string;
  sortOrder: number;
};

export type RunbookStepViewModel = {
  id: string;
  environmentId: string;
  title: string;
  description: string;
  type: RunbookStepType;
  command: string;
  url: string;
  httpMethod: string;
  expectedResult: string;
  isExecutable: boolean;
  sortOrder: number;
};

const initialRunbookState: RunbookFormState = {
  status: "idle",
};

const initialEnvironmentState: RunbookEnvironmentFormState = {
  status: "idle",
};

const initialStepState: RunbookStepFormState = {
  status: "idle",
};

const emptyRunbook: RunbookViewModel = {
  description: "",
  environments: [],
  id: "new-runbook",
  isActive: true,
  slug: "",
  sortOrder: 0,
  steps: [],
  title: "",
};

const emptyEnvironment: RunbookEnvironmentViewModel = {
  baseUrl: "",
  id: "new-environment",
  kind: "LOCAL",
  name: "",
  slug: "",
  sortOrder: 0,
};

const emptyStep: RunbookStepViewModel = {
  command: "",
  description: "",
  environmentId: "",
  expectedResult: "",
  httpMethod: "GET",
  id: "new-step",
  isExecutable: false,
  sortOrder: 0,
  title: "",
  type: "MANUAL",
  url: "",
};

function getRunbookError(state: RunbookFormState, field: RunbookFormField) {
  return state.errors?.[field]?.[0];
}

function getEnvironmentError(
  state: RunbookEnvironmentFormState,
  field: RunbookEnvironmentFormField,
) {
  return state.errors?.[field]?.[0];
}

function getStepError(
  state: RunbookStepFormState,
  field: RunbookStepFormField,
) {
  return state.errors?.[field]?.[0];
}

function RunbookFormFields({
  idPrefix,
  isPending,
  runbook,
  state,
}: {
  idPrefix: string;
  isPending: boolean;
  runbook: RunbookViewModel;
  state: RunbookFormState;
}) {
  const titleError = getRunbookError(state, "title");
  const slugError = getRunbookError(state, "slug");
  const descriptionError = getRunbookError(state, "description");
  const sortOrderError = getRunbookError(state, "sortOrder");

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
            defaultValue={runbook.title}
            placeholder="Déploiement applicatif"
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
            defaultValue={runbook.slug}
            placeholder="deploiement-applicatif"
            aria-invalid={Boolean(slugError)}
            aria-describedby={slugError ? `${idPrefix}-slug-error` : undefined}
            disabled={isPending}
            required
          />
          {slugError ? (
            <p className={styles.fieldError} id={`${idPrefix}-slug-error`}>
              {slugError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-description`}>
          Description
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={runbook.description}
          rows={4}
          placeholder="Objectif du runbook et contexte d'utilisation."
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={
            descriptionError ? `${idPrefix}-description-error` : undefined
          }
          disabled={isPending}
        />
        {descriptionError ? (
          <p className={styles.fieldError} id={`${idPrefix}-description-error`}>
            {descriptionError}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGrid}>
        <label className={styles.checkboxField} htmlFor={`${idPrefix}-active`}>
          <input
            id={`${idPrefix}-active`}
            name="isActive"
            type="checkbox"
            defaultChecked={runbook.isActive}
            disabled={isPending}
          />
          Runbook actif
        </label>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-sortOrder`}>
            Ordre
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-sortOrder`}
            name="sortOrder"
            type="number"
            min="0"
            max="999"
            defaultValue={runbook.sortOrder}
            aria-invalid={Boolean(sortOrderError)}
            aria-describedby={
              sortOrderError ? `${idPrefix}-sortOrder-error` : undefined
            }
            disabled={isPending}
          />
          {sortOrderError ? (
            <p className={styles.fieldError} id={`${idPrefix}-sortOrder-error`}>
              {sortOrderError}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}

function RunbookEnvironmentFormFields({
  environment,
  idPrefix,
  isPending,
  state,
}: {
  environment: RunbookEnvironmentViewModel;
  idPrefix: string;
  isPending: boolean;
  state: RunbookEnvironmentFormState;
}) {
  const nameError = getEnvironmentError(state, "name");
  const slugError = getEnvironmentError(state, "slug");
  const kindError = getEnvironmentError(state, "kind");
  const baseUrlError = getEnvironmentError(state, "baseUrl");
  const sortOrderError = getEnvironmentError(state, "sortOrder");

  return (
    <>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-name`}>
            Nom
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-name`}
            name="name"
            type="text"
            defaultValue={environment.name}
            placeholder="Préproduction"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? `${idPrefix}-name-error` : undefined}
            disabled={isPending}
            required
          />
          {nameError ? (
            <p className={styles.fieldError} id={`${idPrefix}-name-error`}>
              {nameError}
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
            defaultValue={environment.slug}
            placeholder="preproduction"
            aria-invalid={Boolean(slugError)}
            aria-describedby={slugError ? `${idPrefix}-slug-error` : undefined}
            disabled={isPending}
            required
          />
          {slugError ? (
            <p className={styles.fieldError} id={`${idPrefix}-slug-error`}>
              {slugError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-kind`}>
            Type
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-kind`}
            name="kind"
            defaultValue={environment.kind}
            aria-invalid={Boolean(kindError)}
            aria-describedby={kindError ? `${idPrefix}-kind-error` : undefined}
            disabled={isPending}
            required
          >
            {RUNBOOK_ENVIRONMENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {RUNBOOK_ENVIRONMENT_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
          {kindError ? (
            <p className={styles.fieldError} id={`${idPrefix}-kind-error`}>
              {kindError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-baseUrl`}>
            URL de base
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-baseUrl`}
            name="baseUrl"
            type="url"
            defaultValue={environment.baseUrl}
            placeholder="https://preprod.justdoeat.org"
            aria-invalid={Boolean(baseUrlError)}
            aria-describedby={
              baseUrlError ? `${idPrefix}-baseUrl-error` : undefined
            }
            disabled={isPending}
          />
          {baseUrlError ? (
            <p className={styles.fieldError} id={`${idPrefix}-baseUrl-error`}>
              {baseUrlError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-sortOrder`}>
          Ordre
        </label>
        <input
          className={styles.input}
          id={`${idPrefix}-sortOrder`}
          name="sortOrder"
          type="number"
          min="0"
          max="999"
          defaultValue={environment.sortOrder}
          aria-invalid={Boolean(sortOrderError)}
          aria-describedby={
            sortOrderError ? `${idPrefix}-sortOrder-error` : undefined
          }
          disabled={isPending}
        />
        {sortOrderError ? (
          <p className={styles.fieldError} id={`${idPrefix}-sortOrder-error`}>
            {sortOrderError}
          </p>
        ) : null}
      </div>
    </>
  );
}

function RunbookStepFormFields({
  environments,
  idPrefix,
  isPending,
  state,
  step,
}: {
  environments: RunbookEnvironmentViewModel[];
  idPrefix: string;
  isPending: boolean;
  state: RunbookStepFormState;
  step: RunbookStepViewModel;
}) {
  const titleError = getStepError(state, "title");
  const descriptionError = getStepError(state, "description");
  const environmentIdError = getStepError(state, "environmentId");
  const typeError = getStepError(state, "type");
  const commandError = getStepError(state, "command");
  const urlError = getStepError(state, "url");
  const httpMethodError = getStepError(state, "httpMethod");
  const expectedResultError = getStepError(state, "expectedResult");
  const sortOrderError = getStepError(state, "sortOrder");

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
            defaultValue={step.title}
            placeholder="Vérifier la santé applicative"
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
          <label className={styles.label} htmlFor={`${idPrefix}-environment`}>
            Environnement
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-environment`}
            name="environmentId"
            defaultValue={step.environmentId}
            aria-invalid={Boolean(environmentIdError)}
            aria-describedby={
              environmentIdError ? `${idPrefix}-environment-error` : undefined
            }
            disabled={isPending}
          >
            <option value="">Tous les environnements</option>
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name}
              </option>
            ))}
          </select>
          {environmentIdError ? (
            <p
              className={styles.fieldError}
              id={`${idPrefix}-environment-error`}
            >
              {environmentIdError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-description`}>
          Description
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={step.description}
          rows={3}
          placeholder="Contexte, prérequis ou explication de l'étape."
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={
            descriptionError ? `${idPrefix}-description-error` : undefined
          }
          disabled={isPending}
        />
        {descriptionError ? (
          <p className={styles.fieldError} id={`${idPrefix}-description-error`}>
            {descriptionError}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-type`}>
            Type d&apos;étape
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-type`}
            name="type"
            defaultValue={step.type}
            aria-invalid={Boolean(typeError)}
            aria-describedby={typeError ? `${idPrefix}-type-error` : undefined}
            disabled={isPending}
            required
          >
            {RUNBOOK_STEP_TYPES.map((type) => (
              <option key={type} value={type}>
                {RUNBOOK_STEP_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {typeError ? (
            <p className={styles.fieldError} id={`${idPrefix}-type-error`}>
              {typeError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-sortOrder`}>
            Ordre
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-sortOrder`}
            name="sortOrder"
            type="number"
            min="0"
            max="999"
            defaultValue={step.sortOrder}
            aria-invalid={Boolean(sortOrderError)}
            aria-describedby={
              sortOrderError ? `${idPrefix}-sortOrder-error` : undefined
            }
            disabled={isPending}
          />
          {sortOrderError ? (
            <p className={styles.fieldError} id={`${idPrefix}-sortOrder-error`}>
              {sortOrderError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-command`}>
          Commande
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id={`${idPrefix}-command`}
          name="command"
          defaultValue={step.command}
          rows={3}
          placeholder="docker compose ps"
          aria-invalid={Boolean(commandError)}
          aria-describedby={
            commandError ? `${idPrefix}-command-error` : undefined
          }
          disabled={isPending}
        />
        {commandError ? (
          <p className={styles.fieldError} id={`${idPrefix}-command-error`}>
            {commandError}
          </p>
        ) : null}
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-httpMethod`}>
            Méthode HTTP
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-httpMethod`}
            name="httpMethod"
            defaultValue={step.httpMethod}
            aria-invalid={Boolean(httpMethodError)}
            aria-describedby={
              httpMethodError ? `${idPrefix}-httpMethod-error` : undefined
            }
            disabled={isPending}
          >
            {RUNBOOK_HTTP_METHODS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          {httpMethodError ? (
            <p
              className={styles.fieldError}
              id={`${idPrefix}-httpMethod-error`}
            >
              {httpMethodError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-url`}>
            URL
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-url`}
            name="url"
            type="text"
            defaultValue={step.url}
            placeholder="/api/health"
            aria-invalid={Boolean(urlError)}
            aria-describedby={urlError ? `${idPrefix}-url-error` : undefined}
            disabled={isPending}
          />
          {urlError ? (
            <p className={styles.fieldError} id={`${idPrefix}-url-error`}>
              {urlError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-expectedResult`}>
          Résultat attendu
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id={`${idPrefix}-expectedResult`}
          name="expectedResult"
          defaultValue={step.expectedResult}
          rows={3}
          placeholder="La route retourne un statut ok."
          aria-invalid={Boolean(expectedResultError)}
          aria-describedby={
            expectedResultError ? `${idPrefix}-expectedResult-error` : undefined
          }
          disabled={isPending}
        />
        {expectedResultError ? (
          <p
            className={styles.fieldError}
            id={`${idPrefix}-expectedResult-error`}
          >
            {expectedResultError}
          </p>
        ) : null}
      </div>

      <label
        className={styles.checkboxField}
        htmlFor={`${idPrefix}-executable`}
      >
        <input
          id={`${idPrefix}-executable`}
          name="isExecutable"
          type="checkbox"
          defaultChecked={step.isExecutable}
          disabled={isPending}
        />
        Étape exécutable plus tard depuis l&apos;administration
      </label>
    </>
  );
}

function CreateRunbookForm({ projectId }: { projectId: string }) {
  const [state, formAction, isPending] = useActionState(
    createRunbook.bind(null, projectId),
    initialRunbookState,
  );

  return (
    <form className={styles.form} action={formAction}>
      <RunbookFormFields
        idPrefix="new-runbook"
        isPending={isPending}
        runbook={emptyRunbook}
        state={state}
      />
      <StateMessage state={state} />
      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Création..." : "Créer le runbook"}
        </button>
      </div>
    </form>
  );
}

function UpdateRunbookForm({ runbook }: { runbook: RunbookViewModel }) {
  const [state, formAction, isPending] = useActionState(
    updateRunbook.bind(null, runbook.id),
    initialRunbookState,
  );

  return (
    <form className={styles.form} action={formAction}>
      <RunbookFormFields
        idPrefix={`runbook-${runbook.id}`}
        isPending={isPending}
        runbook={runbook}
        state={state}
      />
      <StateMessage state={state} />
      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Enregistrement..." : "Enregistrer le runbook"}
        </button>
      </div>
    </form>
  );
}

function DeleteRunbookForm({ runbookId }: { runbookId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteRunbook.bind(null, runbookId),
    initialRunbookState,
  );

  return (
    <form action={formAction}>
      <StateMessage state={state} />
      <button
        className={styles.dangerButton}
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Suppression..." : "Supprimer le runbook"}
      </button>
    </form>
  );
}

function CreateEnvironmentForm({ runbookId }: { runbookId: string }) {
  const [state, formAction, isPending] = useActionState(
    createRunbookEnvironment.bind(null, runbookId),
    initialEnvironmentState,
  );

  return (
    <form className={styles.nestedForm} action={formAction}>
      <RunbookEnvironmentFormFields
        environment={emptyEnvironment}
        idPrefix={`new-environment-${runbookId}`}
        isPending={isPending}
        state={state}
      />
      <StateMessage state={state} />
      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Création..." : "Ajouter l'environnement"}
        </button>
      </div>
    </form>
  );
}

function EnvironmentEditor({
  environment,
}: {
  environment: RunbookEnvironmentViewModel;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateRunbookEnvironment.bind(null, environment.id),
    initialEnvironmentState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteRunbookEnvironment.bind(null, environment.id),
    initialEnvironmentState,
  );

  return (
    <details className={styles.nestedItem}>
      <summary className={styles.nestedSummary}>
        <span>
          <span className={styles.projectSlug}>{environment.slug}</span>
          <span className={styles.projectTitle}>{environment.name}</span>
        </span>
        <span className={styles.badge}>
          {RUNBOOK_ENVIRONMENT_KIND_LABELS[environment.kind]}
        </span>
      </summary>

      <div className={styles.nestedDetails}>
        <form className={styles.nestedForm} action={updateAction}>
          <RunbookEnvironmentFormFields
            environment={environment}
            idPrefix={`environment-${environment.id}`}
            isPending={isUpdating}
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
            {isDeleting ? "Suppression..." : "Supprimer l'environnement"}
          </button>
        </form>
      </div>
    </details>
  );
}

function CreateStepForm({ runbook }: { runbook: RunbookViewModel }) {
  const [state, formAction, isPending] = useActionState(
    createRunbookStep.bind(null, runbook.id),
    initialStepState,
  );

  return (
    <form className={styles.nestedForm} action={formAction}>
      <RunbookStepFormFields
        environments={runbook.environments}
        idPrefix={`new-step-${runbook.id}`}
        isPending={isPending}
        state={state}
        step={emptyStep}
      />
      <StateMessage state={state} />
      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Création..." : "Ajouter l'étape"}
        </button>
      </div>
    </form>
  );
}

function StepEditor({
  environments,
  step,
}: {
  environments: RunbookEnvironmentViewModel[];
  step: RunbookStepViewModel;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateRunbookStep.bind(null, step.id),
    initialStepState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteRunbookStep.bind(null, step.id),
    initialStepState,
  );
  const environment = environments.find(
    (candidate) => candidate.id === step.environmentId,
  );

  return (
    <details className={styles.nestedItem}>
      <summary className={styles.nestedSummary}>
        <span>
          <span className={styles.projectSlug}>
            #{step.sortOrder} {RUNBOOK_STEP_TYPE_LABELS[step.type]}
          </span>
          <span className={styles.projectTitle}>{step.title}</span>
        </span>
        <span className={styles.projectSummaryAside}>
          {environment ? (
            <span className={styles.badge}>{environment.name}</span>
          ) : null}
          {step.isExecutable ? (
            <span className={styles.mediaSummary}>Exécutable</span>
          ) : null}
        </span>
      </summary>

      <div className={styles.nestedDetails}>
        <form className={styles.nestedForm} action={updateAction}>
          <RunbookStepFormFields
            environments={environments}
            idPrefix={`step-${step.id}`}
            isPending={isUpdating}
            state={updateState}
            step={step}
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
            {isDeleting ? "Suppression..." : "Supprimer l'étape"}
          </button>
        </form>
      </div>
    </details>
  );
}

function RunbookEditor({ runbook }: { runbook: RunbookViewModel }) {
  return (
    <details className={styles.projectItem}>
      <summary className={styles.projectSummary}>
        <div className={styles.projectSummaryMain}>
          <span className={styles.projectSlug}>{runbook.slug}</span>
          <span className={styles.projectTitle}>{runbook.title}</span>
          {runbook.description ? (
            <span className={styles.projectDescription}>
              {runbook.description}
            </span>
          ) : null}
        </div>
        <span className={styles.projectSummaryAside}>
          <span className={styles.badge}>
            {runbook.isActive ? "Actif" : "Inactif"}
          </span>
          <span className={styles.mediaSummary}>
            {runbook.environments.length} env.
          </span>
          <span className={styles.mediaSummary}>
            {runbook.steps.length} étape{runbook.steps.length > 1 ? "s" : ""}
          </span>
        </span>
      </summary>

      <div className={styles.projectDetails}>
        <section
          className={styles.nestedPanel}
          aria-label="Modifier le runbook"
        >
          <UpdateRunbookForm runbook={runbook} />
        </section>

        <section
          className={styles.nestedPanel}
          aria-labelledby={`runbook-${runbook.id}-environments`}
        >
          <div className={styles.nestedHeader}>
            <div>
              <h3
                id={`runbook-${runbook.id}-environments`}
                className={styles.mediaTitle}
              >
                Environnements
              </h3>
              <p className={styles.mediaDescription}>
                Définissez les contextes sur lesquels ce runbook pourra être
                appliqué.
              </p>
            </div>
          </div>

          <CreateEnvironmentForm runbookId={runbook.id} />

          {runbook.environments.length > 0 ? (
            <div className={styles.nestedList}>
              {runbook.environments.map((environment) => (
                <EnvironmentEditor
                  environment={environment}
                  key={environment.id}
                />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>
              Aucun environnement défini pour ce runbook.
            </p>
          )}
        </section>

        <section
          className={styles.nestedPanel}
          aria-labelledby={`runbook-${runbook.id}-steps`}
        >
          <div className={styles.nestedHeader}>
            <div>
              <h3
                id={`runbook-${runbook.id}-steps`}
                className={styles.mediaTitle}
              >
                Étapes
              </h3>
              <p className={styles.mediaDescription}>
                Préparez les actions à suivre ou à rendre exécutables dans un
                futur ticket.
              </p>
            </div>
          </div>

          <CreateStepForm runbook={runbook} />

          {runbook.steps.length > 0 ? (
            <div className={styles.nestedList}>
              {runbook.steps.map((step) => (
                <StepEditor
                  environments={runbook.environments}
                  key={step.id}
                  step={step}
                />
              ))}
            </div>
          ) : (
            <p className={styles.emptyState}>
              Aucune étape définie pour ce runbook.
            </p>
          )}
        </section>

        <section
          className={styles.nestedPanel}
          aria-label="Supprimer le runbook"
        >
          <DeleteRunbookForm runbookId={runbook.id} />
        </section>
      </div>
    </details>
  );
}

export function RunbookManager({
  projectId,
  runbooks,
}: {
  projectId: string;
  runbooks: RunbookViewModel[];
}) {
  return (
    <section className={styles.panel} aria-labelledby="runbooks-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="runbooks-title" className={styles.panelTitle}>
            Runbooks
          </h2>
          <p className={styles.panelDescription}>
            Documentez les procédures utiles au projet : déploiement,
            vérification, exploitation ou résolution d&apos;incident.
          </p>
        </div>
        <span className={styles.mediaSummary}>
          {runbooks.length} runbook{runbooks.length > 1 ? "s" : ""}
        </span>
      </div>

      <CreateRunbookForm projectId={projectId} />

      {runbooks.length > 0 ? (
        <div className={styles.runbookList}>
          {runbooks.map((runbook) => (
            <RunbookEditor key={runbook.id} runbook={runbook} />
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>Aucun runbook créé pour ce projet.</p>
      )}
    </section>
  );
}
