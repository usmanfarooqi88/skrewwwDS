import { expect, test } from "@playwright/test";

test.describe("Accordion browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/accordion");
  });

  test("activates trigger with keyboard and keeps focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "What is Skrewww?" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press(" ");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("region", { name: "What is Skrewww?" })).toBeVisible();
  });

  test("toggles panel visibility in single mode", async ({ page }) => {
    await page.getByRole("button", { name: "Should primary docs live here?" }).click();
    await expect(page.getByRole("region", { name: "Should primary docs live here?" })).toBeVisible();
    await expect(page.getByRole("button", { name: "What is Skrewww?" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("supports multiple expansion", async ({ page }) => {
    await page.getByRole("heading", { name: "Multiple expansion" }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Section B" }).click();
    await expect(page.getByRole("region", { name: "Section A" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Section B" })).toBeVisible();
  });
});
