import { expect, test } from "@playwright/test";

test.describe("healthcheck", () => {
  test("exposes a JSON payload for automated checks", async ({ request }) => {
    const response = await request.get("/api/health?format=json");

    expect(response.ok()).toBe(true);

    const payload = (await response.json()) as {
      environment?: unknown;
      status?: unknown;
      timestamp?: unknown;
      uptime?: unknown;
    };

    expect(payload.status).toBe("ok");
    expect(typeof payload.environment).toBe("string");
    expect(typeof payload.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(String(payload.timestamp)))).toBe(false);
    expect(typeof payload.uptime).toBe("number");
  });

  test("renders a readable status page for browser access", async ({
    page,
  }) => {
    await page.goto("/api/health");

    await expect(
      page.getByRole("heading", { name: "Application disponible" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voir le JSON" }),
    ).toBeVisible();
  });

  test("lets a visitor switch from the health page to the JSON payload", async ({
    page,
  }) => {
    await page.goto("/api/health");
    await page.getByRole("link", { name: "Voir le JSON" }).click();

    await expect(page).toHaveURL(/\/api\/health\?format=json$/);
    await expect(page.locator("body")).toContainText('"status":"ok"');
  });
});
