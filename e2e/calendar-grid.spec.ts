import { expect, test } from "@playwright/test";

test.describe("Calendar Grid browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/calendar-grid");
  });

  // The preview page now shows two CalendarGrid instances (single-date, then
  // range mode) — scope to the first (single-date) grid throughout this
  // describe block so locators stay unambiguous. Behavior under test is
  // unchanged; only the disambiguation is new.
  test("moves focus with arrow keys", async ({ page }) => {
    const grid = page.getByRole("grid").first();
    const selected = page.getByRole("button", { name: "14 July 2026" }).first();
    await selected.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "15 July 2026" }).first()).toBeFocused();
    await grid.press("ArrowLeft");
    await expect(selected).toBeFocused();
  });

  test("changes month from header controls", async ({ page }) => {
    await page.getByRole("button", { name: "Next month" }).first().click();
    await expect(page.getByRole("heading", { name: /August 2026/i }).first()).toBeVisible();
  });

  test("selects a date with Enter", async ({ page }) => {
    const day = page.getByRole("button", { name: "14 July 2026" }).first();
    await day.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("gridcell", { selected: true }).first()).toContainText("14");
  });

  test("drills up to the month grid, then to the year grid, and back down", async ({ page }) => {
    await page.getByRole("button", { name: "July 2026", exact: true }).first().click();
    await expect(page.getByRole("grid", { name: "Choose month, 2026" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "July" }).first()).toBeFocused();

    await page.getByRole("button", { name: "2026" }).first().click();
    await expect(page.getByRole("grid", { name: "Choose year" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "2026" }).first()).toBeFocused();

    await page.getByRole("button", { name: "2026" }).first().click();
    await expect(page.getByRole("grid", { name: "Choose month, 2026" }).first()).toBeVisible();

    await page.getByRole("button", { name: "March", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: /March 2026/i }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "1 March 2026", exact: true }).first()).toBeFocused();
  });

  test("keyboard navigates the month grid and selects with Enter", async ({ page }) => {
    await page.getByRole("button", { name: "July 2026", exact: true }).first().click();
    const grid = page.getByRole("grid", { name: "Choose month, 2026" }).first();
    await expect(page.getByRole("button", { name: "July" }).first()).toBeFocused();
    await grid.press("ArrowRight");
    await expect(page.getByRole("button", { name: "August" }).first()).toBeFocused();
    await grid.press("Home");
    await expect(page.getByRole("button", { name: "May" }).first()).toBeFocused();
    await grid.press("Enter");
    await expect(page.getByRole("heading", { name: /May 2026/i }).first()).toBeVisible();
  });
});

test.describe("Calendar Grid range mode browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/calendar-grid");
  });

  // The range-mode preview is the second CalendarGrid on the page.
  function rangeGrid(page: import("@playwright/test").Page) {
    return page.getByRole("grid").nth(1);
  }

  test("sets start then end via click, and shows a live hover preview before commit", async ({
    page,
  }) => {
    const grid = rangeGrid(page);
    await grid.getByRole("button", { name: "14 July 2026" }).click();
    await expect(grid.getByRole("button", { name: "Start of range, 14 July 2026" })).toBeVisible();

    await grid.getByRole("button", { name: "18 July 2026" }).hover();
    await expect(
      grid.getByRole("button", {
        name: "18 July 2026, provisional end of range. Press Enter to confirm.",
      }),
    ).toBeVisible();
    await expect(grid.getByRole("button", { name: "16 July 2026, previewing range" })).toBeVisible();

    await grid.getByRole("button", { name: "20 July 2026" }).click();
    await expect(grid.getByRole("button", { name: "Start of range, 14 July 2026" })).toBeVisible();
    await expect(grid.getByRole("button", { name: "End of range, 20 July 2026" })).toBeVisible();
    await expect(grid.getByRole("button", { name: "17 July 2026, in range" })).toBeVisible();
  });

  test("shows the same live preview via keyboard and commits the end with Enter", async ({
    page,
  }) => {
    const grid = rangeGrid(page);
    const start = grid.getByRole("button", { name: "14 July 2026" });
    await start.click();
    await grid.press("ArrowRight");
    await grid.press("ArrowRight");

    await expect(
      grid.getByRole("button", {
        name: "16 July 2026, provisional end of range. Press Enter to confirm.",
      }),
    ).toBeVisible();

    await grid.press("Enter");
    await expect(grid.getByRole("button", { name: "End of range, 16 July 2026" })).toBeVisible();
  });

  test("starts a fresh range when clicking inside an already-complete range", async ({ page }) => {
    const grid = rangeGrid(page);
    await grid.getByRole("button", { name: "14 July 2026" }).click();
    await grid.getByRole("button", { name: "20 July 2026" }).click();
    await grid.getByRole("button", { name: "16 July 2026, in range" }).click();

    await expect(grid.getByRole("button", { name: "Start of range, 16 July 2026" })).toBeVisible();
    await expect(
      grid.getByRole("button", { name: "End of range, 20 July 2026" }),
    ).not.toBeVisible();
  });
});
