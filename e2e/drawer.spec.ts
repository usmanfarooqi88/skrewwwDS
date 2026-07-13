import { expect, test } from "@playwright/test";

test.describe("Drawer browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/drawer");
  });

  test("opens from trigger with accessible name", async ({ page }) => {
    await page.getByRole("button", { name: "Open drawer", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Documentation settings" })).toBeVisible();
  });

  test("traps focus and closes with Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Open drawer", exact: true });
    await trigger.click();
    await expect(page.getByRole("button", { name: "Close drawer" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Documentation settings" })).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("background cannot be clicked while drawer is open", async ({ page }) => {
    await page.getByRole("button", { name: "Open drawer", exact: true }).click();
    const stillOpen = await page.evaluate(() => {
      const link = document.querySelector("aside a") as HTMLElement | null;
      link?.click();
      return Boolean(document.querySelector('[role="dialog"]'));
    });
    expect(stillOpen).toBe(true);
  });

  test("long body scrolls internally", async ({ page }) => {
    await page.getByRole("button", { name: "Open scrolling drawer" }).click();
    await expect(page.getByText("Token group 14.")).toBeVisible();
  });

  test("renders on left viewport edge", async ({ page }) => {
    await page.getByRole("button", { name: "Open drawer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Documentation settings" });
    const box = await drawer.boundingBox();
    expect(box?.x ?? 0).toBeLessThanOrEqual(8);
  });

  test("rounds exposed right corners while left edge stays flush", async ({ page }) => {
    await page.getByRole("button", { name: "Open drawer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Documentation settings" });
    const radii = await drawer.evaluate((panel) => {
      const styles = window.getComputedStyle(panel);
      return {
        topLeft: styles.borderTopLeftRadius,
        bottomLeft: styles.borderBottomLeftRadius,
        topRight: styles.borderTopRightRadius,
        bottomRight: styles.borderBottomRightRadius,
      };
    });
    expect(radii.topLeft).toBe("0px");
    expect(radii.bottomLeft).toBe("0px");
    expect(radii.topRight).not.toBe("0px");
    expect(radii.bottomRight).not.toBe("0px");
  });

  test("nested popover escape order", async ({ page }) => {
    await page.getByRole("button", { name: "Open drawer with popover" }).click();
    await page.getByRole("button", { name: "Open nested popover" }).click();
    await expect(page.getByRole("dialog", { name: "Inside drawer" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Inside drawer" })).toHaveCount(0);
    await expect(page.getByRole("dialog", { name: "Nested overlays" })).toBeVisible();
  });
});

test.describe("Popover positioning", () => {
  test("repositions while the page scrolls", async ({ page }) => {
    await page.goto("/components/popover");
    await page.evaluate(() => window.scrollTo(0, 240));
    await page.getByRole("button", { name: "View details" }).click();
    const popover = page.getByRole("dialog", { name: "Documentation status" });
    const before = await popover.boundingBox();
    await page.evaluate(() => window.scrollBy(0, 120));
    await page.waitForTimeout(150);
    const after = await popover.boundingBox();
    expect(after?.y).not.toBe(before?.y);
  });

  test("repositions on viewport resize", async ({ page }) => {
    await page.goto("/components/popover");
    await page.getByRole("button", { name: "View details" }).click();
    const popover = page.getByRole("dialog", { name: "Documentation status" });
    const before = await popover.boundingBox();
    await page.setViewportSize({ width: 720, height: 640 });
    await page.waitForTimeout(150);
    const after = await popover.boundingBox();
    expect(after?.x).not.toBe(before?.x);
  });

  test("cleans up after close without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/components/popover");
    const trigger = page.getByRole("button", { name: "View details" });
    await trigger.click();
    await trigger.click();
    expect(errors).toEqual([]);
  });
});
