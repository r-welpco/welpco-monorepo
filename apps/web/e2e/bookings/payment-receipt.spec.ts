import { expect, test, type Page } from "@playwright/test";
import { getBaseURL, loginAndNavigateToDashboard } from "../helpers/test-helpers";

const BOOKING_ID = "0f99b8df-3456-4e7f-9123-abcdef123456";
const WELPER_ID = "payment-receipt-welper";
const OFFERING_ID = "payment-receipt-offering";

async function currentUserId(page: Page): Promise<string> {
  const session = await page.evaluate(async () => {
    const response = await fetch("/api/auth/session");
    return response.json() as Promise<{ user?: { id?: string } }>;
  });
  if (!session.user?.id) throw new Error("The E2E customer session has no user ID");
  return session.user.id;
}

async function mockReceiptData(page: Page, paymentPhase: "captured" | "requires_action") {
  const customerId = await currentUserId(page);
  const confirmedAt = "2026-06-28T19:42:00.000Z";

  await page.route("**/api/service-questions/service/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  await page.route(`**/api/bookings/${BOOKING_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: BOOKING_ID,
        customerId,
        welperId: WELPER_ID,
        serviceOfferingId: OFFERING_ID,
        status: "payment_released",
        answers: {},
        scheduledDate: "2026-06-28",
        scheduledStartTime: "09:00",
        scheduledEndTime: "12:00",
        durationMinutes: 180,
        timezoneName: "America/Toronto",
        hourlyRate: 35,
        totalPrice: 135.65,
        address: null,
        notes: null,
        cancellationReason: null,
        declineReason: null,
        acceptedAt: "2026-06-20T15:00:00.000Z",
        declinedAt: null,
        cancelledAt: null,
        checkedInAt: "2026-06-28T13:00:00.000Z",
        checkedOutAt: "2026-06-28T16:00:00.000Z",
        completedAt: confirmedAt,
        createdAt: "2026-06-18T15:00:00.000Z",
        updatedAt: confirmedAt,
        availableActions: [],
        paymentPhase,
        customerFirstName: "Marie T.",
        serviceReceipt: {
          id: "receipt-e2e",
          bookingId: BOOKING_ID,
          billingCheckInAt: "2026-06-28T13:00:00.000Z",
          billingCheckOutAt: "2026-06-28T16:00:00.000Z",
          hourlyRate: 35,
          subtotalCents: 11799,
          taxCents: 1766,
          taxRateBps: 1497,
          totalCents: 13565,
          currency: "cad",
          notes: null,
          confirmedAt,
          sentToCustomerAt: confirmedAt,
          evidenceFiles: [],
        },
      }),
    });
  });

  await page.route("**/api/profiles/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "customer-profile-e2e",
        customerId,
        firstName: "Marie",
        lastName: "Tremblay",
        profileCompletionStatus: "COMPLETE",
      }),
    });
  });

  await page.route(`**/api/search/welpers/${WELPER_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: WELPER_ID,
        welperId: WELPER_ID,
        displayName: "Jean G.",
        firstName: "Jean",
        lastName: "Gagnon",
        bio: null,
        profilePhotoUrl: null,
        serviceArea: null,
        serviceAreaInfo: null,
        verified: true,
        isMinor: false,
        averageRating: null,
        reviewCount: 0,
        responseTimeMinutes: null,
        serviceOfferings: [
          {
            id: OFFERING_ID,
            serviceCategoryId: "cleaning",
            categoryName: "Cleaning",
            serviceDescription: "Home cleaning",
            hourlyRate: 35,
            experienceYears: 3,
          },
        ],
        weeklyAvailability: {},
      }),
    });
  });
}

test.describe("Customer payment receipt", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test("shows the download action only after payment capture", async ({ page }) => {
    await mockReceiptData(page, "captured");
    await page.goto(`${getBaseURL()}/dashboard/bookings/${BOOKING_ID}`);

    const link = page.getByRole("link", { name: /download receipt/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      `/dashboard/bookings/${BOOKING_ID}/receipt?print=1`,
    );
    await expect(link).toHaveAttribute("target", "_blank");

    await mockReceiptData(page, "requires_action");
    await page.reload();
    await expect(page.getByRole("link", { name: /download receipt/i })).toHaveCount(0);
  });

  test("renders authoritative values and automatically opens print", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "print", {
        configurable: true,
        value: () => {
          const target = window as typeof window & { __welpcoPrintCalls?: number };
          target.__welpcoPrintCalls = (target.__welpcoPrintCalls ?? 0) + 1;
        },
      });
    });
    await mockReceiptData(page, "captured");

    await page.goto(`${getBaseURL()}/dashboard/bookings/${BOOKING_ID}/receipt?print=1`);

    await expect(page.getByRole("heading", { name: "Payment receipt" })).toBeVisible();
    await expect(page.getByText("Marie Tremblay")).toBeVisible();
    await expect(page.getByText("Jean G.")).toBeVisible();
    await expect(page.getByText("$117.99")).toBeVisible();
    await expect(page.getByText("$17.66")).toBeVisible();
    await expect(page.getByText("$135.65")).toBeVisible();
    await expect(page.getByText("3 hr")).toBeVisible();
    const printButton = page.getByRole("button", { name: /print \/ save as pdf/i });
    await expect(printButton).toBeVisible();
    await expect.poll(
      () =>
        page.evaluate(
          () => (window as typeof window & { __welpcoPrintCalls?: number }).__welpcoPrintCalls ?? 0,
        ),
    ).toBe(1);

    await printButton.click();
    await expect.poll(
      () =>
        page.evaluate(
          () => (window as typeof window & { __welpcoPrintCalls?: number }).__welpcoPrintCalls ?? 0,
        ),
    ).toBe(2);
  });

  test("rejects a direct receipt view before payment is captured", async ({ page }) => {
    await mockReceiptData(page, "requires_action");
    await page.goto(`${getBaseURL()}/dashboard/bookings/${BOOKING_ID}/receipt`);

    await expect(page.getByRole("heading", { name: "Receipt unavailable" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Payment receipt" })).toHaveCount(0);
  });
});
