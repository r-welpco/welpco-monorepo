import { expect, test, type Page } from '@playwright/test';
import { getBaseURL, loginAndNavigateToDashboard } from '../helpers/test-helpers';

const BOOKING_ID = 'payment-authorization-e2e';
const WELPER_ID = 'payment-authorization-welper';

type PaymentPhase = 'scheduled' | 'requires_action' | 'canceled' | 'failed';

async function currentUserId(page: Page): Promise<string> {
  const session = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session');
    return response.json() as Promise<{ user?: { id?: string } }>;
  });
  if (!session.user?.id) throw new Error('The E2E customer session has no user ID');
  return session.user.id;
}

async function renderPaymentState(
  page: Page,
  options: {
    paymentPhase: PaymentPhase;
    failureCode?: string | null;
    cancelledAt?: string | null;
    cancellationSource?: string | null;
    cancellationReason?: string | null;
  },
): Promise<void> {
  const customerId = await currentUserId(page);
  const now = new Date();
  const scheduled = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const due = new Date(scheduled.getTime() - 72 * 60 * 60 * 1000);
  const deadline = new Date(scheduled.getTime() - 24 * 60 * 60 * 1000);
  const date = scheduled.toISOString().slice(0, 10);

  await page.route(`**/api/bookings/${BOOKING_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: BOOKING_ID,
        customerId,
        welperId: WELPER_ID,
        serviceOfferingId: 'offering-e2e',
        status: options.cancelledAt ? 'cancelled' : 'accepted',
        answers: {},
        scheduledDate: date,
        scheduledStartTime: '15:00',
        scheduledEndTime: '17:00',
        durationMinutes: 120,
        timezoneName: 'America/Toronto',
        hourlyRate: 56.25,
        totalPrice: 129.35,
        address: null,
        notes: null,
        cancellationReason: options.cancellationReason ?? null,
        cancellationSource: options.cancellationSource ?? null,
        cancellationFeeCents: 0,
        declineReason: null,
        acceptedAt: now.toISOString(),
        declinedAt: null,
        cancelledAt: options.cancelledAt ?? null,
        checkedInAt: null,
        checkedOutAt: null,
        completedAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        availableActions: [],
        paymentPhase: options.paymentPhase,
        paymentAuthorizationStatus: options.paymentPhase,
        paymentAuthorizationDueAt: due.toISOString(),
        paymentAuthorizationDeadlineAt: deadline.toISOString(),
        paymentAuthorizationFailureCode: options.failureCode ?? null,
        paymentAuthorizationFailureMessage: null,
        serviceReceipt: null,
      }),
    });
  });
  await page.route('**/api/profiles/me', async (route) => {
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.route(`**/api/service-discovery/welpers/${WELPER_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: WELPER_ID,
        firstName: 'Test',
        lastName: 'Welper',
        serviceOfferings: [],
      }),
    });
  });

  await page.goto(`${getBaseURL()}/dashboard/bookings/${BOOKING_ID}`, {
    waitUntil: 'domcontentloaded',
  });
}

test.describe('Booking payment authorization states', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('explains a scheduled authorization and payment deadline', async ({ page }) => {
    await renderPaymentState(page, { paymentPhase: 'scheduled' });

    await expect(page.getByText(/authorization hold three days before service/i)).toBeVisible();
    await expect(page.getByText(/booking will be cancelled without a fee/i)).toBeVisible();
  });

  const recoveryStates = [
    {
      name: 'failed automatic authorization',
      paymentPhase: 'failed' as const,
      failureCode: 'card_declined',
      message: /automatic card authorization failed/i,
    },
    {
      name: '3DS action required',
      paymentPhase: 'requires_action' as const,
      failureCode: 'payment_requires_action',
      message: /needs additional authentication/i,
    },
    {
      name: 'canceled hold',
      paymentPhase: 'canceled' as const,
      failureCode: 'requested_by_customer',
      message: /card authorization was cancelled/i,
    },
    {
      name: 'expired hold',
      paymentPhase: 'canceled' as const,
      failureCode: 'authorization_expired',
      message: /card authorization expired/i,
    },
  ];

  for (const scenario of recoveryStates) {
    test(`shows customer recovery for ${scenario.name}`, async ({ page }) => {
      await renderPaymentState(page, scenario);

      await expect(page.getByText(scenario.message)).toBeVisible();
      await expect(page.getByRole('button', { name: /authorize payment/i })).toBeVisible();
    });
  }

  test('shows a no-fee payment-deadline cancellation', async ({ page }) => {
    await renderPaymentState(page, {
      paymentPhase: 'canceled',
      failureCode: 'authorization_deadline_passed',
      cancelledAt: new Date().toISOString(),
      cancellationSource: 'payment_authorization_deadline',
      cancellationReason: 'Payment authorization was not completed before the service deadline',
    });

    await expect(
      page.getByText(/cancelled without a fee because payment authorization was not completed/i),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /authorize payment/i })).toHaveCount(0);
  });
});
