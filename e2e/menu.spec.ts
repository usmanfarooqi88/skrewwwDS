import { expect, test } from "@playwright/test";

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
});
