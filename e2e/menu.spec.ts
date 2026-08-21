import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

const surfaceModes = ["flat", "gradient", "glass"] as const;

test.describe("Menu keyboard model", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/menu");
  });

  test("opens from pointer and exposes expanded trigger", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Project actions" });
    await trigger.click();
    await expect(page.getByRole("menu", { name: "Project actions" })).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
  });

  test("opens from Enter and Space", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "More actions" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("menu")).toBeVisible();
  });

  test("opens with ArrowDown and focuses first item", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "More actions" });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
  });

  test("opens with ArrowUp and focuses last enabled item", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "More actions" });
    await trigger.focus();
    await page.keyboard.press("ArrowUp");
    await expect(page.getByRole("menuitem", { name: "Share link" })).toBeFocused();
  });

  test("navigates with arrow keys, Home, and End", async ({ page }) => {
    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByRole("menuitem", { name: "Share link" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("menuitem", { name: "Archive" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Share link" })).toBeFocused();
  });

  test("typeahead focuses matching items", async ({ page }) => {
    await page.getByRole("button", { name: "Project actions" }).click();
    await page.keyboard.press("d");
    await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeFocused();
  });

  test("selects with Enter and Space", async ({ page }) => {
    await page.getByRole("button", { name: "Project actions" }).click();
    await page.keyboard.press("d");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByText("Last action: Duplicate")).toBeVisible();

    await page.getByRole("button", { name: "Project actions" }).click();
    await page.keyboard.press("d");
    await page.keyboard.press("Space");
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("disabled item cannot execute", async ({ page }) => {
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Export (disabled)" }).click({ force: true });
    await expect(page.getByRole("menu")).toBeVisible();
  });

  test("Escape closes and restores trigger focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "Project actions" });
    await trigger.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("Tab closes and moves focus away from the trigger", async ({ page }) => {
    const trigger = page.getByRole("button", { name: "More actions" });
    await trigger.click();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(trigger).not.toBeFocused();
  });

  test("closes on outside click", async ({ page }) => {
    await page.getByRole("button", { name: "Project actions" }).click();
    await page.locator("main").click({ position: { x: 8, y: 8 } });
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("does not expose dialog role", async ({ page }) => {
    await page.getByRole("button", { name: "Project actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("works at mobile viewport width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.getByRole("button", { name: "Project actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
  });

  test("menu inside dialog remains usable", async ({ page }) => {
    await page.getByRole("button", { name: "Open dialog with menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Row actions" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("enabled shortcut text stays secondary across states and Surface modes", async ({ page }) => {
    for (const mode of surfaceModes) {
      await page.goto("/components/menu");
      await setSurfaceMode(page, mode);
      await page.getByRole("button", { name: "Project actions" }).click();

      const menu = page.getByRole("menu", { name: "Project actions" });
      const item = menu.getByRole("menuitem", { name: "Edit profile" });
      const shortcut = item.locator('[class*="itemShortcut"]');
      const panel = menu.locator("xpath=ancestor::*[contains(@class, '__popover')][1]");

      expectColorClose(await resolvedRgba(shortcut, "color"), hexToRgba("#5B5F68"), `${mode} default shortcut`);
      expect(await item.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe("none");
      await expect(panel).toHaveCount(1);

      if (mode === "gradient") {
        const image = await panel.evaluate((element) => getComputedStyle(element).backgroundImage);
        expect((image.match(/linear-gradient/g) ?? []).length).toBe(1);
      } else if (mode === "glass") {
        expectColorClose(await resolvedRgba(panel, "backgroundColor"), hexToRgba("#ffffff", 0.12));
        expectColorClose(await resolvedRgba(panel, "borderColor"), hexToRgba("#ffffff", 0.24));
        expect(await panel.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
          "blur(16px)",
        );
        expect(await panel.evaluate((element) => getComputedStyle(element).boxShadow)).toBe("none");
        expect(await panel.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
          "none",
        );
      } else {
        expect(await panel.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe("none");
      }

      await item.hover();
      expectColorClose(await resolvedRgba(shortcut, "color"), hexToRgba("#5B5F68"), `${mode} hover shortcut`);
      expect(await item.evaluate((element) => getComputedStyle(element).backgroundImage)).toBe("none");

      await item.focus();
      expectColorClose(await resolvedRgba(shortcut, "color"), hexToRgba("#5B5F68"), `${mode} focused shortcut`);

      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "More actions" }).click();
      const disabledItem = page.getByRole("menuitem", { name: /Export \(disabled\)/ });
      const disabledShortcut = disabledItem.locator('[class*="itemShortcut"]');
      const disabledLabel = disabledItem.locator('[class*="itemLabel"]');
      expectColorClose(await resolvedRgba(disabledShortcut, "color"), hexToRgba("#A0A3AC"), `${mode} disabled shortcut`);
      expectColorClose(await resolvedRgba(disabledLabel, "color"), hexToRgba("#A0A3AC"), `${mode} disabled label`);
      await expect(disabledItem).toHaveAttribute("aria-disabled", "true");

      // React Menu has no selected/aria-selected state or public selected prop;
      // the keyboard-highlighted focus state is covered by the existing tests.
      expect(await menu.locator('[aria-selected="true"]').count()).toBe(0);
    }
  });
});
