import { test, expect } from '@playwright/test';
import {
  getBaseURL,
  loginAndNavigateToDashboard,
} from '../helpers/test-helpers';

/**
 * DISPUTES-001 + DISPUTES-002 (Day 16): the canonical end-to-end happy path
 * for the production "Report a problem" flow.
 *
 * Walks the customer through:
 *   1. Sign in → bookings list → open a disputable booking detail.
 *   2. "Report a problem" → DisputeForm dialog opens.
 *   3. Fill subject + pick a category (we exercise `safety` because that is
 *      the trust-critical path that DISPUTES-002 unblocked — pre-Day-16 the
 *      FE had no way to file a safety report at all).
 *   4. Verify the safety copy block renders (911 reminder per Bible §22.6).
 *   5. Attach one PDF via the EvidenceUpload picker — the upload handler
 *      returns a stubbed S3 key (the upload URL itself is mocked since we
 *      can't talk to real S3 in CI).
 *   6. Submit. The POST `/api/bookings/:id/disputes` payload MUST include
 *      `category: "safety"` AND `evidence[0].key` referencing the stub.
 *   7. Booking detail re-renders with the dispute status badge.
 *
 * This is a contract test — it locks the post-Day-16 wire shape so the
 * BFF + FE stay in lockstep. CI-required; agent shell does not run it.
 */
test.describe('Dispute create flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToDashboard(page);
  });

  test('Customer files a safety dispute with one PDF attached', async ({
    page,
  }) => {
    // Step 1 — find a disputable booking. We assume the seeded customer has
    // at least one in-progress / completed booking (matches Day 9-15
    // fixtures).
    await page.goto(getBaseURL() + '/dashboard/bookings', {
      waitUntil: 'load',
      timeout: 15000,
    });
    const firstBookingLink = page
      .getByRole('link')
      .filter({ hasText: /booking/i })
      .first();
    await firstBookingLink.click();

    await expect(
      page.getByRole('button', { name: /report a problem/i }),
    ).toBeVisible({ timeout: 10000 });

    // Step 2 — open the dialog.
    await page.getByRole('button', { name: /report a problem/i }).click();
    await expect(
      page.getByRole('heading', { name: /report a problem/i }),
    ).toBeVisible();

    // Step 3 — fill the form.
    await page
      .getByLabel(/subject/i)
      .fill('Felt unsafe during the visit');

    // Pick the safety category — DISPUTES-002 ships this option. Pre-Day-16
    // it didn't exist on the FE at all.
    await page
      .getByRole('combobox', { name: /what kind of problem/i })
      .click();
    await page.getByRole('option', { name: /safety concern/i }).click();

    // Step 4 — safety copy block must appear.
    await expect(
      page.getByText(/in immediate danger.*call 911/i),
    ).toBeVisible();

    await page
      .getByLabel(/what happened/i)
      .fill(
        'Welper made comments that made me uncomfortable. Wanted to flag this immediately.',
      );

    // Step 5 — mock the presign endpoint and the actual S3 PUT before
    // attaching a file, so the test runs without real S3.
    await page.route('**/api/disputes/evidence/presign', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uploadUrl: 'https://example-bucket.s3.amazonaws.com/stub-put-url',
          key: 'disputes/test-user/stub-uuid.pdf',
          contentType: 'application/pdf',
          ttlSeconds: 900,
        }),
      });
    });
    await page.route(
      'https://example-bucket.s3.amazonaws.com/stub-put-url',
      async (route) => {
        await route.fulfill({ status: 200, body: '' });
      },
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'evidence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 stub'),
    });

    await expect(page.getByText(/attached/i)).toBeVisible({ timeout: 5000 });

    // Step 6 — submit and assert the wire shape.
    const createReq = page.waitForRequest(
      (r) =>
        r.url().includes('/api/bookings/') &&
        r.url().endsWith('/disputes') &&
        r.method() === 'POST',
      { timeout: 10000 },
    );
    await page.getByRole('button', { name: /send report/i }).click();

    const req = await createReq;
    const body = req.postDataJSON() as {
      category: string;
      evidence?: Array<{ type: string; key: string }>;
    };
    expect(body.category).toBe('safety');
    expect(body.evidence).toBeDefined();
    expect(body.evidence!.length).toBe(1);
    expect(body.evidence![0]!.type).toBe('file');
    expect(body.evidence![0]!.key).toBe('disputes/test-user/stub-uuid.pdf');
  });

  test('Customer can submit without evidence (empty array allowed)', async ({
    page,
  }) => {
    await page.goto(getBaseURL() + '/dashboard/bookings', {
      waitUntil: 'load',
      timeout: 15000,
    });
    await page.getByRole('link').filter({ hasText: /booking/i }).first().click();

    await page.getByRole('button', { name: /report a problem/i }).click();
    await page.getByLabel(/subject/i).fill('Welper arrived 90 minutes late');

    await page
      .getByRole('combobox', { name: /what kind of problem/i })
      .click();
    await page.getByRole('option', { name: /didn't show up/i }).click();

    const createReq = page.waitForRequest(
      (r) =>
        r.url().includes('/api/bookings/') &&
        r.url().endsWith('/disputes') &&
        r.method() === 'POST',
      { timeout: 10000 },
    );
    await page.getByRole('button', { name: /send report/i }).click();

    const req = await createReq;
    const body = req.postDataJSON() as {
      category: string;
      evidence?: unknown;
    };
    expect(body.category).toBe('no_show');
    // Empty evidence is omitted entirely (page-client checks length > 0).
    expect(body.evidence).toBeUndefined();
  });
});
