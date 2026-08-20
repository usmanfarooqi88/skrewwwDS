import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  rgbaStringToRgba,
  test,
} from "./fixtures";
import type { Page } from "@playwright/test";

/**
 * D3: BASE --semantic-action-danger → danger/500 → #E5484D for non-text chrome.
 * Accessible normal danger text remains --semantic-text-danger → #CC3B37.
 */

const ACTION_DANGER = "#e5484d";
const TEXT_DANGER = "#cc3b37";
const ACTION_DANGER_HOVER = "#b82433";
const NON_TEXT_AA = 3;

async function settle(page: Page) {
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation:none!important}",
  });
}

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
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function resolvedCssVar(page: Page, name: string) {
  const color = await page.evaluate((token) => {
    const el = document.createElement("div");
    el.style.color = `var(${token})`;
    document.body.appendChild(el);
    const value = getComputedStyle(el).color;
    el.remove();
    return value;
  }, name);
  return rgbaStringToRgba(color);
}

test.describe("semantic-action-danger chrome sync (D3)", () => {
  test("resolved BASE token is danger/500 (#E5484D)", async ({ page }) => {
    await page.goto("/components/text-input");
    await settle(page);
    expectColorClose(await resolvedCssVar(page, "--semantic-action-danger"), hexToRgba(ACTION_DANGER));
  });

  test("TextInput invalid border and focus ring use #E5484D", async ({ page }) => {
    await page.goto("/components/text-input");
    await settle(page);
    const input = page.getByLabel("Password");
    expectColorClose(await resolvedRgba(input, "borderColor"), hexToRgba(ACTION_DANGER));

    await input.focus();
    await expect(input).toBeFocused();
    const shadow = await input.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).toMatch(/rgb\(\s*229,\s*72,\s*77\s*\)/);
  });

  test("Checkbox invalid chrome uses #E5484D", async ({ page }) => {
    await page.goto("/components/checkbox");
    await settle(page);
    const checkbox = page.getByRole("checkbox", { name: "Manage billing" });
    expectColorClose(await resolvedRgba(checkbox, "borderColor"), hexToRgba(ACTION_DANGER));
  });

  test("Radio invalid chrome uses #E5484D", async ({ page }) => {
    await page.goto("/components/radio");
    await settle(page);
    const radio = page.getByRole("radio", { name: "Standard" });
    expectColorClose(await resolvedRgba(radio, "borderColor"), hexToRgba(ACTION_DANGER));
  });

  test("Progress Danger indicator resolves #E5484D", async ({ page }) => {
    await page.goto("/components/progress-bar");
    await settle(page);
    const color = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.backgroundColor = "var(--semantic-action-danger)";
      document.body.appendChild(el);
      const value = getComputedStyle(el).backgroundColor;
      el.remove();
      return value;
    });
    expectColorClose(rgbaStringToRgba(color), hexToRgba(ACTION_DANGER));
  });

  test("Link danger label stays #CC3B37; default icon becomes #E5484D; hover label unchanged", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await settle(page);
    const link = page.getByRole("link", { name: "Delete this resource" });
    const label = link.locator("span").filter({ hasText: "Delete this resource" });
    const icon = link.locator('[aria-hidden="true"]');

    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(TEXT_DANGER));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ACTION_DANGER));

    await link.focus();
    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(TEXT_DANGER));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ACTION_DANGER));

    await link.hover();
    await expect
      .poll(async () => {
        const color = await resolvedRgba(label, "color");
        const expected = hexToRgba(ACTION_DANGER_HOVER);
        return (
          Math.abs(color.r - expected.r) <= 4 &&
          Math.abs(color.g - expected.g) <= 4 &&
          Math.abs(color.b - expected.b) <= 4
        );
      })
      .toBe(true);
  });

  test("protected normal-text roles remain #CC3B37, not #E5484D", async ({ page }) => {
    await page.goto("/components/form-field");
    await settle(page);
    const indicator = page
      .locator("label")
      .filter({ hasText: "Workspace name" })
      .locator('[aria-hidden="true"]');
    expectColorClose(await resolvedRgba(indicator, "color"), hexToRgba(TEXT_DANGER));

    expectColorClose(await resolvedCssVar(page, "--semantic-text-danger"), hexToRgba(TEXT_DANGER));
    expectColorClose(await resolvedCssVar(page, "--semantic-action-danger"), hexToRgba(ACTION_DANGER));
  });

  test("non-text #E5484D contrast passes ≥ 3:1 on white and elevated", async ({ page }) => {
    await page.goto("/components/text-input");
    const fg = hexToRgba(ACTION_DANGER);
    expect(contrastRatio(fg, hexToRgba("#ffffff"))).toBeGreaterThanOrEqual(NON_TEXT_AA);
    expect(contrastRatio(fg, hexToRgba("#f7f7f8"))).toBeGreaterThanOrEqual(NON_TEXT_AA);
  });
});
