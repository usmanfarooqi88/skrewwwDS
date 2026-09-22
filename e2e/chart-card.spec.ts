import { expect, test } from "./fixtures";

test.describe("Chart Card browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/chart-card");
  });

  test("renders with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Monthly signups" }).first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("keeps the chart out of the keyboard tab order while header/action controls remain reachable", async ({ page }) => {
    // Sanity: at least one chart and at least one tab control exist on this page.
    await expect(page.getByRole("img").first()).toBeVisible();
    await expect(page.getByRole("tab").first()).toBeVisible();

    await expect(page.locator('[role="img"] [tabindex]:not([tabindex="-1"]), [role="img"] [role="application"]')).toHaveCount(0);

    // Real keyboard traversal never lands inside a chart's aria-hidden visual, and does reach at least one tab.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    let reachedTab = false;
    for (let step = 0; step < 150; step += 1) {
      await page.keyboard.press("Tab");
      const state = await page.evaluate(() => ({
        insideChart: Boolean(document.activeElement?.closest('[role="img"]')),
        isTab: document.activeElement?.getAttribute("role") === "tab",
      }));
      expect(state.insideChart, `Tab step ${step + 1} landed inside a chart`).toBe(false);
      if (state.isTab) reachedTab = true;
    }
    expect(reachedTab).toBe(true);
  });

  test("switches the states demo between ready, loading, empty, and error, each with distinct accessible content and no layout collapse", async ({
    page,
  }) => {
    const section = page.getByTestId("chart-card-preview-states");
    const readyButton = section.getByRole("button", { name: "ready", exact: true });
    const loadingButton = section.getByRole("button", { name: "loading", exact: true });
    const emptyButton = section.getByRole("button", { name: "empty", exact: true });
    const errorButton = section.getByRole("button", { name: "error", exact: true });

    const contentBox = section.locator('[class^="chart-card-module"][class*="content"]').first();
    // A stable (twice-identical) reading, not a one-shot boundingBox() read: a single
    // synchronous read here proved racy against layout settling when this test runs
    // alongside others in the same file/worker (reliable in isolation, occasionally
    // flaked in the full suite).
    async function stableHeight(): Promise<number> {
      let previous = -1;
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const current = (await contentBox.boundingBox())?.height ?? 0;
        if (current === previous && current > 0) return current;
        previous = current;
        await page.waitForTimeout(50);
      }
      return previous;
    }

    await expect(section.getByRole("img", { name: "Monthly signups" })).toBeVisible();
    const readyHeight = await stableHeight();

    await loadingButton.click();
    await expect(section.locator('[aria-busy="true"]')).toBeVisible();
    const loadingHeight = await stableHeight();
    expect(Math.abs(loadingHeight - readyHeight)).toBeLessThan(2);

    await emptyButton.click();
    await expect(section.getByRole("heading", { name: "No data" })).toBeVisible();

    await errorButton.click();
    await expect(section.getByRole("status")).toBeVisible();
    await expect(section.getByRole("button", { name: "Retry" })).toBeVisible();

    await readyButton.click();
    await expect(section.getByRole("img", { name: "Monthly signups" })).toBeVisible();
  });

  test("stays inside the viewport at 375px, with the header actions reflowing under the title", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Monthly signups" }).first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);

    const rangeCard = page.getByTestId("chart-card-preview-time-range");
    const title = rangeCard.getByRole("heading", { name: "Spending overview" });
    const tabs = rangeCard.getByRole("tablist");
    const titleBox = await title.boundingBox();
    const tabsBox = await tabs.boundingBox();
    // Either they sit on separate lines (wrapped) or don't horizontally overlap — never collide.
    const overlapsHorizontally = titleBox && tabsBox && titleBox.x < tabsBox.x + tabsBox.width && tabsBox.x < titleBox.x + titleBox.width;
    const overlapsVertically = titleBox && tabsBox && titleBox.y < tabsBox.y + tabsBox.height && tabsBox.y < titleBox.y + titleBox.height;
    expect(overlapsHorizontally && overlapsVertically).toBe(false);
  });

  test("the time-range composition switches the chart per tab, each with its own accessible name", async ({ page }) => {
    const rangeCard = page.getByTestId("chart-card-preview-time-range");
    await expect(rangeCard.getByRole("img", { name: "Spending overview — 30D" })).toBeVisible();
    await rangeCard.getByRole("tab", { name: "7D" }).click();
    await expect(rangeCard.getByRole("img", { name: "Spending overview — 7D" })).toBeVisible();
    await expect(rangeCard.getByRole("img", { name: "Spending overview — 30D" })).toHaveCount(0);
  });
});
