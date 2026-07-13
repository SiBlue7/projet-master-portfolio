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
        page.getByRole("heading", { name: /Espace\s+administrateur\./ }),
      ).toBeVisible();
    });
  }

  test("allows an administrator to log in and sign out", async ({ page }) => {
    skipIfAdminCredentialsMissing();

    await signInAsAdmin(page);
    await expect(
      page.getByRole("link", { name: "Créer un projet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Liste des projets" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "exit" }).click();

    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByRole("heading", { name: /Espace\s+administrateur\./ }),
    ).toBeVisible();
  });
});
