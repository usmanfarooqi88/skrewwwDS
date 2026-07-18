import { expect, test } from "@playwright/test";

test.describe("Line Chart browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/line-chart");
  });

  test("renders the chart with an accessible name and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.reload();
    const chart = page.getByRole("img", { name: "Monthly signups trend" });
    await expect(chart).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("renders a single continuous path with one point marker per month", async ({ page }) => {
    await expect(page.locator(".recharts-line-curve")).toHaveCount(1);
    await expect(page.locator(".recharts-line-dots circle")).toHaveCount(6);
  });

  test("renders points positioned proportional to value", async ({ page }) => {
    const dots = page.locator(".recharts-line-dots circle");
    // Wait for the chart to finish rendering before reading attributes —
    // evaluateAll doesn't auto-retry like a locator assertion does.
    await expect(dots).toHaveCount(6);
    const cys = await dots.evaluateAll((els) => els.map((d) => Number(d.getAttribute("cy"))));

    // June (140, largest) sits highest (smallest cy); January (58, smallest)
    // sits lowest (largest cy) — SVG y grows downward.
    expect(cys.indexOf(Math.min(...cys))).toBe(5);
    expect(cys.indexOf(Math.max(...cys))).toBe(0);
  });

  test("exposes the underlying data via a visually-hidden table", async ({ page }) => {
    const table = page.locator("table.sr-only");
    await expect(table).toHaveCount(1);
    await expect(table.getByRole("row", { name: /Jan/ })).toHaveText(/58/);
    await expect(table.getByRole("row", { name: /Jun/ })).toHaveText(/140/);
  });

  test("renders no axes, gridlines, legend, or tooltip", async ({ page }) => {
    await expect(page.locator(".recharts-cartesian-axis")).toHaveCount(0);
    await expect(page.locator(".recharts-cartesian-grid")).toHaveCount(0);
    await expect(page.locator(".recharts-legend-wrapper")).toHaveCount(0);
    await expect(page.locator(".recharts-tooltip-wrapper")).toHaveCount(0);
  });
});
