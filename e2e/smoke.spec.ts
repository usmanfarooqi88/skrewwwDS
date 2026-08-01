import { expect, test } from "./fixtures";

test.describe("Site smoke", () => {
  test("homepage loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("component documentation page loads", async ({ page }) => {
    await page.goto("/components/tooltip");
    await expect(page.getByRole("heading", { level: 1, name: "Tooltip" })).toBeVisible();
  });

  test("tooltip opens on focus and closes with Escape", async ({ page }) => {
    await page.goto("/components/tooltip");
    const trigger = page.getByRole("button", { name: "Save" });
    await trigger.focus();
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Save changes");
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
  });

  test("keyboard focus remains visible on interactive controls", async ({ page }) => {
    await page.goto("/components/link");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});

test.describe("Dialog browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/dialog");
  });

  test("opens from trigger and traps focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(page.getByRole("button", { name: "Close dialog" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(page.getByRole("button", { name: "Close dialog" })).toBeFocused();
  });

  test("closes with Escape and restores trigger focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open dialog" });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("locks body scroll while open", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog" }).click();
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe("hidden");
  });

  test("closes from close button", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog" }).click();
    await page.getByRole("button", { name: "Close dialog" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("long dialog content scrolls inside viewport", async ({ page }) => {
    await page.getByRole("button", { name: "Open scrolling dialog" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Paragraph 12.")).toBeVisible();
  });

  test("remains usable at narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
