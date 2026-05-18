import { z } from "zod";

export const PROFILE_TIMELINE_ITEM_TYPES = [
  "FORMATION",
  "EXPERIENCE",
  "CERTIFICATION",
] as const;

export const PROFILE_TIMELINE_ITEM_TYPE_LABELS = {
  FORMATION: "Formation",
  EXPERIENCE: "Expérience",
  CERTIFICATION: "Certification",
} as const;

export type ProfileTimelineItemType =
  (typeof PROFILE_TIMELINE_ITEM_TYPES)[number];

const monthPattern = /^\d{4}-\d{2}$/;

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

const optionalMonth = (label: string) =>
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
      .regex(monthPattern, `${label} doit respecter le format AAAA-MM.`)
      .nullable(),
  );

function monthToDate(month: string | null) {
  if (!month) {
    return null;
  }

  const [year, monthIndex] = month.split("-").map(Number);

  return new Date(Date.UTC(year, monthIndex - 1, 1));
}

export function dateToMonthValue(date: Date | string | null) {
  if (!date) {
    return "";
  }

  const dateValue = typeof date === "string" ? new Date(date) : date;
  const year = dateValue.getUTCFullYear();
  const month = String(dateValue.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function formatTimelinePeriod({
  endMonth,
  isCurrent,
  startMonth,
}: {
  endMonth: string;
  isCurrent: boolean;
  startMonth: string;
}) {
  const start = startMonth || "Date non renseignée";
  const end = isCurrent ? "Aujourd'hui" : endMonth || "Date non renseignée";

  return `${start} - ${end}`;
}

export const profileTimelineItemSchema = z
  .object({
    type: z.enum(PROFILE_TIMELINE_ITEM_TYPES, {
      message: "Le type de parcours est obligatoire.",
    }),
    title: requiredText("Le titre", 140),
    organization: requiredText("L'organisation", 140),
    location: optionalText("Le lieu", 140),
    description: optionalText("La description", 1000),
    startMonth: optionalMonth("La date de début"),
    endMonth: optionalMonth("La date de fin"),
    isCurrent: z.preprocess((value) => value === "on", z.boolean()),
    sortOrder: z.coerce
      .number()
      .int("L'ordre doit être un nombre entier.")
      .min(0, "L'ordre doit être supérieur ou égal à 0.")
      .max(999, "L'ordre doit être inférieur ou égal à 999."),
  })
  .refine(
    ({ endMonth, isCurrent }) => {
      return !(isCurrent && endMonth);
    },
    {
      message: "Retirez la date de fin si cet élément est encore en cours.",
      path: ["endMonth"],
    },
  )
  .refine(
    ({ endMonth, startMonth }) => {
      if (!startMonth || !endMonth) {
        return true;
      }

      return endMonth >= startMonth;
    },
    {
      message: "La date de fin doit être postérieure à la date de début.",
      path: ["endMonth"],
    },
  )
  .transform(({ endMonth, startMonth, ...data }) => ({
    ...data,
    startDate: monthToDate(startMonth),
    endDate: data.isCurrent ? null : monthToDate(endMonth),
  }));

export type ProfileTimelineItemFormValues = z.input<
  typeof profileTimelineItemSchema
>;

export type ProfileTimelineItemFormField = keyof ProfileTimelineItemFormValues;

export type ProfileTimelineItemFormErrors = Partial<
  Record<ProfileTimelineItemFormField, string[]>
>;

export type ProfileTimelineItemFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: ProfileTimelineItemFormErrors;
};

export function parseProfileTimelineItemFormData(formData: FormData) {
  return profileTimelineItemSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    location: formData.get("location"),
    description: formData.get("description"),
    startMonth: formData.get("startMonth"),
    endMonth: formData.get("endMonth"),
    isCurrent: formData.get("isCurrent"),
    sortOrder: formData.get("sortOrder"),
  });
}
