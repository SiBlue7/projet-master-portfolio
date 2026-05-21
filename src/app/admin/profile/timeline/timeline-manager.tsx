"use client";

import { useActionState } from "react";
import {
  formatTimelinePeriod,
  PROFILE_TIMELINE_ITEM_TYPE_LABELS,
  PROFILE_TIMELINE_ITEM_TYPES,
  type ProfileTimelineItemFormField,
  type ProfileTimelineItemFormState,
  type ProfileTimelineItemType,
} from "@/lib/profile-timeline";
import {
  createProfileTimelineItem,
  deleteProfileTimelineItem,
  updateProfileTimelineItem,
} from "./actions";
import styles from "./page.module.css";

export type TimelineItemViewModel = {
  id: string;
  type: ProfileTimelineItemType;
  title: string;
  organization: string;
  location: string;
  description: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
  sortOrder: number;
};

type TimelineManagerProps = {
  items: TimelineItemViewModel[];
};

const initialState: ProfileTimelineItemFormState = {
  status: "idle",
};

const emptyTimelineItem: TimelineItemViewModel = {
  id: "new",
  type: "FORMATION",
  title: "",
  organization: "",
  location: "",
  description: "",
  startMonth: "",
  endMonth: "",
  isCurrent: false,
  sortOrder: 0,
};

function getFieldError(
  state: ProfileTimelineItemFormState,
  field: ProfileTimelineItemFormField,
) {
  return state.errors?.[field]?.[0];
}

function StateMessage({ state }: { state: ProfileTimelineItemFormState }) {
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

function TimelineFormFields({
  idPrefix,
  isPending,
  item,
  state,
}: {
  idPrefix: string;
  isPending: boolean;
  item: TimelineItemViewModel;
  state: ProfileTimelineItemFormState;
}) {
  const typeError = getFieldError(state, "type");
  const titleError = getFieldError(state, "title");
  const organizationError = getFieldError(state, "organization");
  const locationError = getFieldError(state, "location");
  const descriptionError = getFieldError(state, "description");
  const startMonthError = getFieldError(state, "startMonth");
  const endMonthError = getFieldError(state, "endMonth");
  const sortOrderError = getFieldError(state, "sortOrder");

  return (
    <>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-type`}>
            Type
          </label>
          <select
            className={styles.input}
            id={`${idPrefix}-type`}
            name="type"
            defaultValue={item.type}
            aria-invalid={Boolean(typeError)}
            aria-describedby={typeError ? `${idPrefix}-type-error` : undefined}
            disabled={isPending}
            required
          >
            {PROFILE_TIMELINE_ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {PROFILE_TIMELINE_ITEM_TYPE_LABELS[type]}
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
            step="1"
            defaultValue={item.sortOrder}
            aria-invalid={Boolean(sortOrderError)}
            aria-describedby={
              sortOrderError ? `${idPrefix}-sortOrder-error` : undefined
            }
            disabled={isPending}
            required
          />
          {sortOrderError ? (
            <p className={styles.fieldError} id={`${idPrefix}-sortOrder-error`}>
              {sortOrderError}
            </p>
          ) : null}
        </div>
      </div>

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
            defaultValue={item.title}
            placeholder="Master 2 Cybersécurité"
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
          <label className={styles.label} htmlFor={`${idPrefix}-organization`}>
            Organisation
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-organization`}
            name="organization"
            type="text"
            defaultValue={item.organization}
            placeholder="École, entreprise, organisme"
            aria-invalid={Boolean(organizationError)}
            aria-describedby={
              organizationError ? `${idPrefix}-organization-error` : undefined
            }
            disabled={isPending}
            required
          />
          {organizationError ? (
            <p
              className={styles.fieldError}
              id={`${idPrefix}-organization-error`}
            >
              {organizationError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-startMonth`}>
            Début
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-startMonth`}
            name="startMonth"
            type="month"
            defaultValue={item.startMonth}
            aria-invalid={Boolean(startMonthError)}
            aria-describedby={
              startMonthError ? `${idPrefix}-startMonth-error` : undefined
            }
            disabled={isPending}
          />
          {startMonthError ? (
            <p
              className={styles.fieldError}
              id={`${idPrefix}-startMonth-error`}
            >
              {startMonthError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-endMonth`}>
            Fin
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-endMonth`}
            name="endMonth"
            type="month"
            defaultValue={item.endMonth}
            aria-invalid={Boolean(endMonthError)}
            aria-describedby={
              endMonthError ? `${idPrefix}-endMonth-error` : undefined
            }
            disabled={isPending}
          />
          {endMonthError ? (
            <p className={styles.fieldError} id={`${idPrefix}-endMonth-error`}>
              {endMonthError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${idPrefix}-location`}>
            Lieu
          </label>
          <input
            className={styles.input}
            id={`${idPrefix}-location`}
            name="location"
            type="text"
            defaultValue={item.location}
            placeholder="Lyon, Paris, Remote..."
            aria-invalid={Boolean(locationError)}
            aria-describedby={
              locationError ? `${idPrefix}-location-error` : undefined
            }
            disabled={isPending}
          />
          {locationError ? (
            <p className={styles.fieldError} id={`${idPrefix}-location-error`}>
              {locationError}
            </p>
          ) : null}
        </div>
      </div>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="isCurrent"
          defaultChecked={item.isCurrent}
          disabled={isPending}
        />
        Élément en cours
      </label>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${idPrefix}-description`}>
          Description
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          id={`${idPrefix}-description`}
          name="description"
          defaultValue={item.description}
          rows={4}
          placeholder="Quelques lignes sur les missions, compétences ou apprentissages."
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
    </>
  );
}

function CreateTimelineItemForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [state, formAction, isPending] = useActionState(
    createProfileTimelineItem,
    initialState,
  );
  const item = {
    ...emptyTimelineItem,
    sortOrder: nextSortOrder,
  };

  return (
    <form className={styles.form} action={formAction}>
      <TimelineFormFields
        idPrefix="new-timeline-item"
        isPending={isPending}
        item={item}
        state={state}
      />
      <StateMessage state={state} />
      <div className={styles.actions}>
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Ajout..." : "Ajouter au parcours"}
        </button>
      </div>
    </form>
  );
}

function TimelineItemEditor({ item }: { item: TimelineItemViewModel }) {
  const [updateState, updateAction, isUpdating] = useActionState(
    updateProfileTimelineItem.bind(null, item.id),
    initialState,
  );
  const [deleteState, deleteAction, isDeleting] = useActionState(
    deleteProfileTimelineItem.bind(null, item.id),
    initialState,
  );
  const period = formatTimelinePeriod({
    startMonth: item.startMonth,
    endMonth: item.endMonth,
    isCurrent: item.isCurrent,
  });

  return (
    <details className={styles.timelineItem}>
      <summary className={styles.timelineSummary}>
        <div className={styles.timelineSummaryMain}>
          <span className={styles.timelineTitle}>{item.title}</span>
          <span className={styles.timelineMeta}>
            {item.organization} · {period}
            {item.location ? ` · ${item.location}` : ""}
          </span>
        </div>
        <span className={styles.timelineSummaryAside}>
          <span className={styles.timelineOrder}>#{item.sortOrder}</span>
          <span className={styles.timelineEditHint}>Modifier</span>
        </span>
      </summary>

      <div className={styles.timelineDetails}>
        <form className={styles.form} action={updateAction}>
          <TimelineFormFields
            idPrefix={`timeline-item-${item.id}`}
            isPending={isUpdating}
            item={item}
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

export function TimelineManager({ items }: TimelineManagerProps) {
  const nextSortOrder =
    items.length > 0 ? Math.max(...items.map((item) => item.sortOrder)) + 1 : 0;
  const groupedItems = PROFILE_TIMELINE_ITEM_TYPES.map((type) => ({
    type,
    items: items.filter((item) => item.type === type),
    label: PROFILE_TIMELINE_ITEM_TYPE_LABELS[type],
  }));

  return (
    <div className={styles.manager}>
      <section className={styles.panel} aria-labelledby="new-timeline-title">
        <h2 id="new-timeline-title" className={styles.panelTitle}>
          Ajouter un élément
        </h2>
        <CreateTimelineItemForm nextSortOrder={nextSortOrder} />
      </section>

      <section className={styles.panel} aria-labelledby="timeline-list-title">
        <h2 id="timeline-list-title" className={styles.panelTitle}>
          Parcours existant
        </h2>
        {items.length > 0 ? (
          <div className={styles.timelineGroups}>
            {groupedItems.map((group) => (
              <section
                className={styles.timelineGroup}
                data-type={group.type}
                key={group.type}
                aria-labelledby={`timeline-admin-group-${group.type}`}
              >
                <header className={styles.timelineGroupHeader}>
                  <h3
                    className={styles.timelineGroupTitle}
                    id={`timeline-admin-group-${group.type}`}
                  >
                    {group.label}
                  </h3>
                </header>

                {group.items.length > 0 ? (
                  <div className={styles.timelineList}>
                    {group.items.map((item) => (
                      <TimelineItemEditor item={item} key={item.id} />
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyState}>
                    Aucun élément pour cette catégorie.
                  </p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>
            Aucun élément de parcours renseigné pour le moment.
          </p>
        )}
      </section>
    </div>
  );
}
