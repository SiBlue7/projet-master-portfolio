import { expect, test } from "@playwright/test";
import { signInAsAdmin, skipIfAdminCredentialsMissing } from "./support/admin";

test.describe("admin project management", () => {
  test("creates a manual public project and opens its admin and public pages", async ({
    page,
  }) => {
    skipIfAdminCredentialsMissing();

    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    const title = `Projet E2E ${suffix}`;
    const slug = `projet-e2e-${suffix}`;
    const shortDescription = "Projet cree par un parcours Playwright.";
    const description =
      "Ce projet sert a verifier le parcours de creation, la liste admin et la page publique.";

    await signInAsAdmin(page);
    await page.getByRole("link", { name: "Nouveau projet" }).click();

    await expect(page).toHaveURL(/\/admin\/projects$/);
    await expect(
      page.getByRole("heading", { name: "Gestion des projets" }),
    ).toBeVisible();

    const createForm = page.locator("form", {
      has: page.locator("#new-project-title"),
    });

    await createForm.locator("#new-project-title").fill(title);
    await createForm.locator("#new-project-slug").fill(slug);
    await createForm
      .locator("#new-project-shortDescription")
      .fill(shortDescription);
    await createForm.locator("#new-project-description").fill(description);
    await createForm.locator("#new-project-tags").selectOption("en-cours");
    await createForm.locator("#new-project-stacks").fill("Next.js, Prisma");
    await createForm.locator("#new-project-status").selectOption("IN_PROGRESS");
    await createForm.locator("#new-project-visibility").selectOption("PUBLIC");
    await createForm.locator("#new-project-startedAt").fill("2026-01-01");
    await createForm.locator("#new-project-endedAt").fill("2026-02-01");
    await createForm.getByRole("button", { name: /projet/i }).click();

    await expect(page.getByRole("status")).toBeVisible();

    await page
      .getByRole("link", { name: "Voir les projets existants" })
      .click();
    await expect(page).toHaveURL(/\/admin\/projects\/list$/);

    const createdProject = page.locator("article", { hasText: title });
    await expect(createdProject).toBeVisible();
    await expect(createdProject).toContainText(slug);
    await expect(createdProject).toContainText(shortDescription);

    await createdProject.getByRole("link").click();
    await expect(page).toHaveURL(/\/admin\/projects\/[^/]+$/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();

    const projectEditor = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Modifier le projet" }),
    });
    await expect(projectEditor.locator('input[name="slug"]')).toHaveValue(slug);

    await page.goto(`/projects/${slug}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText(shortDescription)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });
});
