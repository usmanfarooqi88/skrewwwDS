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
});
