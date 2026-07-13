import { expect, test, type Locator } from "@playwright/test";

async function expectHoverContrastAa(button: Locator) {
  await button.hover();
  const result = await button.evaluate((el) => {
    function resolveOpaqueRgb(
      color: string,
      canvas: { r: number; g: number; b: number } = { r: 255, g: 255, b: 255 },
    ) {
      if (!color || color === "transparent") return canvas;

      const rgbMatch = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/.exec(color);
      if (rgbMatch) {
        const r = Number(rgbMatch[1]);
        const g = Number(rgbMatch[2]);
        const b = Number(rgbMatch[3]);
        const alpha = rgbMatch[4] ? Number(rgbMatch[4]) : 1;
        return {
          r: Math.round(r * alpha + canvas.r * (1 - alpha)),
          g: Math.round(g * alpha + canvas.g * (1 - alpha)),
          b: Math.round(b * alpha + canvas.b * (1 - alpha)),
        };
      }

      const srgbMatch = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/.exec(
        color,
      );
      if (srgbMatch) {
        const r = Math.round(Number(srgbMatch[1]) * 255);
        const g = Math.round(Number(srgbMatch[2]) * 255);
        const b = Math.round(Number(srgbMatch[3]) * 255);
        const alpha = srgbMatch[4] ? Number(srgbMatch[4]) : 1;
        return {
          r: Math.round(r * alpha + canvas.r * (1 - alpha)),
          g: Math.round(g * alpha + canvas.g * (1 - alpha)),
          b: Math.round(b * alpha + canvas.b * (1 - alpha)),
        };
      }

      return null;
    }

    function channelLuminance(channel: number) {
      const normalized = channel / 255;
      return normalized <= 0.03928
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    }

    function relativeLuminance(color: { r: number; g: number; b: number }) {
      return (
        0.2126 * channelLuminance(color.r) +
        0.7152 * channelLuminance(color.g) +
        0.0722 * channelLuminance(color.b)
      );
    }

    function contrastRatio(
      foreground: { r: number; g: number; b: number },
      background: { r: number; g: number; b: number },
    ) {
      const l1 = relativeLuminance(foreground);
      const l2 = relativeLuminance(background);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    const style = getComputedStyle(el);
    const fg = resolveOpaqueRgb(style.color);
    const bg = resolveOpaqueRgb(style.backgroundColor);
    if (!fg || !bg) {
      return { ratio: 0, color: style.color, backgroundColor: style.backgroundColor };
    }
    return {
      ratio: contrastRatio(fg, bg),
      color: style.color,
      backgroundColor: style.backgroundColor,
    };
  });

  expect(
    result.ratio,
    `Expected WCAG AA contrast for ${result.color} on ${result.backgroundColor}`,
  ).toBeGreaterThanOrEqual(4.5);
}

test.describe("Calendar Day hover contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/calendar-day");
  });

  test("selected + hover meets WCAG AA contrast", async ({ page }) => {
    await expectHoverContrastAa(page.getByRole("button", { name: "14 July 2026" }));
  });

  test("today + hover meets WCAG AA contrast", async ({ page }) => {
    await expectHoverContrastAa(page.locator('button[aria-current="date"]'));
  });

  test("disabled day does not change background on hover", async ({ page }) => {
    const disabled = page.getByRole("button", { name: "20 July 2026" });
    const before = await disabled.evaluate((el) => getComputedStyle(el).backgroundColor);
    await disabled.hover();
    const after = await disabled.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(after).toBe(before);
  });
});

test.describe("Calendar Day range hover contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/calendar-grid");
  });

  test("range start, middle, and end + hover meet WCAG AA contrast", async ({ page }) => {
    const grid = page.getByRole("grid").nth(1);
    await grid.getByRole("button", { name: "14 July 2026" }).click();
    await grid.getByRole("button", { name: "20 July 2026" }).click();

    await expectHoverContrastAa(
      grid.getByRole("button", { name: "Start of range, 14 July 2026" }),
    );
    await expectHoverContrastAa(grid.getByRole("button", { name: "End of range, 20 July 2026" }));
    await expectHoverContrastAa(grid.getByRole("button", { name: "17 July 2026, in range" }));
  });
});
