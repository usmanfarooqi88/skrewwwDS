import { expect, test } from "@playwright/test";

test.describe("Avatar browser behavior", () => {
  test("falls back from broken image to initials", async ({ page }) => {
    await page.goto("/components/avatar");
    await page.getByText("Broken image fallback").scrollIntoViewIfNeeded();
    const fallback = page.locator('[data-fallback="initials"]').filter({ hasText: "UF" });
    await expect(fallback).toBeVisible({ timeout: 10000 });
    await expect(fallback.locator("img")).toHaveCount(0);
  });
});
