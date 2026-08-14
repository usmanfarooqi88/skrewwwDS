import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

const xAxisTickSelector = "text.recharts-cartesian-axis-tick-value";

async function expectReadableXAxis(chart: Locator, expectedLabels: string[]) {
  const ticks = chart.locator(xAxisTickSelector);
  await expect(ticks).toHaveCount(expectedLabels.length);
  expect(await ticks.allTextContents()).toEqual(expectedLabels);
  await expect(chart.locator(".recharts-bar-rectangle path")).toHaveCount(expectedLabels.length);

  const geometry = await chart.evaluate((root, selector) => {
    const svg = root.querySelector("svg");
    if (!svg) throw new Error("Rendered Bar Chart SVG was not found");
    const svgRect = svg.getBoundingClientRect();
    const tickRects = Array.from(root.querySelectorAll(selector)).map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });
    return {
      svg: {
        left: svgRect.left,
        right: svgRect.right,
        top: svgRect.top,
        bottom: svgRect.bottom,
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
  }
  for (let index = 1; index < geometry.tickRects.length; index += 1) {
    expect(geometry.tickRects[index].left).toBeGreaterThanOrEqual(
      geometry.tickRects[index - 1].right - 0.5,
    );
  }
  expect(geometry.documentWidth).toBe(geometry.viewportWidth);
}

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

  test("uses the available desktop width and renders every 7D, 30D, and 90D label", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    const tablist = page.getByRole("tablist").first();
    const sevenDayChart = page.getByRole("img", { name: "Spending overview — 7D" }).first();
    await expectReadableXAxis(sevenDayChart, ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

    const desktopGeometry = await sevenDayChart.evaluate((root) => {
      const chart = root.querySelector(".recharts-responsive-container");
      const card = root.closest('[class*="card"]');
      const plot = root.querySelector("clipPath rect");
      if (!chart || !card || !plot) throw new Error("Banking chart geometry was incomplete");
      return {
        cardWidth: card.getBoundingClientRect().width,
        chartWidth: chart.getBoundingClientRect().width,
        chartHeight: chart.getBoundingClientRect().height,
        plotWidth: Number(plot.getAttribute("width")),
      };
    });
    expect(desktopGeometry.cardWidth).toBeGreaterThanOrEqual(500);
    expect(desktopGeometry.chartWidth).toBeGreaterThanOrEqual(460);
    expect(desktopGeometry.chartHeight).toBe(200);
    expect(desktopGeometry.plotWidth).toBeGreaterThanOrEqual(450);

    await tablist.getByRole("tab", { name: "30D" }).click();
    await expectReadableXAxis(
      page.getByRole("img", { name: "Spending overview — 30D" }).first(),
      ["Week 1", "Week 2", "Week 3", "Week 4"],
    );

    await tablist.getByRole("tab", { name: "90D" }).click();
    await expectReadableXAxis(
      page.getByRole("img", { name: "Spending overview — 90D" }).first(),
      ["Month 1", "Month 2", "Month 3"],
    );
  });

  test("keeps every 7D, 30D, and 90D label readable and contained at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const tablist = page.getByRole("tablist").first();
    await expectReadableXAxis(
      page.getByRole("img", { name: "Spending overview — 7D" }).first(),
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    );

    await tablist.getByRole("tab", { name: "30D" }).click();
    await expectReadableXAxis(
      page.getByRole("img", { name: "Spending overview — 30D" }).first(),
      ["Week 1", "Week 2", "Week 3", "Week 4"],
    );

    await tablist.getByRole("tab", { name: "90D" }).click();
    await expectReadableXAxis(
      page.getByRole("img", { name: "Spending overview — 90D" }).first(),
      ["Month 1", "Month 2", "Month 3"],
    );
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
