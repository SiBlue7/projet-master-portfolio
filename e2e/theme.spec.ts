import { expect, test } from "@playwright/test";

test.describe("theme preference", () => {
  test("switches between dark and light theme and keeps the preference", async ({
    page,
  }) => {
    await page.goto("/admin/login");

    await page.getByRole("button", { name: "Sombre" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByRole("button", { name: "Clair" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });
});
