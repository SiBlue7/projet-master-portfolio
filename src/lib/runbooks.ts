import { z } from "zod";
import { normalizeProjectSlug } from "@/lib/projects";

export const RUNBOOK_ENVIRONMENT_KINDS = [
  "LOCAL",
  "PREPROD",
  "PRODUCTION",
  "OTHER",
] as const;

export const RUNBOOK_ENVIRONMENT_KIND_LABELS = {
  LOCAL: "Local",
  OTHER: "Autre",
  PREPROD: "Préproduction",
  PRODUCTION: "Production",
} as const;

export const RUNBOOK_STEP_TYPES = [
  "MANUAL",
  "COMMAND",
  "HTTP_REQUEST",
] as const;

export const RUNBOOK_STEP_TYPE_LABELS = {
  COMMAND: "Commande",
  HTTP_REQUEST: "Requête HTTP",
  MANUAL: "Manuelle",
} as const;

export const RUNBOOK_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export type RunbookEnvironmentKind = (typeof RUNBOOK_ENVIRONMENT_KINDS)[number];
export type RunbookStepType = (typeof RUNBOOK_STEP_TYPES)[number];

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(maxLength, `${label} doit contenir ${maxLength} caractères maximum.`);

const optionalText = (label: string, maxLength: number) =>
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
      .max(maxLength, `${label} doit contenir ${maxLength} caractères maximum.`)
      .nullable(),
  );

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

const optionalRunbookUrl = (label: string) =>
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
      .max(500, `${label} doit contenir 500 caractères maximum.`)
      .nullable(),
  );

const slugField = (label: string, maxLength = 120) =>
  z
    .string()
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(maxLength, `${label} doit contenir ${maxLength} caractères maximum.`)
    .transform(normalizeProjectSlug)
    .refine((slug) => slug.length > 0, `${label} est obligatoire.`)
    .refine(
      (slug) => slugPattern.test(slug),
      `${label} doit contenir uniquement des lettres minuscules, chiffres et tirets.`,
    );

const sortOrderField = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return 0;
    }

    const trimmedValue = value.trim();

    return trimmedValue ? Number(trimmedValue) : 0;
  },
  z
    .number()
    .int("L'ordre doit être un nombre entier.")
    .min(0, "L'ordre doit être supérieur ou égal à 0.")
    .max(999, "L'ordre doit être inférieur ou égal à 999."),
);

const checkboxField = z.preprocess((value) => value === "on", z.boolean());

export const runbookSchema = z.object({
  description: optionalText("La description", 1000),
  isActive: checkboxField,
  slug: slugField("Le slug"),
  sortOrder: sortOrderField,
  title: requiredText("Le titre", 140),
});

export const runbookEnvironmentSchema = z.object({
  baseUrl: optionalUrl("L'URL de base"),
  kind: z.enum(RUNBOOK_ENVIRONMENT_KINDS, {
    message: "Le type d'environnement est obligatoire.",
  }),
  name: requiredText("Le nom", 80),
  slug: slugField("Le slug", 80),
  sortOrder: sortOrderField,
});

export const runbookStepSchema = z
  .object({
    command: optionalText("La commande", 2000),
    description: optionalText("La description", 1000),
    environmentId: z.preprocess((value) => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmedValue = value.trim();

      return trimmedValue.length > 0 ? trimmedValue : null;
    }, z.string().nullable()),
    expectedResult: optionalText("Le résultat attendu", 1000),
    httpMethod: z.preprocess((value) => {
      if (typeof value !== "string") {
        return null;
      }

      const trimmedValue = value.trim();

      return trimmedValue.length > 0 ? trimmedValue : null;
    }, z.enum(RUNBOOK_HTTP_METHODS).nullable()),
    isExecutable: checkboxField,
    sortOrder: sortOrderField,
    title: requiredText("Le titre", 140),
    type: z.enum(RUNBOOK_STEP_TYPES, {
      message: "Le type d'étape est obligatoire.",
    }),
    url: optionalRunbookUrl("L'URL"),
  })
  .refine(
    ({ command, type }) => {
      if (type !== "COMMAND") {
        return true;
      }

      return Boolean(command);
    },
    {
      message: "La commande est obligatoire pour une étape de type commande.",
      path: ["command"],
    },
  )
  .refine(
    ({ type, url }) => {
      if (type !== "HTTP_REQUEST") {
        return true;
      }

      return Boolean(url);
    },
    {
      message: "L'URL est obligatoire pour une requête HTTP.",
      path: ["url"],
    },
  )
  .refine(
    ({ httpMethod, type }) => {
      if (type !== "HTTP_REQUEST") {
        return true;
      }

      return Boolean(httpMethod);
    },
    {
      message: "La méthode HTTP est obligatoire pour une requête HTTP.",
      path: ["httpMethod"],
    },
  )
  .transform((step) => {
    if (step.type === "COMMAND") {
      return {
        ...step,
        httpMethod: null,
        url: null,
      };
    }

    if (step.type === "HTTP_REQUEST") {
      return {
        ...step,
        command: null,
      };
    }

    return {
      ...step,
      command: null,
      httpMethod: null,
      isExecutable: false,
      url: null,
    };
  });

export type RunbookFormValues = z.input<typeof runbookSchema>;
export type RunbookFormField = keyof RunbookFormValues;
export type RunbookFormErrors = Partial<Record<RunbookFormField, string[]>>;

export type RunbookEnvironmentFormValues = z.input<
  typeof runbookEnvironmentSchema
>;
export type RunbookEnvironmentFormField = keyof RunbookEnvironmentFormValues;
export type RunbookEnvironmentFormErrors = Partial<
  Record<RunbookEnvironmentFormField, string[]>
>;

export type RunbookStepFormValues = z.input<typeof runbookStepSchema>;
export type RunbookStepFormField = keyof RunbookStepFormValues;
export type RunbookStepFormErrors = Partial<
  Record<RunbookStepFormField, string[]>
>;

export type FormState<TField extends string> = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<TField, string[]>>;
};

export type RunbookFormState = FormState<RunbookFormField>;
export type RunbookEnvironmentFormState =
  FormState<RunbookEnvironmentFormField>;
export type RunbookStepFormState = FormState<RunbookStepFormField>;

export function parseRunbookFormData(formData: FormData) {
  return runbookSchema.safeParse({
    description: formData.get("description"),
    isActive: formData.get("isActive"),
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder"),
    title: formData.get("title"),
  });
}

export function parseRunbookEnvironmentFormData(formData: FormData) {
  return runbookEnvironmentSchema.safeParse({
    baseUrl: formData.get("baseUrl"),
    kind: formData.get("kind"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder"),
  });
}

export function parseRunbookStepFormData(formData: FormData) {
  return runbookStepSchema.safeParse({
    command: formData.get("command"),
    description: formData.get("description"),
    environmentId: formData.get("environmentId"),
    expectedResult: formData.get("expectedResult"),
    httpMethod: formData.get("httpMethod"),
    isExecutable: formData.get("isExecutable"),
    sortOrder: formData.get("sortOrder"),
    title: formData.get("title"),
    type: formData.get("type"),
    url: formData.get("url"),
  });
}
