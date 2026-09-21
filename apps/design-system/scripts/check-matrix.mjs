import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { injectAxe } from 'axe-playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] ?? 'http://127.0.0.1:6006';
const directory = fileURLToPath(new URL('../test-results/design-matrix/', import.meta.url));
await mkdir(directory, { recursive: true });
const stories = [
  'components-button--default', 'components-button--disabled',
  'components-input--error', 'components-input--disabled',
  'components-dialog--mobile', 'components-dropdownmenu--default',
  'components-labeledslider--controlled-range', 'components-labeledslider--pointer-commit',
  'platform-usermanagement-loginform--default', 'platform-usermanagement-loginform--loading',
  'platform-bookingscheduling-bookingform--default',
  'platform-bookingscheduling-bookingcalendar--default',
  'platform-profilemanagement-availabilitycalendar--default',
  'platform-profilemanagement-profilephotocropdialog--zoom-and-confirm',
  'platform-profilemanagement-profilephotocropdialog--pending-dismissal-guard',
  'platform-servicediscovery-searchfilters--default',
  'platform-servicediscovery-searchfilterssidebar--panel',
  'platform-servicediscovery-welperprofilecard--default',
  'platform-reviewrating-ratingform--default',
  'platform-communication-chatinputinteractions--synchronous-failure',
];
const results = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const appearance of ['light', 'dark']) for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of stories) {
      await page.goto(`${url}/iframe.html?id=${id}&viewMode=story&globals=theme:${appearance}`);
      await page.locator('#storybook-root > *').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      // Story play functions and finite portal transitions run before inspection.
      await page.waitForFunction(() => {
        const preview = window.__STORYBOOK_PREVIEW__;
        return preview?.currentRender?.phase === 'finished';
      });
      await page.evaluate(async () => {
        await Promise.all(document.getAnimations()
          .filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})));
      });
      if (id === 'components-labeledslider--pointer-commit') {
        const thumb = page.getByRole('slider', { name: 'Search radius' });
        const bounds = await thumb.boundingBox();
        assert(bounds, 'Slider thumb must have pointer geometry');
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2, { steps: 5 });
        assert.equal(await page.getByLabel('Commit count').textContent(), '0', 'Dragging must not commit');
        await page.mouse.up();
        assert.equal(await page.getByLabel('Commit count').textContent(), '1', 'Release commits once');
        assert(Number(await thumb.getAttribute('aria-valuenow')) > 25, 'Pointer changes the controlled value');
      }
      await injectAxe(page);
      const result = await page.evaluate(async () => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        fontFamily: getComputedStyle(document.querySelector('.radix-themes')).fontFamily,
        violations: (await axe.run('body', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations
          .map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })),
      }));
      const name = `${id}-${appearance}-${width}`;
      await page.screenshot({ path: `${directory}/${name}.png`, fullPage: true });
      results.push({ id, appearance, width, ...result });
      console.log(`${result.overflow || result.violations.length ? 'FAIL' : 'PASS'} ${name}`);
    }
  }
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2));
}
if (results.some((r) => r.overflow || r.violations.length)) process.exitCode = 1;
