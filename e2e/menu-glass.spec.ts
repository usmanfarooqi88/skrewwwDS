import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  setSurfaceMode,
  test,
} from "./fixtures";
import type { Locator } from "@playwright/test";

async function menuPanel(menu: Locator) {
  return menu.locator("xpath=ancestor::*[contains(@class, '__popover')][1]");
}

test.describe("Menu Glass panel exact parity", () => {
  test("Glass shell matches Figma panel fill, border, blur, radius, padding, no shadow", async ({
    page,
  }) => {
    await page.goto("/components/menu");
    await setSurfaceMode(page, "glass");
    await page.getByRole("button", { name: "Project actions" }).click();

    const menu = page.getByRole("menu", { name: "Project actions" });
    const panel = await menuPanel(menu);
    const body = panel.locator('[class*="__body"]').first();

    expectColorClose(await resolvedRgba(panel, "backgroundColor"), hexToRgba("#ffffff", 0.12));
    expectColorClose(await resolvedRgba(panel, "borderColor"), hexToRgba("#ffffff", 0.24));

    const styles = await panel.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        borderWidth: style.borderWidth,
        backdropFilter: style.backdropFilter,
        webkitBackdropFilter: style.getPropertyValue("-webkit-backdrop-filter"),
        boxShadow: style.boxShadow,
        borderRadius: style.borderRadius,
        backgroundImage: style.backgroundImage,
      };
    });

    expect(styles.borderWidth).toBe("1px");
    expect(styles.backdropFilter).toBe("blur(16px)");
    expect(styles.boxShadow).toBe("none");
    expect(styles.borderRadius).toBe("12px");
    expect(styles.backgroundImage).toBe("none");

    const padding = await body.evaluate((element) => getComputedStyle(element).padding);
    expect(padding).toBe("4px");
  });

  test("Glass hover item is 20% white with no item blur while panel blur stays", async ({
    page,
  }) => {
    await page.goto("/components/menu");
    await setSurfaceMode(page, "glass");
    await page.getByRole("button", { name: "Project actions" }).click();

    const menu = page.getByRole("menu", { name: "Project actions" });
    const panel = await menuPanel(menu);
    const item = menu.getByRole("menuitem", { name: "Edit profile" });

    await item.hover();
    expectColorClose(await resolvedRgba(item, "backgroundColor"), hexToRgba("#ffffff", 0.2));

    const itemFilter = await item.evaluate((element) => getComputedStyle(element).backdropFilter);
    expect(itemFilter).toBe("none");

    expect(await panel.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      "blur(16px)",
    );
  });

  test("Selected API remains absent; destructive and disabled contracts unchanged", async ({
    page,
  }) => {
    await page.goto("/components/menu");
    await setSurfaceMode(page, "glass");
    await page.getByRole("button", { name: "Project actions" }).click();

    const menu = page.getByRole("menu", { name: "Project actions" });
    expect(await menu.locator('[aria-selected="true"]').count()).toBe(0);

    const destructive = menu.getByRole("menuitem", { name: "Delete project" });
    const destructiveLabel = destructive.locator('[class*="itemLabel"]');
    const destructiveIcon = destructive.locator('[class*="itemIcon"]');
    expectColorClose(await resolvedRgba(destructiveLabel, "color"), hexToRgba("#cc3b37"));
    expectColorClose(await resolvedRgba(destructiveIcon, "color"), hexToRgba("#a0a3ac"));

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "More actions" }).click();
    const disabled = page.getByRole("menuitem", { name: /Export \(disabled\)/ });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    expectColorClose(
      await resolvedRgba(disabled.locator('[class*="itemLabel"]'), "color"),
      hexToRgba("#a0a3ac"),
    );
  });

  test("keyboard focus-visible still works under Glass", async ({ page }) => {
    await page.goto("/components/menu");
    await setSurfaceMode(page, "glass");
    await page.getByRole("button", { name: "More actions" }).focus();
    await page.keyboard.press("ArrowDown");

    const item = page.getByRole("menuitem", { name: "Archive" });
    await expect(item).toBeFocused();
    const outline = await item.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("generic Popover Glass remains the prior md/color-mix recipe", async ({ page }) => {
    await page.goto("/components/popover");
    await setSurfaceMode(page, "glass");
    await page.getByRole("button", { name: "View details" }).click();

    const popover = page.getByRole("dialog", { name: "Documentation status" });
    const styles = await popover.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        backdropFilter: style.backdropFilter,
      };
    });

    // Popover Glass is still the opaque-ish color-mix + 12px blur path — not Menu's 12%/16px.
    expect(styles.backdropFilter).toBe("blur(12px)");
    expectColorClose(
      await resolvedRgba(popover, "backgroundColor"),
      hexToRgba("#ffffff"),
      "popover glass remains near-opaque color-mix",
    );
  });
});

test.describe("Menu Flat panel preservation", () => {
  test("Flat shell stays solid white with semantic border and no blur", async ({ page }) => {
    await page.goto("/components/menu");
    await setSurfaceMode(page, "flat");
    await page.getByRole("button", { name: "Project actions" }).click();

    const menu = page.getByRole("menu", { name: "Project actions" });
    const panel = await menuPanel(menu);

    expectColorClose(await resolvedRgba(panel, "backgroundColor"), hexToRgba("#ffffff"));
    expectColorClose(await resolvedRgba(panel, "borderColor"), hexToRgba("#dfe0e4"));
    expect(await panel.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      "none",
    );
    expect(await panel.evaluate((element) => getComputedStyle(element).borderRadius)).toBe("12px");
  });
});
