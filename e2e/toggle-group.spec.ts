import { expect, test } from "./fixtures";

test.describe("Toggle Group", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/toggle-group");
  });

  test("exposes a radiogroup with selected radio", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View mode" }).first();
    await expect(group).toBeVisible();
    await expect(group.getByRole("radio", { name: "List" })).toHaveAttribute("aria-checked", "true");
  });

  test("selects by mouse and updates readout", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View mode" }).first();
    await group.getByRole("radio", { name: "Grid" }).click();
    await expect(group.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("toggle-group-value")).toContainText("grid");
  });

  test("arrow keys move selection", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View mode" }).first();
    await group.getByRole("radio", { name: "List" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
    await expect(group.getByRole("radio", { name: "Grid" })).toBeFocused();
  });

  test("disabled group cannot be activated", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "View mode" }).nth(1);
    await expect(group.getByRole("radio", { name: "List" })).toBeDisabled();
    await expect(group.getByRole("radio", { name: "Grid" })).toBeDisabled();
  });

  test("disabled item is skipped visually as disabled", async ({ page }) => {
    const group = page.getByRole("radiogroup", { name: "Alignment" });
    await expect(group.getByRole("radio", { name: "Center" })).toBeDisabled();
    await group.getByRole("radio", { name: "Right" }).click();
    await expect(group.getByRole("radio", { name: "Right" })).toHaveAttribute("aria-checked", "true");
  });

  test("narrow viewport keeps segments usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    const group = page.getByRole("radiogroup", { name: "View mode" }).first();
    await expect(group.getByRole("radio", { name: "List" })).toBeVisible();
    await expect(group.getByRole("radio", { name: "Grid" })).toBeVisible();
  });

  test("vertical + Pill caps at the container radius instead of the full 9999px stadium (RA-5 fix)", async ({
    page,
  }) => {
    const controls = page.getByTestId("toggle-group-preview-mode-controls");
    const vertical = page.getByRole("radiogroup", { name: "Density" });

    // Sharp/Rounded/Squircle stay on the plain control-radius path — only
    // Pill needed the orientation-aware cap.
    for (const [shape, expectedControlRadius] of [
      ["Sharp", "0px"],
      ["Rounded", "4px"],
      ["Squircle", "8px"],
    ] as const) {
      await controls.getByRole("button", { name: shape }).click();
      await expect(vertical).toHaveCSS("border-radius", expectedControlRadius);
    }

    await controls.getByRole("button", { name: "Pill" }).click();
    const [groupRadius, containerToken] = await Promise.all([
      vertical.evaluate((node) => getComputedStyle(node).borderRadius),
      vertical.evaluate((node) => getComputedStyle(node).getPropertyValue("--shape-radius-container").trim()),
    ]);
    expect(groupRadius).not.toBe("9999px");
    expect(groupRadius).toBe(containerToken);

    const items = vertical.getByRole("radio");
    const firstRadius = await items.first().evaluate((node) => getComputedStyle(node).borderRadius);
    const lastRadius = await items.last().evaluate((node) => getComputedStyle(node).borderRadius);
    expect(firstRadius).not.toContain("9999px");
    expect(lastRadius).not.toContain("9999px");

    // Horizontal Pill is unaffected — still the true stadium shape.
    const horizontal = page.getByRole("radiogroup", { name: "View mode" }).first();
    await expect(horizontal).toHaveCSS("border-radius", "9999px");
  });
});
