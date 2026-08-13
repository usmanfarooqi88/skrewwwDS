import type { Locator } from "@playwright/test";
import { expect, test } from "./fixtures";

async function expectLocalHorizontalScroll(scroller: Locator) {
  const metrics = await scroller.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    overflowX: getComputedStyle(element).overflowX,
  }));

  expect(metrics.overflowX).toBe("auto");
  expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  expect(await scroller.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
    return element.scrollLeft;
  })).toBeGreaterThan(0);
}

test.describe("component documentation responsive containment", () => {
  test("Calendar Grid contains long prose and keeps API/code overflow local at 375px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/components/calendar-grid");

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBe(widths.viewport);

    const rangeSection = page
      .getByRole("heading", { name: "How does range selection work?", exact: true })
      .locator("..");
    expect(await rangeSection.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(
      await rangeSection.evaluate((element) => element.clientWidth),
    );

    const apiSection = page
      .getByRole("heading", { name: "Component API", exact: true })
      .locator("..");
    await expectLocalHorizontalScroll(apiSection.locator("table").locator(".."));

    const exampleSection = page
      .getByRole("heading", { name: "React example", exact: true })
      .locator("..");
    await expectLocalHorizontalScroll(exampleSection.locator("pre"));
  });

  test("Calendar Grid desktop documentation remains contained without clipping", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/components/calendar-grid");

    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      clippedSections: Array.from(document.querySelectorAll("article section")).filter(
        (section) => section.scrollWidth > section.clientWidth,
      ).length,
    }));

    expect(metrics.document).toBe(metrics.viewport);
    expect(metrics.clippedSections).toBe(0);
  });

  test("another API-heavy component page remains contained at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/components/data-table");

    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBe(widths.viewport);
    await expect(
      page.getByRole("heading", { name: "Component API", exact: true }),
    ).toBeVisible();
  });
});
