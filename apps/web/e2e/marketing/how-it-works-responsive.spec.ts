import { expect, test } from "@playwright/test";

test.describe("How it works responsive layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/how-it-works", { waitUntil: "domcontentloaded" });
  });

  test("keeps mobile content in the viewport and both photo galleries swipeable", async ({
    page,
  }) => {
    await expect(page.getByText("What it takes to join the community.")).toBeVisible();

    const pageWidths = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      document: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(pageWidths.body).toBeLessThanOrEqual(pageWidths.viewport);
    expect(pageWidths.document).toBeLessThanOrEqual(pageWidths.viewport);

    const grids = page.locator('[data-grid="howitworks-page-grid"]');
    await expect(grids).toHaveCount(1);
    const howItWorksGrid = await grids.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
    expect(howItWorksGrid.scrollWidth).toBeLessThanOrEqual(howItWorksGrid.clientWidth);

    const galleries = page.locator("[data-marketing-image-gallery]");
    await expect(galleries).toHaveCount(2);
    const galleryWidths = await galleries.evaluateAll((elements) =>
      elements.map((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: getComputedStyle(element).overflowX,
      })),
    );
    for (const gallery of galleryWidths) {
      expect(gallery.overflowX).toBe("auto");
      expect(gallery.scrollWidth).toBeGreaterThan(gallery.clientWidth);
    }
  });

  test("places the Set your rates photo gallery below its copy on phones", async ({
    page,
  }) => {
    const copy = page.locator("[data-become-welper-copy]");
    const media = page.locator("[data-become-welper-media]");

    await expect(copy).toBeVisible();
    await expect(media).toBeVisible();

    const copyBox = await copy.boundingBox();
    const mediaBox = await media.boundingBox();
    expect(copyBox).not.toBeNull();
    expect(mediaBox).not.toBeNull();
    expect(mediaBox!.y).toBeGreaterThanOrEqual(copyBox!.y + copyBox!.height);
  });
});
