import { expect, test } from "@playwright/test";

test.describe("List Item browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/list-item");
  });

  test("navigational row uses a real link", async ({ page }) => {
    const link = page.getByRole("link", { name: "Button Primary actions and" });
    await expect(link).toHaveAttribute("href", "/components/button");
  });

  test("action row receives keyboard activation", async ({ page }) => {
    const button = page.getByRole("button", { name: "Show archived components" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toBeFocused();
  });

  test("trailing action does not trigger a row-level action", async ({ page }) => {
    await page.getByRole("button", { name: "Download" }).click();
    await expect(page.getByRole("button", { name: "Download" })).toBeFocused();
  });
});
