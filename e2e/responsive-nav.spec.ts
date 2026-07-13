import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile-narrow", width: 320, height: 640 },
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test.describe(`Responsive docs layout (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("component page has no horizontal overflow and visible H1", async ({ page }) => {
      await page.goto("/components/date-picker");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      expect(overflow).toBe(true);
      await expect(page.getByRole("heading", { level: 1, name: "Date Picker" })).toBeVisible();
    });
  });
}

test.describe("Mobile drawer navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("opens labelled drawer, navigates, closes, and restores menu focus", async ({ page }) => {
    await page.goto("/components/select");
    const menu = page.getByRole("button", { name: "Open documentation menu" });
    await menu.click();
    const drawer = page.getByRole("dialog", { name: "Documentation navigation" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Date Picker" }).click();
    await expect(page).toHaveURL(/\/components\/date-picker$/);
    await expect(drawer).toHaveCount(0);
    await expect(menu).toBeFocused();
  });

  test("does not expose visible desktop sidebar landmark on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("aside")).toBeHidden();
  });
});

test.describe("Desktop sidebar navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows fixed sidebar and hides mobile menu trigger", async ({ page }) => {
    await page.goto("/components/button");
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open documentation menu" })).toHaveCount(0);
  });
});
