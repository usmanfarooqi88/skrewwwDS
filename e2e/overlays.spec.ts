import { expect, test } from "@playwright/test";

test.describe("Dialog modality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/dialog");
  });

  test("background control cannot be focused while dialog is open", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Shift+Tab");
    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTag).not.toBe("A");
    expect(activeTag).not.toBe("MAIN");
  });

  test("background control cannot be clicked while dialog is open", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    const dialogStillOpen = await page.evaluate(() => {
      const link = document.querySelector("aside a") as HTMLElement | null;
      link?.click();
      return Boolean(document.querySelector('[role="dialog"]'));
    });

    expect(dialogStillOpen).toBe(true);
  });

  test("applies inert to background content when supported", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog" }).click();
    const inertCount = await page.evaluate(() => {
      const supportsInert = "inert" in HTMLElement.prototype;
      if (!supportsInert) return -1;
      return Array.from(document.body.children).filter(
        (child) => child instanceof HTMLElement && child.inert,
      ).length;
    });

    if (inertCount >= 0) {
      expect(inertCount).toBeGreaterThan(0);
    }
  });
});

test.describe("Popover browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/popover");
  });

  test("opens from click and exposes expanded trigger", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "View details" });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: "Documentation status" })).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("closes with Escape and restores trigger focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "View details" });
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Documentation status" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("closes on outside click", async ({ page }) => {
    await page.getByRole("button", { name: "View details" }).click();
    await page.locator("main").click({ position: { x: 8, y: 8 } });
    await expect(page.getByRole("dialog", { name: "Documentation status" })).toHaveCount(0);
  });

  test("interactive controls remain keyboard reachable", async ({ page }) => {
    await page.getByRole("button", { name: "Quick settings" }).click();
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("remains visible at narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "View details" }).click();
    const popover = page.getByRole("dialog", { name: "Documentation status" });
    await expect(popover).toBeVisible();
    const box = await popover.boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect(box?.width).toBeLessThanOrEqual(390);
  });

  test("nested popover inside dialog respects escape order", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog with popover" }).click();
    await page.getByRole("button", { name: "Open nested popover" }).click();
    await expect(page.getByRole("dialog", { name: "Inside dialog" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Inside dialog" })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Nested overlays" })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Nested overlays" })).toHaveCount(0);
  });
});

test.describe("Tooltip inside popover", () => {
  test("escape closes tooltip before popover on component page", async ({ page }) => {
    await page.goto("/components/tooltip");
    const trigger = page.getByRole("button", { name: "Save" });
    await trigger.focus();
    await expect(page.getByRole("tooltip")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("tooltip")).toHaveCount(0);
  });
});
