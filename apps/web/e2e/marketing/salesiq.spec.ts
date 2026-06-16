import { expect, type Page, test } from '@playwright/test';

const INIT_SCRIPT_ID = 'welpco-zoho-salesiq-init';
const LOADER_SCRIPT_ID = 'welpco-zoho-salesiq-loader';

const salesIqEnabled =
  process.env.NEXT_PUBLIC_ZOHO_SALESIQ_ENABLED === 'true' &&
  Boolean(process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_CODE) &&
  Boolean(process.env.NEXT_PUBLIC_ZOHO_SALESIQ_SCRIPT_SRC);

async function expectNoSalesIQScripts(page: Page) {
  await expect(page.locator(`script#${INIT_SCRIPT_ID}`)).toHaveCount(0);
  await expect(page.locator(`script#${LOADER_SCRIPT_ID}`)).toHaveCount(0);
}

test.describe('Zoho SalesIQ disabled', () => {
  test.skip(salesIqEnabled, 'Disabled-mode assertions require SalesIQ env vars to be absent or disabled.');

  test('does not render SalesIQ scripts on public marketing pages', async ({ page }) => {
    await page.goto('/en/contact', { waitUntil: 'domcontentloaded' });

    await expectNoSalesIQScripts(page);
  });

  test('does not render SalesIQ scripts outside marketing pages', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await expectNoSalesIQScripts(page);
  });
});

test.describe('Zoho SalesIQ enabled', () => {
  test.skip(!salesIqEnabled, 'Enabled-mode assertions require SalesIQ env vars to be configured.');

  test.beforeEach(async ({ page }) => {
    const scriptSrc = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_SCRIPT_SRC;
    if (!scriptSrc) return;

    await page.addInitScript(() => {
      const salesIqWindow = window as typeof window & {
        __welpcoSalesIqCalls?: unknown[];
      };

      salesIqWindow.__welpcoSalesIqCalls = [];
      salesIqWindow.$zoho = salesIqWindow.$zoho || {};
      salesIqWindow.$zoho.salesiq = salesIqWindow.$zoho.salesiq || {};
      salesIqWindow.$zoho.salesiq.visitor = {
        id: function id(value) {
          salesIqWindow.__welpcoSalesIqCalls?.push(['id', value]);
        },
        email: function email(value) {
          salesIqWindow.__welpcoSalesIqCalls?.push(['email', value]);
        },
        name: function name(value) {
          salesIqWindow.__welpcoSalesIqCalls?.push(['name', value]);
        },
        info: function info(value) {
          salesIqWindow.__welpcoSalesIqCalls?.push(['info', value]);
        },
      };
      salesIqWindow.$zoho.salesiq.language = function language(value) {
        salesIqWindow.__welpcoSalesIqCalls?.push(['language', value]);
      };
      salesIqWindow.$zoho.salesiq.reset = function reset() {
        salesIqWindow.__welpcoSalesIqCalls?.push(['reset']);
      };
    });

    const scriptUrl = new URL(scriptSrc);
    await page.route(`**${scriptUrl.pathname}`, async (route) => {
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
          window.__welpcoSalesIqCalls = window.__welpcoSalesIqCalls || [];
          window.$zoho = window.$zoho || {};
          window.$zoho.salesiq = window.$zoho.salesiq || {};
          window.$zoho.salesiq.visitor = {
            id: function(value) { window.__welpcoSalesIqCalls.push(['id', value]); },
            email: function(value) { window.__welpcoSalesIqCalls.push(['email', value]); },
            name: function(value) { window.__welpcoSalesIqCalls.push(['name', value]); },
            info: function(value) { window.__welpcoSalesIqCalls.push(['info', value]); }
          };
          window.$zoho.salesiq.language = function(value) {
            window.__welpcoSalesIqCalls.push(['language', value]);
          };
          window.$zoho.salesiq.reset = function() {
            window.__welpcoSalesIqCalls.push(['reset']);
          };
          window.$zoho.salesiq.ready && window.$zoho.salesiq.ready();
        `,
      });
    });
  });

  test('renders one init script and one loader script on public marketing pages', async ({ page }) => {
    await page.goto('/en/contact', { waitUntil: 'domcontentloaded' });

    await expect(page.locator(`script#${INIT_SCRIPT_ID}`)).toHaveCount(1);
    await expect(page.locator(`script#${LOADER_SCRIPT_ID}`)).toHaveCount(1);
  });

  test('does not render SalesIQ scripts outside marketing pages', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    await expectNoSalesIQScripts(page);
  });

  test('passes only approved signed-in identity fields', async ({ page }) => {
    await page.route('**/api/auth/session', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          expires: '2099-01-01T00:00:00.000Z',
          accessToken: 'redacted-test-token',
          user: {
            id: 'user_test_123',
            email: 'customer@example.test',
            name: 'Ada Lovelace',
            role: 'customer',
          },
        }),
      });
    });

    await page.goto('/en/contact', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            return (window as typeof window & { __welpcoSalesIqCalls?: unknown[] })
              .__welpcoSalesIqCalls;
          }),
        { timeout: 10000 }
      )
      .toEqual(
        expect.arrayContaining([
          ['id', 'user_test_123'],
          ['email', 'customer@example.test'],
          ['name', { firstname: 'Ada', lastname: 'Lovelace', salutation: 'None' }],
          ['info', { welpcoRole: 'customer' }],
        ])
      );

    const calls = await page.evaluate(() => {
      return (window as typeof window & { __welpcoSalesIqCalls?: unknown[] })
        .__welpcoSalesIqCalls ?? [];
    });
    expect(JSON.stringify(calls)).not.toContain('redacted-test-token');
  });

  test('resets stale visitor identity for signed-out visitors', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('welpco:salesiq:identified', 'true');
    });

    await page.goto('/en/contact', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(
        () =>
          page.evaluate(() => {
            return (window as typeof window & { __welpcoSalesIqCalls?: unknown[] })
              .__welpcoSalesIqCalls;
          }),
        { timeout: 10000 }
      )
      .toEqual(expect.arrayContaining([['reset']]));

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('welpco:salesiq:identified')))
      .toBeNull();
  });
});
