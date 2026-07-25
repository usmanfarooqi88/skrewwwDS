import { expect, test } from "@playwright/test";

test.describe("Banking Balance Summary browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/banking-balance-summary");
  });

  test("loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Banking Balance Summary" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("switches the visible Bar Chart when a different time-range tab is activated", async ({ page }) => {
    const tablist = page.getByRole("tablist").first();
    const sevenDayTab = tablist.getByRole("tab", { name: "7D" });
    const thirtyDayTab = tablist.getByRole("tab", { name: "30D" });

    await expect(sevenDayTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("img", { name: "Spending overview — 7D" }).first()).toBeVisible();

    await thirtyDayTab.click();
    await expect(thirtyDayTab).toHaveAttribute("aria-selected", "true");
    await expect(sevenDayTab).toHaveAttribute("aria-selected", "false");
    await expect(page.getByRole("img", { name: "Spending overview — 30D" }).first()).toBeVisible();
  });

  test("supports keyboard arrow navigation between time-range tabs", async ({ page }) => {
    const tablist = page.getByRole("tablist").first();
    const sevenDayTab = tablist.getByRole("tab", { name: "7D" });
    const ninetyDayTab = tablist.getByRole("tab", { name: "90D" });

    await sevenDayTab.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(ninetyDayTab).toBeFocused();
  });

  test("shows a loading skeleton that hides the real content until toggled off", async ({ page }) => {
    await expect(page.getByText("Total spent", { exact: true })).toHaveCount(2);

    const toggle = page.getByRole("button", { name: "Show loading state" });
    await toggle.click();

    await expect(page.getByText("Total spent", { exact: true })).toHaveCount(1);
    await expect(page.getByText("Loading spending summary", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Show content" }).click();
    await expect(page.getByText("Total spent", { exact: true })).toHaveCount(2);
  });
});
