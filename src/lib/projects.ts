import { z } from "zod";

export const PROJECT_STATUSES = [
  "DRAFT",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
] as const;

export const PROJECT_STATUS_LABELS = {
  ARCHIVED: "Archivé",
  COMPLETED: "Terminé",
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
} as const;

export const PROJECT_TAGS = [
  {
    label: "En cours",
    slug: "en-cours",
  },
  {
    label: "Terminé",
    slug: "termine",
  },
  {
    label: "Archivé",
    slug: "archive",
  },
] as const;

export const PROJECT_VISIBILITIES = ["PRIVATE", "PUBLIC"] as const;

export const PROJECT_VISIBILITY_LABELS = {
  PRIVATE: "Privé",
  PUBLIC: "Public",
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectTagSlug = (typeof PROJECT_TAGS)[number]["slug"];
export type ProjectVisibility = (typeof PROJECT_VISIBILITIES)[number];

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(maxLength, `${label} doit contenir ${maxLength} caractères maximum.`);

const optionalUrl = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmedValue = value.trim();

      return trimmedValue.length > 0 ? trimmedValue : null;
    },
    z
      .string()
      .url(`${label} doit être une URL valide.`)
      .max(300, `${label} doit contenir 300 caractères maximum.`)
      .nullable(),
  );

const optionalDate = (label: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmedValue = value.trim();

      return trimmedValue.length > 0 ? trimmedValue : null;
    },
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} doit être une date valide.`)
      .nullable(),
  );

const checkboxField = z.preprocess((value) => value === "on", z.boolean());

function dateInputToDate(dateValue: string | null) {
  if (!dateValue) {
    return null;
  }

  return new Date(`${dateValue}T00:00:00.000Z`);
}

export function normalizeProjectSlug(slug: string) {
  return slug
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export type ProjectTagInput = {
  label: string;
  slug: string;
};

export type ProjectStackInput = {
  label: string;
  slug: string;
};

const projectTagsBySlug = new Map<ProjectTagSlug, ProjectTagInput>(
  PROJECT_TAGS.map((tag) => [tag.slug, tag]),
);

export function isDefinedProjectTag(tag: ProjectTagInput) {
  return projectTagsBySlug.has(tag.slug as ProjectTagSlug);
}

export function parseProjectTagsInput(tagsValue: string): ProjectTagInput[] {
  const slug = normalizeProjectSlug(tagsValue);

  if (!slug) {
    return [];
  }

  const tag = projectTagsBySlug.get(slug as ProjectTagSlug);

  return tag ? [{ ...tag }] : [];
}

export function parseProjectStacksInput(
  stacksValue: string,
): ProjectStackInput[] {
  const stacksBySlug = new Map<string, ProjectStackInput>();

  stacksValue
    .split(",")
    .map((stack) => stack.trim())
    .filter(Boolean)
    .forEach((label) => {
      const slug = normalizeProjectSlug(label);

      if (!slug || stacksBySlug.has(slug)) {
        return;
      }

      stacksBySlug.set(slug, {
        label,
        slug,
      });
    });

  return Array.from(stacksBySlug.values());
}

const maxProjectStacks = 16;

export const projectSchema = z
  .object({
    title: requiredText("Le titre", 140),
    slug: z
      .string()
      .trim()
      .min(1, "Le slug est obligatoire.")
      .max(120, "Le slug doit contenir 120 caractères maximum.")
      .transform(normalizeProjectSlug)
      .refine((slug) => slug.length > 0, "Le slug est obligatoire.")
      .refine(
        (slug) => slugPattern.test(slug),
        "Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets.",
      ),
    shortDescription: requiredText("La description courte", 220),
    description: requiredText("La description complète", 3000),
    status: z.enum(PROJECT_STATUSES, {
      message: "Le statut est obligatoire.",
    }),
    visibility: z.enum(PROJECT_VISIBILITIES, {
      message: "La visibilité est obligatoire.",
    }),
    showDetails: checkboxField,
    showTechnologies: checkboxField,
    showExternalLinks: checkboxField,
    showMedia: checkboxField,
    showMetadata: checkboxField,
    repositoryUrl: optionalUrl("Le lien GitHub"),
    demoUrl: optionalUrl("Le lien démo"),
    startedAt: optionalDate("La date de début"),
    endedAt: optionalDate("La date de fin"),
    stacks: z
      .string()
      .max(600, "Les technologies doivent contenir 600 caractères maximum.")
      .transform(parseProjectStacksInput)
      .refine(
        (stacks) => stacks.length <= maxProjectStacks,
        `Un projet peut contenir ${maxProjectStacks} technologies maximum.`,
      )
      .refine(
        (stacks) => stacks.every((stack) => stack.label.length <= 40),
        "Chaque technologie doit contenir 40 caractères maximum.",
      ),
    tags: z
      .string()
      .refine((tag) => {
        const slug = normalizeProjectSlug(tag);

        return !slug || projectTagsBySlug.has(slug as ProjectTagSlug);
      }, "Choisissez un tag parmi la liste définie.")
      .transform(parseProjectTagsInput),
  })
  .refine(
    ({ endedAt, startedAt }) => {
      if (!startedAt || !endedAt) {
        return true;
      }

      return endedAt >= startedAt;
    },
    {
      message: "La date de fin doit être postérieure à la date de début.",
      path: ["endedAt"],
    },
  )
  .transform(({ endedAt, startedAt, ...project }) => ({
    ...project,
    endedAt: dateInputToDate(endedAt),
    startedAt: dateInputToDate(startedAt),
  }));

export type ProjectFormValues = z.input<typeof projectSchema>;
export type ProjectFormField = keyof ProjectFormValues;
export type ProjectFormErrors = Partial<Record<ProjectFormField, string[]>>;

export type ProjectFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: ProjectFormErrors;
};

function getCheckboxFormValue(formData: FormData, field: string) {
  const values = formData.getAll(field);

  if (values.length === 0) {
    return "on";
  }

  return values.includes("on") ? "on" : "off";
}

export function parseProjectFormData(formData: FormData) {
  return projectSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    status: formData.get("status"),
    visibility: formData.get("visibility"),
    showDetails: getCheckboxFormValue(formData, "showDetails"),
    showTechnologies: getCheckboxFormValue(formData, "showTechnologies"),
    showExternalLinks: getCheckboxFormValue(formData, "showExternalLinks"),
    showMedia: getCheckboxFormValue(formData, "showMedia"),
    showMetadata: getCheckboxFormValue(formData, "showMetadata"),
    repositoryUrl: formData.get("repositoryUrl"),
    demoUrl: formData.get("demoUrl"),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt"),
    stacks: formData.get("stacks") ?? "",
    tags: formData.get("tags") ?? "",
  });
}
