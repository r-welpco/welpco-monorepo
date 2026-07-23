import { expect, test } from "@playwright/test";

import { loginAndNavigateToDashboard } from "../helpers/test-helpers";

test.describe("Customer search routing", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAndNavigateToDashboard(page);
  });

  test("opens dashboard search from the homepage and keeps mobile navigation usable", async ({
    page,
  }) => {
    await page.goto("/en", { waitUntil: "domcontentloaded" });

    const findHelpLink = page.locator('[data-hero="immersive"] a.btn-accent');
    await expect(findHelpLink).toHaveAttribute("href", "/dashboard/search");
    await findHelpLink.click();

    await expect(page).toHaveURL(/\/dashboard\/search(?:\?.*)?$/);

    await page
      .getByRole("button", { name: /open navigation menu/i })
      .click();
    await page.getByRole("menuitem", { name: /^profile$/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/profile(?:\?.*)?$/);
  });

  test("redirects a public search bookmark without dropping its filters", async ({
    page,
  }) => {
    await page.goto("/search?q=cleaning&postalCode=H2X+1Y4", {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveURL(/\/dashboard\/search\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("q")).toBe("cleaning");
    expect(url.searchParams.get("postalCode")).toBe("H2X 1Y4");
  });
});
