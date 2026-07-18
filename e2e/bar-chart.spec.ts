import { expect, test } from "@playwright/test";

test.describe("Bar Chart browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/bar-chart");
  });

  test("renders the chart with an accessible name and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.reload();
    const chart = page.getByRole("img", { name: "Monthly signups" });
    await expect(chart).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("renders one bar per month with real proportional heights", async ({ page }) => {
    const bars = page.locator(".recharts-bar-rectangle path");
    await expect(bars).toHaveCount(6);

    const heights = await bars.evaluateAll((paths) =>
      paths.map((p) => {
        const d = p.getAttribute("d") ?? "";
        const match = d.match(/v (-?[\d.]+)/);
        return match ? Math.abs(Number(match[1])) : 0;
      }),
    );

    // June (140, tallest) must be strictly taller than January (58, shortest).
    expect(heights[5]).toBeGreaterThan(heights[0]);
    expect(heights.indexOf(Math.max(...heights))).toBe(5);
    expect(heights.indexOf(Math.min(...heights))).toBe(0);
  });

  test("exposes the underlying data via a visually-hidden table", async ({ page }) => {
    const table = page.locator("table.sr-only");
    await expect(table).toHaveCount(1);
    await expect(table.getByRole("row", { name: /Jan/ })).toHaveText(/58/);
    await expect(table.getByRole("row", { name: /Jun/ })).toHaveText(/140/);
  });

  test("renders no y-axis, legend, or tooltip", async ({ page }) => {
    await expect(page.locator(".recharts-yAxis")).toHaveCount(0);
    await expect(page.locator(".recharts-legend-wrapper")).toHaveCount(0);
    await expect(page.locator(".recharts-tooltip-wrapper")).toHaveCount(0);
  });
});
