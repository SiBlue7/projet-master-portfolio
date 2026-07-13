import { expect, test } from "@playwright/test";

test.describe("admin login", () => {
  test("displays the login form and toggles password visibility", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    await expect(
      page.getByRole("heading", { name: /Espace\s+administrateur\./ }),
    ).toBeVisible();

    const identifierInput = page.getByLabel("Pseudo ou adresse e-mail");
    await expect(identifierInput).toBeVisible();
    await expect(identifierInput).toHaveAttribute("autocomplete", "username");

    const passwordInput = page.locator("#admin-password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute(
      "autocomplete",
      "current-password",
    );

    await page
      .getByRole("button", { name: "Afficher le mot de passe" })
      .click();

    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(
      page.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toBeVisible();
  });
});
