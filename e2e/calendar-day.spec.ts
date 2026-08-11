import { type Locator, type Page } from "@playwright/test";
import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

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

// Regression coverage for the verified Figma Glass contract (Calendar Day
// component set 2058:2146, Selected 2058:2143), implemented 2026-08-11 —
// shares Button Primary's component/button/primary/background family,
// resting Selected state only (not hover-on-selected, not range).
test.describe("Calendar Day Surface (Layer 3 Glass contract)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/calendar-day");
  });

  test("Selected matches the approved brand/primary contract in Flat, Gradient, and Glass", async ({
    page,
  }) => {
    const selected = page.getByRole("button", { name: "14 July 2026" });
    await expect(selected).toBeVisible();

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(selected, "backgroundColor"), hexToRgba("#6C4CF2"), `${mode} background`);
      expectColorClose(await resolvedRgba(selected, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await selected.evaluate((el) => getComputedStyle(el).backdropFilter), `${mode} backdrop-filter`).toBe(
        "none",
      );
    }

    await setSurfaceMode(page, "glass");
    expectColorClose(await resolvedRgba(selected, "backgroundColor"), hexToRgba("#6C4CF2", 0.18), "glass background");
    expectColorClose(await resolvedRgba(selected, "color"), hexToRgba("#17181B"), "glass content");
    expect(await selected.evaluate((el) => getComputedStyle(el).backdropFilter), "glass backdrop-filter").toBe(
      "blur(16px)",
    );
  });

  test("a non-selected day is unaffected by the Selected Glass fix", async ({ page }) => {
    const plain = page.getByRole("button", { name: "8 July 2026" });
    await setSurfaceMode(page, "glass");
    const bg = await plain.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Resting, non-hovered plain days have no fill at all — must stay
    // transparent, not pick up any brand tint from the Selected fix.
    expect(bg).toBe("rgba(0, 0, 0, 0)");
  });

  function verifiedDays(page: Page) {
    return [
      page.getByRole("button", { name: "8 July 2026" }),
      page.getByRole("button", { name: "11 July 2026" }),
      page.getByRole("button", { name: "14 July 2026" }),
      page.getByRole("button", { name: "20 July 2026" }),
      page.getByRole("button", { name: "2 August 2026" }),
    ];
  }

  test("verified masters stay 32px, 14px, and circular in every global Shape mode", async ({ page }) => {
    for (const shape of ["sharp", "rounded", "pill", "squircle"] as const) {
      await page.evaluate((mode) => document.documentElement.setAttribute("data-skrewww-shape", mode), shape);
      for (const day of verifiedDays(page)) {
        const metrics = await day.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            width: el.getBoundingClientRect().width,
            height: el.getBoundingClientRect().height,
            fontSize: style.fontSize,
            radius: style.borderRadius,
          };
        });
        expect(metrics, `${shape} verified Calendar Day geometry`).toEqual({
          width: 32,
          height: 32,
          fontSize: "14px",
          radius: "9999px",
        });
      }
    }
  });

  test("Default, Today, Disabled, and Outside match their verified state treatments", async ({ page }) => {
    const plain = page.getByRole("button", { name: "8 July 2026" });
    const today = page.getByRole("button", { name: "11 July 2026" });
    const disabled = page.getByRole("button", { name: "20 July 2026" });
    const outside = page.getByRole("button", { name: "2 August 2026" });

    for (const day of [plain, disabled, outside]) {
      expect(await day.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("none");
      expect(await day.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
      expect((await resolvedRgba(day, "backgroundColor")).a).toBe(0);
    }
    expectColorClose(await resolvedRgba(plain, "color"), hexToRgba("#17181B"), "Default content");

    expect(await today.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("none");
    expect(await today.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
    const todayStroke = await today.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(todayStroke, "Today 1.5px inside stroke").toContain("1.5px inset");
    expect(todayStroke, "Today semantic/action/primary stroke color").toContain("rgb(108, 76, 242)");
    expectColorClose(await resolvedRgba(today, "color"), hexToRgba("#17181B"), "Today content");
    expect(await today.locator("span").count()).toBe(1);

    expectColorClose(await resolvedRgba(disabled, "color"), hexToRgba("#A0A3AC"), "Disabled base content");
    expect(await disabled.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.4");
    expectColorClose(await resolvedRgba(outside, "color"), hexToRgba("#A0A3AC"), "Outside content");
    expect(await outside.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  });

  test("Selected has no stroke in every Surface mode without changing geometry", async ({ page }) => {
    const selected = page.getByRole("button", { name: "14 July 2026" });
    for (const mode of ["flat", "gradient", "glass"] as const) {
      await setSurfaceMode(page, mode);
      expect(await selected.evaluate((el) => getComputedStyle(el).borderTopStyle), `${mode} border`).toBe("none");
      expect(await selected.evaluate((el) => getComputedStyle(el).borderTopWidth), `${mode} border width`).toBe("0px");
      expect(await selected.evaluate((el) => [el.getBoundingClientRect().width, el.getBoundingClientRect().height])).toEqual([
        32,
        32,
      ]);
    }
  });
});

test("Calendar Day range geometry remains on its existing code-only contract", async ({ page }) => {
  await page.goto("/components/calendar-grid");
  const grid = page.getByRole("grid").nth(1);
  await grid.getByRole("button", { name: "14 July 2026" }).click();
  await grid.getByRole("button", { name: "20 July 2026" }).click();
  const days = [
    grid.getByRole("button", { name: "Start of range, 14 July 2026" }),
    grid.getByRole("button", { name: "17 July 2026, in range" }),
    grid.getByRole("button", { name: "End of range, 20 July 2026" }),
  ];
  const metrics = await Promise.all(
    days.map((day) =>
      day.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          box: [el.getBoundingClientRect().width, el.getBoundingClientRect().height],
          configuredSize: style.getPropertyValue("--calendar-day-code-only-size").trim(),
          borderWidth: style.borderTopWidth,
        };
      }),
    ),
  );
  for (const { box } of metrics) {
    expect(box[0]).toBeCloseTo(metrics[0].box[0], 1);
    expect(box[1]).toBeCloseTo(metrics[0].box[1], 1);
  }
  expect(metrics.map(({ configuredSize }) => configuredSize)).toEqual(["2.5rem", "2.5rem", "2.5rem"]);
  expect(metrics.map(({ borderWidth }) => borderWidth)).toEqual(["1px", "1px", "1px"]);
});
