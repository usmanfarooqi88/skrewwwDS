import { expect, test } from "@playwright/test";

test.describe("Select keyboard model", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/select");
  });

  test("opens with ArrowDown and selects with Enter", async ({ page }) => {
    const trigger = page.getByRole("combobox", { name: "Role", exact: true });
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox", { name: "Role" })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(trigger).toHaveText("Editor");
  });

  test("moves focus with Home and End inside the listbox", async ({ page }) => {
    const trigger = page.getByRole("combobox", { name: "Role", exact: true });
    await trigger.click();
    const listbox = page.getByRole("listbox", { name: "Role" });
    await expect(listbox).toBeVisible();
    await page.keyboard.press("End");
    await expect(page.getByRole("option", { name: "Admin" })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("option", { name: "Viewer" })).toBeFocused();
  });

  test("closes with Escape and restores combobox focus", async ({ page }) => {
    const trigger = page.getByRole("combobox", { name: "Role", exact: true });
    await trigger.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("does not expose dialog role on the listbox popover shell", async ({ page }) => {
    await page.getByRole("combobox", { name: "Role", exact: true }).click();
    await expect(page.getByRole("listbox", { name: "Role" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("blocks submit when required select is empty", async ({ page }) => {
    const form = page.getByTestId("required-role-form");
    await form.getByRole("button", { name: "Submit role form" }).click();
    await expect(form.getByRole("combobox", { name: "Required role" })).toBeVisible();
    const blocked = await form.evaluate((node) => {
      const input = node.querySelector(
        '[data-testid="select-validation-input"]',
      ) as HTMLInputElement | null;
      if (!input) return false;
      return !input.reportValidity();
    });
    expect(blocked).toBe(true);
  });
});
