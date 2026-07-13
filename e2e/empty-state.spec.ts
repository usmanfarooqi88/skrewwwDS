import { expect, test } from "@playwright/test";

test.describe("Empty State browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/empty-state");
  });

  test("does not move focus on initial render", async ({ page }) => {
    const activeTag = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());
    expect(activeTag).toBe("body");
  });

  test("keeps primary and secondary actions keyboard operable", async ({ page }) => {
    await page.getByRole("heading", { name: "No results and recovery" }).scrollIntoViewIfNeeded();
    const clearFilters = page.getByRole("button", { name: "Clear filters" });
    await clearFilters.focus();
    await expect(clearFilters).toBeFocused();
    const browse = page.getByRole("link", { name: "Browse components" });
    await browse.focus();
    await expect(browse).toBeFocused();
  });
});
