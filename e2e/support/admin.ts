import { expect, type Page, test } from "@playwright/test";

const missingAdminCredentialsMessage =
  "PLAYWRIGHT_ADMIN_IDENTIFIER and PLAYWRIGHT_ADMIN_PASSWORD are required.";

export function skipIfAdminCredentialsMissing() {
  test.skip(
    !process.env.PLAYWRIGHT_ADMIN_IDENTIFIER ||
      !process.env.PLAYWRIGHT_ADMIN_PASSWORD,
    missingAdminCredentialsMessage,
  );
}

export async function signInAsAdmin(page: Page) {
  const identifier = process.env.PLAYWRIGHT_ADMIN_IDENTIFIER;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

  if (!identifier || !password) {
    throw new Error(missingAdminCredentialsMessage);
  }

  await page.goto("/admin/login");
  await page.getByLabel("Pseudo ou adresse e-mail").fill(identifier);
  await page.locator("#admin-password").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: "Administration" }),
  ).toBeVisible();
}
