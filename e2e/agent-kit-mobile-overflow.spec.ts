import { expect, test } from "./fixtures";

// Long unbreakable inline code (URLs, slash-separated variant lists) must wrap
// instead of widening the document on phone viewports.
const WIDTHS = [320, 360, 375, 390, 430];

async function documentWidths(page: import("@playwright/test").Page) {
  return page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
}

test.describe("mobile horizontal overflow", () => {
  for (const width of WIDTHS) {
    test(`Agent Kit does not scroll horizontally at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto("/agent-kit");

      const widths = await documentWidths(page);
      expect(widths.document).toBeLessThanOrEqual(widths.viewport);

      // The long contract URL wraps inside its container and stays fully present.
      const url = page.locator("code", { hasText: "/agent/contracts/button.json" }).first();
      await expect(url).toBeVisible();
      const box = await url.evaluate((element) => {
        const lines = Array.from(element.getClientRects());
        return { lines: lines.length, maxRight: Math.max(...lines.map((r) => r.right)) };
      });
      expect(box.maxRight).toBeLessThanOrEqual(width);
    });
  }

  test("Button documentation does not scroll horizontally at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto("/components/button");

    const widths = await documentWidths(page);
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  });

  test("Guard code helper keeps the same wrapping behaviour at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto("/guard");

    const widths = await documentWidths(page);
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  });
});
