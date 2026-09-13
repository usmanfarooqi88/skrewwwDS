import { expect, expectColorClose, hexToRgba, resolvedRgba, test } from "./fixtures";

test.describe("Button Group", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/button-group");
  });

  test("exposes a group of independent buttons", async ({ page }) => {
    const group = page.getByRole("group", { name: "View mode" });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button", { name: "List" })).toBeVisible();
    await expect(group.getByRole("button", { name: "Grid" })).toBeVisible();
    await expect(page.getByRole("radiogroup")).toHaveCount(0);
  });

  test("keyboard focus traverses each button without clipping the ring", async ({ page }) => {
    const group = page.getByRole("group", { name: "View mode" });
    const list = group.getByRole("button", { name: "List" });
    const grid = group.getByRole("button", { name: "Grid" });
    await list.focus();
    await page.keyboard.press("Tab");
    await expect(grid).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(list).toBeFocused();
    const outline = await list.evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(outline).toBe("2px");
    const overflow = await group.evaluate((el) => getComputedStyle(el).overflow);
    expect(overflow).not.toBe("hidden");
  });

  test("disabled child does not disable siblings", async ({ page }) => {
    const group = page.getByRole("group", { name: "Export" });
    await expect(group.getByRole("button", { name: "CSV" })).toBeDisabled();
    await expect(group.getByRole("button", { name: "PDF" })).toBeEnabled();
    await group.getByRole("button", { name: "PDF" }).click();
  });

  test("joined primary group uses brand-700 divider chrome", async ({ page }) => {
    const group = page.getByRole("group", { name: "View mode" });
    expectColorClose(await resolvedRgba(group, "backgroundColor"), hexToRgba("#4229AD"), "primary divider");
  });

  test("secondary group uses border-default divider chrome", async ({ page }) => {
    const group = page.getByRole("group", { name: "Period" });
    expectColorClose(await resolvedRgba(group, "backgroundColor"), hexToRgba("#DFE0E4"), "neutral divider");
  });
});
