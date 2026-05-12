import type { TestRunnerConfig } from "@storybook/test-runner";
import { getStoryContext } from "@storybook/test-runner";
import { injectAxe, checkA11y } from "axe-playwright";

/**
 * Runs axe-core against every story via the Storybook test-runner.
 *
 * WCAG 2.1 AA is the merge gate (ui-ux-bible.md §21.1). A story can opt out of
 * a specific rule by setting:
 *
 *   parameters: {
 *     a11y: {
 *       config: { rules: [{ id: "rule-id", enabled: false }] },
 *     },
 *   }
 *
 * on its meta. Honour `parameters.a11y.disable === true` to skip the story entirely.
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    // Guard against double-injection — storybook test-runner can retry a
    // story visit on "navigation" errors, which otherwise races the previous
    // axe instance and produces spurious "Axe is already running" errors.
    const alreadyInjected = await page.evaluate(() => typeof (globalThis as any).axe !== "undefined");
    if (!alreadyInjected) {
      await injectAxe(page);
    }
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context);
    const a11yParams = (storyContext.parameters?.a11y ?? {}) as {
      disable?: boolean;
      config?: { rules?: Array<{ id: string; enabled?: boolean }> };
    };
    if (a11yParams.disable === true) return;

    // Translate the Storybook a11y-addon array format into axe-core's
    // object-shaped `rules` map so per-story opt-outs actually land.
    const ruleOverrides: Record<string, { enabled: boolean }> = {};
    for (const rule of a11yParams.config?.rules ?? []) {
      if (typeof rule.enabled === "boolean") {
        ruleOverrides[rule.id] = { enabled: rule.enabled };
      }
    }

    // If a previous axe run is still in flight (test-runner retries can race
    // into this handler), drain it before starting ours. Without this guard,
    // flaky stories (tooltip, popover, table, radio group) intermittently
    // fail with "Axe is already running" — no real a11y violation.
    await page.evaluate(async () => {
      const axe = (globalThis as { axe?: { _running?: boolean } }).axe;
      if (!axe?._running) return;
      // poll until the previous run resolves; bounded so we don't hang
      const start = Date.now();
      while (axe._running && Date.now() - start < 5000) {
        await new Promise((r) => setTimeout(r, 50));
      }
    });

    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: { html: false },
      axeOptions: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
        rules: ruleOverrides,
      },
    });
  },
};

export default config;
