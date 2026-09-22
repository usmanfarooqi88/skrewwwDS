import { expect, test } from "./fixtures";

test.describe("Chart Metric browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/chart-metric");
  });

  test("renders with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await expect(page.getByTestId("chart-metric-preview-value-only").getByText("$4,231.09")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("shows the same neutral text color for up, down, and flat deltas — never a status color, and matches the label's own neutral color", async ({
    page,
  }) => {
    // Resolved via a standalone probe, not read from a chart element: a one-shot
    // getComputedStyle() read on the delta/label elements themselves proved racy
    // against post-hydration re-renders (an occasional empty-string read even
    // after the element is visible). expect(locator).toHaveCSS() below instead
    // polls/retries until the value is stable, which is immune to that race.
    const expectedColor = await page.evaluate(() => {
      const probe = document.createElement("span");
      probe.style.color = "var(--semantic-text-secondary)";
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });

    const card = page.getByTestId("chart-metric-preview-delta");
    const revenue = card.locator("text=Revenue").locator("..");
    const errorRate = card.locator("text=Error rate").locator("..");
    const activeUsers = card.locator("text=Active users").locator("..");

    for (const metric of [revenue, errorRate, activeUsers]) {
      await expect(metric.locator('[class*="delta"]').first()).toHaveCSS("color", expectedColor);
    }
    // Same neutral token as the metric's own label, not a feedback/status color.
    await expect(revenue.locator("p").first()).toHaveCSS("color", expectedColor);
  });

  test("announces the direction word even though the icon is hidden from assistive tech", async ({ page }) => {
    const revenue = page.getByTestId("chart-metric-preview-delta").locator("text=Revenue").locator("..");
    await expect(revenue.getByText("Increased", { exact: false })).toHaveCSS("position", "absolute");
    const icon = revenue.locator("svg").first();
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  test("stays inside the viewport at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(page.getByTestId("chart-metric-preview-value-only").getByText("$4,231.09")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});
