import { test, expect } from "@playwright/test";

test.describe("French auth locale", () => {
  test("login page shows French copy at /fr/login", async ({ page }) => {
    await page.goto("/fr/login", { waitUntil: "load" });
    await expect(page.getByRole("heading", { name: /bon retour/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /se connecter/i })).toBeVisible();
  });
});
