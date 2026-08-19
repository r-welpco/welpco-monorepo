import { expect, test, type Page } from "@playwright/test";

import { loginAndNavigateToDashboard } from "../helpers/test-helpers";

const WELPER_ID = "8a8a8a8a-1111-4222-8333-123456789abc";

const publicProfile = {
  id: "profile-trust-signals",
  welperId: WELPER_ID,
  displayName: "Jean G.",
  firstName: "Jean",
  lastName: null,
  bio: "Reliable home cleaning help.",
  profilePhotoUrl: null,
  serviceArea: null,
  serviceAreaInfo: {
    city: "Montréal",
    province: "QC",
    country: "CA",
    postalCodes: ["H2X"],
  },
  verified: true,
  isMinor: false,
  averageRating: 4.92,
  reviewCount: 12,
  completedBookingsCount: 37,
  responseTimeMinutes: 23,
  serviceOfferings: [],
  weeklyAvailability: {
    days: [false, false, false, false, false, false, false],
    adHocOnly: true,
  },
  handle: null,
  portfolioPhotos: [],
};

async function mockWelperSearch(page: Page) {
  await page.route("**/api/search/categories**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route("**/api/search/services**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [
          {
            welperId: WELPER_ID,
            name: "Jean G.",
            title: "Cleaning",
            location: "Montréal, QC",
            hourlyRate: 42,
            categories: ["Cleaning"],
            profilePhotoUrl: null,
            rating: 4.92,
            reviewCount: 12,
            verified: true,
            isMinor: false,
            weeklyAvailability: publicProfile.weeklyAvailability,
          },
        ],
        total: 1,
        page: 1,
        limit: 12,
      }),
    });
  });

  await page.route(`**/api/search/welpers/${WELPER_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(publicProfile),
    });
  });

  await page.route(`**/api/reviews/welper/${WELPER_ID}**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0, page: 1, limit: 5 }),
    });
  });
}

test.describe("Welper profile trust signals", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
    await mockWelperSearch(page);
  });

  test("keeps rating and completed jobs visible after opening a search profile", async ({
    page,
  }) => {
    await page.goto("/dashboard/search?postalCode=H2X%201Y4");
    await page.getByRole("button", { name: /^view$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("4.92 · 12 reviews")).toBeVisible();
    await expect(dialog.getByText("37 jobs completed")).toBeVisible();
    await expect(dialog.getByLabel("Background check passed")).toBeVisible();
  });

  test("shows the same trust signals on the standalone public profile", async ({ page }) => {
    await page.goto(`/welper/${WELPER_ID}`);

    await expect(page.getByRole("heading", { name: "Jean G." })).toBeVisible();
    await expect(page.getByText(/4\.92/)).toBeVisible();
    await expect(page.getByText("37 jobs completed")).toBeVisible();
    await expect(page.getByLabel("Background check passed")).toBeVisible();
  });

  test("shows a neutral state when the welper has no verification badge", async ({
    page,
  }) => {
    await page.route(`**/api/search/welpers/${WELPER_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...publicProfile, verified: false }),
      });
    });

    await page.goto(`/welper/${WELPER_ID}`);

    await expect(page.getByRole("heading", { name: "Jean G." })).toBeVisible();
    await expect(page.getByLabel("No verification badge")).toBeVisible();
  });
});
