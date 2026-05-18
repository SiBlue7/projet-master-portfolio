import { z } from "zod";

export const PUBLIC_PROFILE_ID = "public-profile";

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

export const publicProfileSchema = z.object({
  displayName: requiredText("Le nom affiché", 120),
  headline: requiredText("Le titre", 160),
  bio: requiredText("La présentation", 1000),
  contactEmail: z
    .string()
    .trim()
    .min(1, "L'e-mail de contact est obligatoire.")
    .email("L'e-mail de contact doit être valide.")
    .max(254, "L'e-mail de contact doit contenir 254 caractères maximum.")
    .transform((email) => email.toLowerCase()),
  githubUrl: optionalUrl("Le lien GitHub"),
  linkedinUrl: optionalUrl("Le lien LinkedIn"),
});

export type PublicProfileFormValues = z.infer<typeof publicProfileSchema>;

export type PublicProfileFormField = keyof PublicProfileFormValues;

export type PublicProfileFormErrors = Partial<
  Record<PublicProfileFormField, string[]>
>;

export type PublicProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: PublicProfileFormErrors;
};

export function parsePublicProfileFormData(formData: FormData) {
  return publicProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    headline: formData.get("headline"),
    bio: formData.get("bio"),
    contactEmail: formData.get("contactEmail"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
  });
}
