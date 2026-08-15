import type { Locator, Page } from "@playwright/test";
import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  test,
} from "./fixtures";

const sizes = [
  { label: "Small search", iconSize: 16 },
  { label: "Medium search", iconSize: 20 },
  { label: "Large search", iconSize: 20 },
] as const;

function iconLocators(input: Locator) {
  const control = input.locator("..");
  return {
    leading: control.locator("span").first().locator("svg"),
    clear: control.getByRole("button", { name: "Clear search" }).locator("svg"),
  };
}

async function verifySearchFieldRendering(page: Page) {
  for (const surface of ["flat", "gradient", "glass"] as const) {
    await page.evaluate((mode) => {
      document.documentElement.dataset.skrewwwSurface = mode;
    }, surface);

    for (const size of sizes) {
      const input = page.getByRole("searchbox", { name: size.label });
      const { leading, clear } = iconLocators(input);

      await expect(leading).toHaveCSS("width", `${size.iconSize}px`);
      await expect(leading).toHaveCSS("height", `${size.iconSize}px`);
      await expect(clear).toHaveCSS("width", `${size.iconSize}px`);
      await expect(clear).toHaveCSS("height", `${size.iconSize}px`);

      expectColorClose(
        await resolvedRgba(leading, "color"),
        hexToRgba(surface === "glass" ? "#17181B" : "#a0a3ac"),
        `${surface} ${size.label} leading icon`,
      );
      expectColorClose(
        await resolvedRgba(clear, "color"),
        hexToRgba("#a0a3ac"),
        `${surface} ${size.label} clear icon`,
      );
    }
  }

  const liveInput = page.getByRole("searchbox", { name: "Search components" });
  for (const shape of ["sharp", "rounded", "pill", "squircle"] as const) {
    await page.evaluate((mode) => {
      document.documentElement.dataset.skrewwwShape = mode;
    }, shape);

    const visual = await liveInput.evaluate((element) => {
      const style = getComputedStyle(element);
      return { borderRadius: style.borderRadius, clipPath: style.clipPath };
    });

    if (shape === "sharp") expect(visual.borderRadius).toBe("0px");
    if (shape === "rounded") expect(visual.borderRadius).toBe("6px");
    if (shape === "pill") expect(visual.borderRadius).toBe("9999px");
    if (shape === "squircle") expect(visual.clipPath).toContain("polygon(");
  }

  await liveInput.fill("calendar");
  await liveInput.focus();
  await expect(liveInput).toBeFocused();
  await expect(liveInput.locator("..").getByRole("button", { name: "Clear search" })).toBeVisible();
  await liveInput.press("Escape");
  await expect(liveInput).toHaveValue("");
  await expect(
    liveInput.locator("..").getByRole("button", { name: "Clear search" }),
  ).toHaveCount(0);
}

test.describe("Search Field rendered parity", () => {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 375, height: 812 },
  ] as const) {
    test(`${viewport.name}: sizes, surfaces, shapes, and input behavior`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/components/search-field");

      await verifySearchFieldRendering(page);

      const widths = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      expect(widths.document).toBe(widths.viewport);
    });
  }
});
