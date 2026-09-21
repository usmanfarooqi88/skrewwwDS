import { expect, test } from "./fixtures";

const MAIN = "Monthly active users";

test.describe("Area Chart browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/area-chart");
  });

  test("renders the chart with an accessible name and no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await expect(page.getByRole("img", { name: MAIN })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("draws a translucent fill under a stroke in the brand series color, with the data in a hidden table", async ({ page }) => {
    const chart = page.getByRole("img", { name: MAIN });
    await expect(chart.locator(".recharts-area-area")).toHaveCount(1);
    const stroke = await chart.locator(".recharts-area-curve").evaluate((el) => getComputedStyle(el).stroke);
    const expected = await chart.evaluate((root) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--semantic-action-primary)";
      root.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(stroke).toBe(expected);
    expect(Number(await chart.locator(".recharts-area-area").evaluate((el) => getComputedStyle(el).fillOpacity))).toBeLessThan(0.5);
    const table = page.getByRole("table", { name: MAIN });
    await expect(table.getByRole("row", { name: /Jun/ })).toHaveText(/300/);
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

  test("overlaps, stacks and share-stacks series with a legend and one table column per series", async ({ page }) => {
    const overlapped = page.getByRole("img", { name: "Traffic by platform, overlapped" });
    await expect(overlapped.locator(".recharts-area-curve")).toHaveCount(2);
    await expect(overlapped.locator("ul > li")).toHaveText(["Web", "Mobile"]);
    const table = page.getByRole("table", { name: "Traffic by platform, overlapped" });
    await expect(table.getByRole("columnheader")).toHaveText(["Label", "Web", "Mobile"]);

    const tops = async (name: string) =>
      page.getByRole("img", { name }).locator(".recharts-area-curve").evaluateAll((curves) =>
        curves.map((curve) => Math.min(...((curve.getAttribute("d") ?? "").match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, index) => index % 2 === 1))),
      );
    const [stackedFirst, stackedSecond] = await tops("Traffic by platform, stacked");
    expect(stackedSecond).toBeLessThan(stackedFirst);

    const percent = page.getByRole("img", { name: "Traffic by platform, share" });
    const ticks = await percent.locator(".recharts-yAxis-tick-labels text.recharts-cartesian-axis-tick-value").allTextContents();
    expect(ticks).toContain("100%");
  });

  test("shows a formatted tooltip listing every series on hover", async ({ page }) => {
    const chart = page.getByRole("img", { name: "Traffic by platform, overlapped" });
    await chart.locator("svg.recharts-surface").hover({ position: { x: 200, y: 120 } });
    const tooltip = chart.locator(".recharts-tooltip-wrapper");
    await expect(tooltip).toContainText("Web");
    await expect(tooltip).toContainText("Mobile");
  });

  test("stays inside the viewport at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    for (const name of [MAIN, "Traffic by platform, overlapped", "Traffic by platform, stacked", "Traffic by platform, share"]) {
      await expect(page.getByRole("img", { name }).locator(".recharts-area-curve").first()).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});
