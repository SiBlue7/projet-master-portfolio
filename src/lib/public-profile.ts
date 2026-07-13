import { z } from "zod";
import { optionalUrl, requiredText } from "@/lib/form-fields";

export const PUBLIC_PROFILE_ID = "public-profile";
export const AVATAR_MAX_SIZE_IN_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type PublicProfileAvatarMimeType =
  (typeof ACCEPTED_AVATAR_MIME_TYPES)[number];

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

export type PublicProfileTextField = keyof PublicProfileFormValues;

export type PublicProfileFormField = PublicProfileTextField | "avatar";

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

export function validateProfileAvatarFile(file: File | null) {
  if (!file || file.size === 0) {
    return {
      success: true as const,
      data: null,
    };
  }

  if (!ACCEPTED_AVATAR_MIME_TYPES.includes(file.type as never)) {
    return {
      success: false as const,
      error: "L'avatar doit être une image JPG, PNG ou WebP.",
    };
  }

  if (file.size > AVATAR_MAX_SIZE_IN_BYTES) {
    return {
      success: false as const,
      error: "L'avatar doit peser 2 Mo maximum.",
    };
  }

  return {
    success: true as const,
    data: file as File & { type: PublicProfileAvatarMimeType },
  };
}

export function getPublicProfileAvatarFile(formData: FormData) {
  const avatar = formData.get("avatar");

  return avatar instanceof File ? avatar : null;
}

export function shouldRemovePublicProfileAvatar(formData: FormData) {
  return formData.get("removeAvatar") === "on";
}
