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


const MAIN = "Monthly signups trend";

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
    const chart = page.getByRole("img", { name: MAIN });
    await expect(chart.locator(".recharts-line-curve")).toHaveCount(1);
    await expect(chart.locator(".recharts-line-dots circle")).toHaveCount(6);
  });

  test("renders points positioned proportional to value", async ({ page }) => {
    const dots = page.getByRole("img", { name: MAIN }).locator(".recharts-line-dots circle");
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
    const table = page.getByRole("table", { name: MAIN });
    await expect(table).toHaveCount(1);
    await expect(table.getByRole("row", { name: /Jan/ })).toHaveText(/58/);
    await expect(table.getByRole("row", { name: /Jun/ })).toHaveText(/140/);
  });

  test("renders no axes, gridlines, legend, or tooltip", async ({ page }) => {
    const chart = page.getByRole("img", { name: MAIN });
    await expect(chart.locator(".recharts-cartesian-axis")).toHaveCount(0);
    await expect(chart.locator(".recharts-cartesian-grid")).toHaveCount(0);
    await expect(chart.locator(".recharts-tooltip-wrapper")).toHaveCount(0);
    await expect(chart.locator("ul")).toHaveCount(0);
  });

  test("keeps the chart out of the keyboard tab order", async ({ page }) => {
    await expectTabTraversalNeverEntersChart(page, "Monthly signups trend");
  });

  test("resolves line stroke and marker colors from delivered chart tokens (not the undefined-variable fallback)", async ({
    page,
  }) => {
    const chart = page.getByRole("img", { name: MAIN });
    const curve = chart.locator(".recharts-line-curve");
    await expect(curve).toHaveCount(1);
    const stroke = await curve.evaluate((el) => getComputedStyle(el).stroke);
    // Undefined var() in an SVG stroke attribute computes to `none` (an invisible line).
    expect(stroke).not.toBe("none");
    expectColorClose(parseRgb(stroke), hexToRgba("#6C4CF2"));

    const dot = chart.locator(".recharts-line-dots circle").first();
    const dotStyle = await dot.evaluate((el) => {
      const style = getComputedStyle(el);
      return { fill: style.fill, stroke: style.stroke };
    });
    expect(dotStyle.stroke).not.toBe("none");
    expectColorClose(parseRgb(dotStyle.stroke), hexToRgba("#6C4CF2"));
    // Hollow-ring marker: fill is the surface color, so it must not be the black undefined-variable fallback.
    expect(dotStyle.fill).not.toBe("rgb(0, 0, 0)");
  });

  test("keeps every chart on the page out of the keyboard tab order", async ({ page }) => {
    await expect(page.getByRole("img")).not.toHaveCount(0);
    await expect(page.locator('[role="img"] [tabindex]:not([tabindex="-1"]), [role="img"] [role="application"]')).toHaveCount(0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    for (let step = 0; step < 120; step += 1) {
      await page.keyboard.press("Tab");
      const insideChart = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="img"]')));
      expect(insideChart, `Tab step ${step + 1} landed inside a chart`).toBe(false);
    }
  });

  test("draws one line per series with a legend, axes, grid, and one table column per series", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Revenue and orders by month" });
    await expect(chart.locator(".recharts-line-curve")).toHaveCount(2);
    await expect(chart.locator("ul > li")).toHaveText(["Revenue", "Orders"]);
    await expect(chart.locator(".recharts-cartesian-grid")).toHaveCount(1);
    await expect(chart.locator(".recharts-xAxis-tick-labels text.recharts-cartesian-axis-tick-value")).toHaveText(["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026"]);
    const table = page.getByRole("table", { name: "Revenue and orders by month" });
    await expect(table.getByRole("columnheader")).toHaveText(["Label", "Revenue", "Orders"]);
    await expect(table.getByRole("row", { name: /Jan 2026/ })).toContainText("$12,000");
  });

  test("resolves each series stroke from delivered chart tokens", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Revenue and orders by month" });
    await expect(chart.locator(".recharts-line-curve").first()).toBeVisible();
    const colors = await chart.evaluate((root) => {
      const resolve = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        root.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const curves = Array.from(root.querySelectorAll(".recharts-line-curve"));
      return {
        first: getComputedStyle(curves[0]).stroke,
        second: getComputedStyle(curves[1]).stroke,
        expectedFirst: resolve("var(--semantic-action-primary)"),
        expectedSecond: resolve("var(--semantic-text-primary)"),
      };
    });
    expect(colors.first).toBe(colors.expectedFirst);
    expect(colors.second).toBe(colors.expectedSecond);
  });

  test("shows a formatted tooltip with the date label and every series on hover", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Revenue and orders by month" });
    await chart.locator(".recharts-line-dots circle").first().hover();
    const tooltip = chart.locator(".recharts-tooltip-wrapper");
    await expect(tooltip).toContainText("Jan 2026");
    await expect(tooltip).toContainText("Revenue");
    await expect(tooltip).toContainText("$12,000");
    await expect(tooltip).toContainText("Orders");
    await expect(tooltip).toContainText("80");
  });

  test("renders the sparkline compactly: no markers, thin stroke, no chrome, 48px tall", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Balance history sparkline" });
    await expect(chart.locator(".recharts-line-curve")).toHaveCount(1);
    await expect(chart.locator(".recharts-line-dots circle")).toHaveCount(0);
    await expect(chart.locator(".recharts-cartesian-axis, .recharts-cartesian-grid, .recharts-tooltip-wrapper, ul")).toHaveCount(0);
    expect(await chart.locator(".recharts-line-curve").evaluate((el) => getComputedStyle(el).strokeWidth)).toBe("1.5px");
    expect(await chart.locator("svg").evaluate((el) => Math.round(el.getBoundingClientRect().height))).toBe(48);
  });

  test("stays inside the viewport at 375px with several series, axes and a legend", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    const chart = page.getByRole("img", { name: "Revenue and orders by month" });
    await expect(chart.locator(".recharts-line-curve").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});
