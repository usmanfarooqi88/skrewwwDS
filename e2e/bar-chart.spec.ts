import type { Locator, Page } from "@playwright/test";
import { expect, expectColorClose, hexToRgba, resolvedRgba, test } from "./fixtures";

function parseRgb(value: string) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) throw new Error(`Unparseable computed color: ${value}`);
  return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: 1 };
}

const xAxisTickSelector = "text.recharts-cartesian-axis-tick-value";

async function expectReadableXAxis(chart: Locator, expectedLabels: string[]) {
  const ticks = chart.locator(xAxisTickSelector);
  await expect(ticks).toHaveCount(expectedLabels.length);
  expect(await ticks.allTextContents()).toEqual(expectedLabels);
  await expect(chart.locator(".recharts-bar-rectangle path")).toHaveCount(expectedLabels.length);
  for (const tick of await ticks.all()) {
    await expectColorClose(await resolvedRgba(tick, "color"), hexToRgba("#5B5F68"));
  }

  const geometry = await chart.evaluate((root, selector) => {
    const svg = root.querySelector("svg");
    const card = root.closest('[class*="card"]');
    if (!svg || !card) throw new Error("Rendered Bar Chart bounds were not found");
    const svgRect = svg.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const tickRects = Array.from(root.querySelectorAll(selector)).map((node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    return {
      svg: { left: svgRect.left, right: svgRect.right, top: svgRect.top, bottom: svgRect.bottom },
      card: {
        left: cardRect.left,
        right: cardRect.right,
        top: cardRect.top,
        bottom: cardRect.bottom,
      },
      tickRects,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  }, xAxisTickSelector);

  for (const rect of geometry.tickRects) {
    expect(rect.left).toBeGreaterThanOrEqual(geometry.svg.left - 0.5);
    expect(rect.right).toBeLessThanOrEqual(geometry.svg.right + 0.5);
    expect(rect.top).toBeGreaterThanOrEqual(geometry.svg.top - 0.5);
    expect(rect.bottom).toBeLessThanOrEqual(geometry.svg.bottom + 0.5);
    expect(rect.left).toBeGreaterThanOrEqual(geometry.card.left - 0.5);
    expect(rect.right).toBeLessThanOrEqual(geometry.card.right + 0.5);
  }
  for (let index = 1; index < geometry.tickRects.length; index += 1) {
    expect(geometry.tickRects[index].left).toBeGreaterThanOrEqual(
      geometry.tickRects[index - 1].right - 0.5,
    );
  }
  expect(geometry.documentWidth).toBe(geometry.viewportWidth);
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

const MAIN = "Monthly signups";

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
    const bars = page.getByRole("img", { name: MAIN }).locator(".recharts-bar-rectangle path");
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

  test("renders every supplied month label without collisions", async ({ page }) => {
    const expectedLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const chart = page.getByRole("img", { name: "Monthly signups" });

    await page.setViewportSize({ width: 1280, height: 1000 });
    await expectReadableXAxis(chart, expectedLabels);

    await page.setViewportSize({ width: 375, height: 812 });
    await expectReadableXAxis(chart, expectedLabels);
  });

  test("exposes the underlying data via a visually-hidden table", async ({ page }) => {
    const table = page.getByRole("table", { name: MAIN });
    await expect(table).toHaveCount(1);
    await expect(table.getByRole("row", { name: /Jan/ })).toHaveText(/58/);
    await expect(table.getByRole("row", { name: /Jun/ })).toHaveText(/140/);
  });

  test("renders no y-axis, legend, or tooltip", async ({ page }) => {
    const chart = page.getByRole("img", { name: MAIN });
    await expect(chart.locator(".recharts-yAxis")).toHaveCount(0);
    await expect(chart.locator(".recharts-cartesian-grid")).toHaveCount(0);
    await expect(chart.locator(".recharts-tooltip-wrapper")).toHaveCount(0);
    await expect(chart.locator("ul")).toHaveCount(0);
  });

  test("keeps the chart out of the keyboard tab order", async ({ page }) => {
    await expectTabTraversalNeverEntersChart(page, "Monthly signups");
  });

  test("resolves bar fill and axis text from delivered chart tokens (not the undefined-variable fallback)", async ({
    page,
  }) => {
    const bar = page.getByRole("img", { name: MAIN }).locator(".recharts-bar-rectangle path").first();
    await expect(bar).toBeVisible();
    const fill = await bar.evaluate((el) => getComputedStyle(el).fill);
    // Undefined var() in an SVG fill attribute computes to black; the approved fill is the brand action color.
    expect(fill).not.toBe("rgb(0, 0, 0)");
    expectColorClose(parseRgb(fill), hexToRgba("#6C4CF2"));
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

  test("groups two series side by side with a legend and one table column per series", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Revenue and orders by quarter, grouped" });
    await expect(chart.locator(".recharts-bar-rectangle path")).toHaveCount(8);
    await expect(chart.locator("ul > li")).toHaveText(["Revenue", "Orders"]);
    const table = page.getByRole("table", { name: "Revenue and orders by quarter, grouped" });
    await expect(table.getByRole("columnheader")).toHaveText(["Label", "Revenue", "Orders"]);
  });

  test("resolves each series color from delivered chart tokens", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Revenue and orders by quarter, grouped" });
    await expect(chart.locator(".recharts-bar-rectangle path").first()).toBeVisible();
    const colors = await chart.evaluate((root) => {
      const resolve = (value: string) => {
        const probe = document.createElement("span");
        probe.style.color = value;
        root.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      };
      const groups = Array.from(root.querySelectorAll(".recharts-bar"));
      return {
        first: getComputedStyle(groups[0].querySelector("path")!).fill,
        second: getComputedStyle(groups[1].querySelector("path")!).fill,
        expectedFirst: resolve("var(--semantic-action-primary)"),
        expectedSecond: resolve("var(--semantic-text-primary)"),
      };
    });
    expect(colors.first).toBe(colors.expectedFirst);
    expect(colors.second).toBe(colors.expectedSecond);
    expect(colors.first).not.toBe(colors.second);
  });

  test("stacks series into one bar per category and scales 100% stacks to a share axis", async ({ page }) => {
    const stacked = page.getByRole("img", { name: "Revenue and orders by quarter, stacked" });
    await expect(stacked.locator(".recharts-bar-rectangle path")).toHaveCount(8);
    const xs = await stacked.locator(".recharts-bar-rectangle path").evaluateAll((paths) =>
      Array.from(new Set(paths.map((path) => (path.getAttribute("d") ?? "").match(/M\s*(-?[\d.]+),/)?.[1]))),
    );
    expect(xs).toHaveLength(4);
    const percent = page.getByRole("img", { name: "Revenue and orders by quarter, share" });
    const ticks = await percent.locator(".recharts-yAxis-tick-labels text.recharts-cartesian-axis-tick-value").allTextContents();
    expect(ticks.length).toBeGreaterThan(1);
    ticks.forEach((tick) => expect(tick).toMatch(/%$/));
    expect(ticks).toContain("100%");
  });

  test("draws horizontal bars that grow along x with category labels on the y axis", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Sessions by channel" });
    await expect(chart.locator(".recharts-bar-rectangle path")).toHaveCount(4);
    await expect(chart.locator(".recharts-yAxis-tick-labels text.recharts-cartesian-axis-tick-value")).toHaveText(["Search", "Direct", "Referral", "Social"]);
    const widths = await chart.locator(".recharts-bar-rectangle path").evaluateAll((paths) =>
      paths.map((path) => Math.abs(Number((path.getAttribute("d") ?? "").match(/h\s*(-?[\d.]+)/)?.[1]))),
    );
    expect(widths[0]).toBeGreaterThan(widths[3]); // Search (420) is longer than Social (120)
  });

  test("shows a formatted tooltip listing every series on hover, without moving keyboard focus", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Revenue and orders by quarter, grouped" });
    await chart.locator(".recharts-bar-rectangle path").first().hover();
    const tooltip = chart.locator(".recharts-tooltip-wrapper");
    await expect(tooltip).toContainText("Q1");
    await expect(tooltip).toContainText("Revenue");
    await expect(tooltip).toContainText("120K");
    await expect(tooltip).toContainText("Orders");
    await expect(tooltip).toContainText("80");
    await expect(chart.locator('[tabindex]:not([tabindex="-1"])')).toHaveCount(0);
  });

  test("stays inside the viewport at 375px with several series and a legend", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    for (const name of [
      "Revenue and orders by quarter, grouped",
      "Revenue and orders by quarter, stacked",
      "Revenue and orders by quarter, share",
      "Sessions by channel",
    ]) {
      await expect(page.getByRole("img", { name }).locator(".recharts-bar-rectangle path").first()).toBeVisible();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    const legendEscapes = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[role="img"] ul > li')).filter((item) => {
        const rect = item.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 0.5;
      }).length,
    );
    expect(legendEscapes).toBe(0);
  });
});
