import { describe, expect, it } from "vitest";
import {
  getPublicProfileAvatarFile,
  parsePublicProfileFormData,
  shouldRemovePublicProfileAvatar,
  validateProfileAvatarFile,
} from "./public-profile";

function createProfileFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  const values = {
    displayName: "Enzo Chevalier",
    headline: "Étudiant M2 Cybersécurité",
    bio: "Portfolio technique autour de projets cybersécurité et fullstack.",
    contactEmail: "ENZO@example.com",
    githubUrl: "https://github.com/SiBlue7",
    linkedinUrl: "",
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("parsePublicProfileFormData", () => {
  it("parses public profile values", () => {
    const result = parsePublicProfileFormData(createProfileFormData());

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        displayName: "Enzo Chevalier",
        headline: "Étudiant M2 Cybersécurité",
        bio: "Portfolio technique autour de projets cybersécurité et fullstack.",
        contactEmail: "enzo@example.com",
        githubUrl: "https://github.com/SiBlue7",
        linkedinUrl: null,
      });
    }
  });

  it("rejects missing required values and invalid urls", () => {
    const result = parsePublicProfileFormData(
      createProfileFormData({
        displayName: "",
        contactEmail: "not-an-email",
        githubUrl: "not-an-url",
      }),
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;

      expect(errors.displayName?.[0]).toBe("Le nom affiché est obligatoire.");
      expect(errors.contactEmail?.[0]).toBe(
        "L'e-mail de contact doit être valide.",
      );
      expect(errors.githubUrl?.[0]).toBe(
        "Le lien GitHub doit être une URL valide.",
      );
    }
  });

  it("validates avatar uploads", () => {
    const avatar = new File(["avatar"], "avatar.png", {
      type: "image/png",
    });

    const result = validateProfileAvatarFile(avatar);

    expect(result).toEqual({
      success: true,
      data: avatar,
    });
  });

  it("rejects invalid avatar mime types", () => {
    const avatar = new File(["avatar"], "avatar.svg", {
      type: "image/svg+xml",
    });

    const result = validateProfileAvatarFile(avatar);

    expect(result).toEqual({
      success: false,
      error: "L'avatar doit être une image JPG, PNG ou WebP.",
    });
  });

  it("extracts avatar controls from form data", () => {
    const formData = createProfileFormData();
    const avatar = new File(["avatar"], "avatar.webp", {
      type: "image/webp",
    });
    formData.set("avatar", avatar);
    formData.set("removeAvatar", "on");

    expect(getPublicProfileAvatarFile(formData)).toBe(avatar);
    expect(shouldRemovePublicProfileAvatar(formData)).toBe(true);
  });
});
