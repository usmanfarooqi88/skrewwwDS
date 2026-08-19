import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  rgbaStringToRgba,
  setSurfaceMode,
  test,
} from "./fixtures";
import type { Locator, Page } from "@playwright/test";

const ERROR = "#cc3b37";
const WARNING = "#b36a00";
const SUCCESS = "#1a8b4c";
const INFO = "#2563c7";
const AA_NORMAL_TEXT = 4.5;
const SURFACES = ["flat", "gradient", "glass"] as const;

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

async function errorMessage(page: Page) {
  const text = page.getByText("Enter a valid email address.", { exact: true });
  const icon = text.locator("xpath=preceding-sibling::*[name()='svg'][1]");
  return { text, icon };
}

test.describe("Validation Message error-text contract", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/validation-message");
  });

  for (const mode of SURFACES) {
    test(`Error text and icon resolve #CC3B37 in ${mode}`, async ({ page }) => {
      await setSurfaceMode(page, mode);
      const { text, icon } = await errorMessage(page);
      expectColorClose(await resolvedRgba(text, "color"), hexToRgba(ERROR), `${mode} text`);
      expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ERROR), `${mode} icon`);
    });
  }

  test("Error text meets AA on its actual rendered background", async ({ page }) => {
    await setSurfaceMode(page, "flat");
    const { text } = await errorMessage(page);
    const fg = await resolvedRgba(text, "color");
    const bg = await effectiveBackground(text);
    expect(bg.a).toBeGreaterThan(0.99);
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test("Warning, Success, and Info colors are unchanged", async ({ page }) => {
    await setSurfaceMode(page, "flat");
    expectColorClose(
      await resolvedRgba(page.getByText("This action cannot be undone.", { exact: true }), "color"),
      hexToRgba(WARNING),
    );
    expectColorClose(
      await resolvedRgba(page.getByText("Profile saved successfully.", { exact: true }), "color"),
      hexToRgba(SUCCESS),
    );
    expectColorClose(
      await resolvedRgba(page.getByText("We will never share your email.", { exact: true }), "color"),
      hexToRgba(INFO),
    );
  });
});

test.describe("Form Field error composition", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/form-field");
  });

  test("error path renders ValidationMessage with the error-text token", async ({ page }) => {
    const message = page.getByText("Enter a valid API key.", { exact: true });
    await expect(message).toBeVisible();
    expectColorClose(await resolvedRgba(message, "color"), hexToRgba(ERROR));
    const icon = message.locator("xpath=preceding-sibling::*[name()='svg'][1]");
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ERROR));
  });
});
