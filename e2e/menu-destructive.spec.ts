import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  rgbaStringToRgba,
  test,
} from "./fixtures";
import type { Locator } from "@playwright/test";

const DANGER_TEXT = "#cc3b37";
const HOVER_SURFACE = "#f7f7f8";
const ICON_MUTED = "#a0a3ac";
const DISABLED_TEXT = "#a0a3ac";
const AA_NORMAL_TEXT = 4.5;

function contrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number },
) {
  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const ch = (v: number) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  };
  return (Math.max(luminance(fg), luminance(bg)) + 0.05) / (Math.min(luminance(fg), luminance(bg)) + 0.05);
}

async function effectiveBackground(locator: Locator) {
  const rgba = await locator.evaluate((el) => {
    let node: Element | null = el;
    let bg = "rgba(0, 0, 0, 0)";
    while (node && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
      bg = getComputedStyle(node).backgroundColor;
      node = node.parentElement;
    }
    return bg;
  });
  return rgbaStringToRgba(rgba);
}

async function expectDangerLabel(label: Locator) {
  const color = await resolvedRgba(label, "color");
  const background = await effectiveBackground(label);
  expectColorClose(color, hexToRgba(DANGER_TEXT));
  expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
}

test.describe("Menu destructive text contract", () => {
  test("destructive label uses semantic-text-danger on default, hover, and focus-visible", async ({
    page,
  }) => {
    await page.goto("/components/menu");
    await page.getByRole("button", { name: "Project actions" }).click();

    const item = page.getByRole("menuitem", { name: "Delete project" });
    const label = item.locator('[class*="itemLabel"]');
    const icon = item.locator('[class*="itemIcon"]');

    await expectDangerLabel(label);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ICON_MUTED));

    await item.hover();
    await expectDangerLabel(label);
    expectColorClose(await resolvedRgba(item, "backgroundColor"), hexToRgba(HOVER_SURFACE));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ICON_MUTED));

    await item.focus();
    await expect(item).toBeFocused();
    await expectDangerLabel(label);
    expectColorClose(await resolvedRgba(item, "backgroundColor"), hexToRgba(HOVER_SURFACE));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ICON_MUTED));
  });

  test("destructive + disabled prefers disabled text and stays non-interactive", async ({ page }) => {
    await page.goto("/components/menu");
    await page.getByRole("button", { name: "More actions" }).click();

    const item = page.getByRole("menuitem", { name: "Delete (disabled)" });
    const label = item.locator('[class*="itemLabel"]');
    const icon = item.locator('[class*="itemIcon"]');

    await expect(item).toHaveAttribute("aria-disabled", "true");
    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(DISABLED_TEXT));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ICON_MUTED));

    const lastAction = page.getByText(/Last action:/);
    const before = await lastAction.textContent();
    await item.click({ force: true });
    await expect(lastAction).toHaveText(before ?? "");
  });
});
