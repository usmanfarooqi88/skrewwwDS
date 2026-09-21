import type { Page } from "@playwright/test";
import { expect, expectColorClose, hexToRgba, test } from "./fixtures";

function parseRgb(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) throw new Error(`Unparseable computed color: ${value}`);
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: 1 };
}

async function expectTabTraversalNeverEntersChart(page: Page, chartName: string) {
  const chart = page.getByRole("img", { name: chartName });
  await expect(chart.locator("svg")).toBeVisible();
  await expect(chart.locator('[tabindex]:not([tabindex="-1"]), [role="application"]')).toHaveCount(0);

  // Real keyboard traversal: Tab through the page and confirm focus never lands inside the chart.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const enteredChart = await page.evaluate(async (name) => {
    const root = document.querySelector(`[role="img"][aria-label="${name}"]`);
    return root ? "ready" : "missing";
  }, chartName);
  expect(enteredChart).toBe("ready");
  for (let step = 0; step < 80; step += 1) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate((name) => {
      const root = document.querySelector(`[role="img"][aria-label="${name}"]`);
      return Boolean(root && document.activeElement && root.contains(document.activeElement));
    }, chartName);
    expect(inside, `Tab step ${step + 1} landed inside the chart`).toBe(false);
  }
}


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

  test("keeps the chart out of the keyboard tab order", async ({ page }) => {
    await expectTabTraversalNeverEntersChart(page, "Monthly signups trend");
  });

  test("resolves line stroke and marker colors from delivered chart tokens (not the undefined-variable fallback)", async ({
    page,
  }) => {
    const curve = page.locator(".recharts-line-curve");
    await expect(curve).toHaveCount(1);
    const stroke = await curve.evaluate((el) => getComputedStyle(el).stroke);
    // Undefined var() in an SVG stroke attribute computes to `none` (an invisible line).
    expect(stroke).not.toBe("none");
    expectColorClose(parseRgb(stroke), hexToRgba("#6C4CF2"));

    const dot = page.locator(".recharts-line-dots circle").first();
    const dotStyle = await dot.evaluate((el) => {
      const style = getComputedStyle(el);
      return { fill: style.fill, stroke: style.stroke };
    });
    expect(dotStyle.stroke).not.toBe("none");
    expectColorClose(parseRgb(dotStyle.stroke), hexToRgba("#6C4CF2"));
    // Hollow-ring marker: fill is the surface color, so it must not be the black undefined-variable fallback.
    expect(dotStyle.fill).not.toBe("rgb(0, 0, 0)");
  });
});
