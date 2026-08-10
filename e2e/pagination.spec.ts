import { expect, test } from "./fixtures";

test.describe("Pagination browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/pagination");
  });

  // Regression check for a real CSS specificity bug: [data-skrewww-surface="glass"]
  // .control (specificity 0,2,0) silently beat .current's own background rule
  // (specificity 0,1,0), collapsing the current-page indicator into the same
  // translucent fill as every other page control in Glass mode. Value-independent
  // by design — asserts the current control's background stays visually distinct
  // from a non-current control's, without hardcoding either resolved color.
  test("current-page control keeps a distinct background from other controls in Glass mode", async ({
    page,
  }) => {
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-skrewww-surface", "glass");
    });

    // Scoped to the Pagination component itself — the docs sidebar also
    // marks its own "current page" nav link with aria-current="page", and
    // an unscoped [aria-current="page"] locator matches that one first.
    const nav = page.locator('nav[aria-label="Pagination"]').first();
    const current = nav.locator('[aria-current="page"]').first();
    const other = nav.getByRole("link", { name: /^Page \d+$/ }).first();

    await expect(current).toBeVisible();
    await expect(other).toBeVisible();

    const [currentBackground, otherBackground] = await Promise.all([
      current.evaluate((el) => getComputedStyle(el).backgroundColor),
      other.evaluate((el) => getComputedStyle(el).backgroundColor),
    ]);

    expect(currentBackground).not.toBe(otherBackground);
  });
});
