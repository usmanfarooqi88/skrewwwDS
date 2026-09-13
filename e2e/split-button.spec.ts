import { expect, expectColorClose, hexToRgba, resolvedRgba, test } from "./fixtures";

test.describe("Split Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/split-button");
  });

  test("exposes primary action and menu trigger", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    await expect(group.getByRole("button", { name: "Save options menu", exact: true })).toBeVisible();
  });

  test("primary click fires primary only and does not open menu", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    await group.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByTestId("Save options-last-action")).toHaveText("Last action: Saved");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("menu trigger opens menu without firing primary", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    const trigger = group.getByRole("button", { name: "Save options menu", exact: true });
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await trigger.click();
    await expect(page.getByRole("menu", { name: "Save options menu", exact: true })).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("Save options-last-action")).toHaveText("Last action: No action yet");
  });

  test("keyboard primary and Escape close", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    const primary = group.getByRole("button", { name: "Save", exact: true });
    const trigger = group.getByRole("button", { name: "Save options menu", exact: true });
    await primary.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("Save options-last-action")).toHaveText("Last action: Saved");
    await expect(page.getByRole("menu")).toHaveCount(0);

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("menu keyboard navigation selects related action", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    const trigger = group.getByRole("button", { name: "Save options menu", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Save as draft", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("Save options-last-action")).toHaveText(
      "Last action: Saved as draft",
    );
  });

  test("disabled combinations stay independent", async ({ page }) => {
    const disabledPrimary = page.getByRole("group", { name: "Disabled primary save", exact: true });
    await expect(disabledPrimary.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
    await disabledPrimary
      .getByRole("button", { name: "Disabled primary save menu", exact: true })
      .click();
    await expect(
      page.getByRole("menu", { name: "Disabled primary save menu", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");

    const disabledMenu = page.getByRole("group", { name: "Disabled menu save", exact: true });
    await expect(
      disabledMenu.getByRole("button", { name: "Disabled menu save menu", exact: true }),
    ).toBeDisabled();
    await disabledMenu.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByTestId("Disabled menu save-last-action")).toHaveText(
      "Last action: Saved",
    );
  });

  test("focus rings are not clipped", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    const primary = group.getByRole("button", { name: "Save", exact: true });
    await primary.focus();
    const outline = await primary.evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(outline).toBe("2px");
    const overflow = await group.evaluate((el) => getComputedStyle(el).overflow);
    expect(overflow).not.toBe("hidden");
  });

  test("joined primary split uses brand-700 divider chrome", async ({ page }) => {
    const group = page.getByRole("group", { name: "Save options", exact: true });
    expectColorClose(
      await resolvedRgba(group, "backgroundColor"),
      hexToRgba("#4229AD"),
      "primary divider",
    );
  });

  test("secondary split uses border-default divider chrome", async ({ page }) => {
    const group = page.getByRole("group", { name: "Secondary save", exact: true });
    expectColorClose(
      await resolvedRgba(group, "backgroundColor"),
      hexToRgba("#DFE0E4"),
      "neutral divider",
    );
  });

  test("narrow viewport still shows both segments", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    const group = page.getByRole("group", { name: "Save options", exact: true });
    await expect(group.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    await expect(
      group.getByRole("button", { name: "Save options menu", exact: true }),
    ).toBeVisible();
  });
});
