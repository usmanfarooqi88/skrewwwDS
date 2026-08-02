import { expect, test } from "@playwright/test";

test.describe("Date Picker browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/date-picker");
  });

  test("opens from keyboard and selects a date", async ({ page }) => {
    // The first "Release date" picker on the page has no value/defaultValue, so its
    // calendar opens on the real current month — pin the clock so the assertions
    // below (which pick "14 July 2026") don't drift with wall-clock date rollover.
    await page.clock.setFixedTime(new Date("2026-07-15T12:00:00"));
    await page.reload();
    await page.getByRole("button", { name: "Open calendar" }).first().click();
    await expect(page.getByRole("grid", { name: "Choose date" })).toBeVisible();
    await page.getByRole("button", { name: "14 July 2026" }).click();
    const trigger = page.getByRole("textbox", { name: "Release date" }).first();
    await expect(trigger).toHaveValue(/14.*2026/);
    await expect(page.getByRole("grid", { name: "Choose date" })).toHaveCount(0);
  });

  test("accepts typed dates in D MMM YYYY format", async ({ page }) => {
    const trigger = page.getByRole("textbox", { name: "Release date" }).first();
    await trigger.fill("20 Aug 2026");
    await trigger.blur();
    await expect(trigger).toHaveValue("20 Aug 2026");
  });

  test("submits hidden YYYY-MM-DD value", async ({ page }) => {
    const hidden = page.locator('input[type="hidden"][name="doc-updated"]');
    await expect(hidden).toHaveValue("2026-07-11");
  });

  test("restores trigger focus after Escape", async ({ page }) => {
    await page.getByRole("button", { name: "Open calendar" }).first().click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open calendar" }).first()).toBeFocused();
  });

  test("keeps month navigation open inside popover", async ({ page }) => {
    await page.getByRole("button", { name: "Open calendar" }).first().click();
    await page.getByRole("button", { name: "Next month" }).click();
    await expect(page.getByRole("grid", { name: "Choose date" })).toBeVisible();
  });
});
