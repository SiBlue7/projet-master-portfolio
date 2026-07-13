import { z } from "zod";

export const emptyToNull = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
};

export const requiredText = (label: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} est obligatoire.`)
    .max(maxLength, `${label} doit contenir ${maxLength} caractères maximum.`);

export const optionalText = (label: string, maxLength: number) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .max(maxLength, `${label} doit contenir ${maxLength} caractères maximum.`)
      .nullable(),
  );

export const optionalUrl = (label: string) =>
  z.preprocess(
    emptyToNull,
    z
      .string()
      .url(`${label} doit être une URL valide.`)
      .max(300, `${label} doit contenir 300 caractères maximum.`)
      .nullable(),
  );

export const checkboxField = z.preprocess(
  (value) => value === "on",
  z.boolean(),
);
