import { expect, expectColorClose, hexToRgba, resolvedRgba, rgbaStringToRgba, test } from "./fixtures";

test.describe("Slider", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/slider");
  });

  test("exposes slider semantics and default demo value", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    await expect(slider).toBeVisible();
    await expect(slider).toHaveAttribute("aria-valuemin", "0");
    await expect(slider).toHaveAttribute("aria-valuemax", "100");
    await expect(slider).toHaveAttribute("aria-valuenow", "40");
  });

  test("keyboard arrows change the value", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "41");
    await page.keyboard.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await page.keyboard.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
  });

  test("disabled slider rejects keyboard and pointer changes", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Disabled" });
    await expect(slider).toHaveAttribute("aria-disabled", "true");
    await expect(slider).toHaveAttribute("aria-valuenow", "40");
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", "40");

    const box = await slider.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.click(box!.x + box!.width * 0.8, box!.y + box!.height / 2);
    await expect(slider).toHaveAttribute("aria-valuenow", "40");
  });

  test("pointer drag updates value near the click position", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    const box = await slider.boundingBox();
    expect(box).toBeTruthy();
    await slider.click({
      position: { x: Math.round(box!.width * 0.7), y: Math.round(box!.height / 2) },
      force: true,
    });
    const now = Number(await slider.getAttribute("aria-valuenow"));
    expect(now).toBeGreaterThanOrEqual(60);
    expect(now).toBeLessThanOrEqual(80);
  });

  test("track fill uses action-primary and hover uses primary-hover", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Volume" });
    const fill = slider.locator("span").nth(1);
    expectColorClose(await resolvedRgba(fill, "backgroundColor"), hexToRgba("#6C4CF2"), "default fill");

    await slider.hover();
    await page.waitForTimeout(50);
    expectColorClose(await resolvedRgba(fill, "backgroundColor"), hexToRgba("#5638D6"), "hover fill");
  });

  test("disabled applies opacity-disabled on the control", async ({ page }) => {
    const slider = page.getByRole("slider", { name: "Disabled" });
    const opacity = await slider.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeCloseTo(0.4, 2);
  });

  test("focus-visible thumb uses focus-ring stroke after keyboard focus", async ({ page }) => {
    await page.keyboard.press("Tab");
    const slider = page.getByRole("slider", { name: "Volume" });
    // Prefer keyboard focus path so :focus-visible applies.
    while (!(await slider.evaluate((el) => el === document.activeElement))) {
      await page.keyboard.press("Tab");
    }
    const thumb = slider.locator("span").nth(2);
    const border = await thumb.evaluate((el) => getComputedStyle(el).borderTopColor);
    expectColorClose(rgbaStringToRgba(border), hexToRgba("#6C4CF2"), "focus thumb stroke");
  });
});
