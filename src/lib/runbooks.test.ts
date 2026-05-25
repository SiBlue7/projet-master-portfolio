import { describe, expect, it } from "vitest";
import {
  parseRunbookEnvironmentFormData,
  parseRunbookFormData,
  parseRunbookStepFormData,
} from "./runbooks";

function createFormData(values: Record<string, string>) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, value);
  });

  return formData;
}

describe("runbook validation", () => {
  it("normalizes runbook slugs and checkbox values", () => {
    const result = parseRunbookFormData(
      createFormData({
        description: "Procédure de déploiement.",
        isActive: "on",
        isPublic: "on",
        slug: "Déploiement applicatif",
        sortOrder: "2",
        title: "Déploiement applicatif",
      }),
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        description: "Procédure de déploiement.",
        isActive: true,
        isPublic: true,
        slug: "deploiement-applicatif",
        sortOrder: 2,
        title: "Déploiement applicatif",
      });
    }
  });

  it("validates runbook environments", () => {
    const result = parseRunbookEnvironmentFormData(
      createFormData({
        baseUrl: "https://preprod.justdoeat.org",
        kind: "PREPROD",
        name: "Préproduction",
        slug: "Préproduction",
        sortOrder: "1",
      }),
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        baseUrl: "https://preprod.justdoeat.org",
        kind: "PREPROD",
        name: "Préproduction",
        slug: "preproduction",
        sortOrder: 1,
      });
    }
  });

  it("requires a command for command steps", () => {
    const result = parseRunbookStepFormData(
      createFormData({
        sortOrder: "0",
        title: "Relancer les conteneurs",
        type: "COMMAND",
      }),
    );

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.flatten().fieldErrors.command?.[0]).toBe(
        "La commande est obligatoire pour une étape de type commande.",
      );
    }
  });

  it("keeps executable HTTP steps with their method and URL", () => {
    const result = parseRunbookStepFormData(
      createFormData({
        environmentId: "environment-id",
        expectedResult: "Le statut est ok.",
        httpMethod: "GET",
        isExecutable: "on",
        sortOrder: "3",
        title: "Vérifier le healthcheck",
        type: "HTTP_REQUEST",
        url: "/api/health",
      }),
    );

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data).toEqual({
        command: null,
        description: null,
        environmentId: "environment-id",
        expectedResult: "Le statut est ok.",
        httpMethod: "GET",
        isExecutable: true,
        sortOrder: 3,
        title: "Vérifier le healthcheck",
        type: "HTTP_REQUEST",
        url: "/api/health",
      });
    }
  });
});
