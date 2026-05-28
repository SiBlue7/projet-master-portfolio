import { expect, test } from "@playwright/test";
import { signInAsAdmin, skipIfAdminCredentialsMissing } from "./support/admin";

const protectedAdminRoutes = [
  "/admin",
  "/admin/projects",
  "/admin/projects/list",
  "/admin/profile",
  "/admin/profile/timeline",
  "/admin/logs",
];

test.describe("admin access control", () => {
  for (const route of protectedAdminRoutes) {
    test(`redirects unauthenticated visitors from ${route}`, async ({
      page,
    }) => {
      await page.goto(route);

      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(
        page.getByRole("heading", { name: "Connexion administrateur" }),
      ).toBeVisible();
    });
  }

  test("allows an administrator to log in and sign out", async ({ page }) => {
    skipIfAdminCredentialsMissing();

    await signInAsAdmin(page);
    await expect(
      page.getByRole("link", { name: "Nouveau projet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Tous les projets" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /connecter/i }).click();

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: "Connexion administrateur" }),
    ).toBeVisible();
  });
});
