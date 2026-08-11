import type { Page } from "@playwright/test";
import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

test.describe("Pagination browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/pagination");
  });

  function paginationLocators(page: Page) {
    // Scoped to the Pagination component itself — the docs sidebar also
    // marks its own "current page" nav link with aria-current="page", and
    // an unscoped [aria-current="page"] locator matches that one first.
    const nav = page.locator('nav[aria-label="Pagination"]').first();
    const current = nav.locator('[aria-current="page"]').first();
    const other = nav.locator('a[aria-label^="Page "]').first();
    const ellipsis = nav.locator('[class*="ellipsis"]').first();
    return { current, other, ellipsis };
  }

  // Regression check for a real CSS specificity bug: [data-skrewww-surface="glass"]
  // .control (specificity 0,2,0) silently beat .current's own background rule
  // (specificity 0,1,0), collapsing the current-page indicator into the same
  // translucent fill as every other page control in Glass mode.
  test("current-page control keeps a distinct background from other controls in Glass mode", async ({
    page,
  }) => {
    await setSurfaceMode(page, "glass");
    const { current, other } = paginationLocators(page);
    await expect(current).toBeVisible();
    await expect(other).toBeVisible();

    const [currentBackground, otherBackground] = await Promise.all([
      resolvedRgba(current, "backgroundColor"),
      resolvedRgba(other, "backgroundColor"),
    ]);

    const delta =
      Math.abs(currentBackground.r - otherBackground.r) +
      Math.abs(currentBackground.g - otherBackground.g) +
      Math.abs(currentBackground.b - otherBackground.b) +
      Math.abs(currentBackground.a - otherBackground.a) * 255;
    expect(
      delta,
      `current ${JSON.stringify(currentBackground)} vs other ${JSON.stringify(otherBackground)}`,
    ).toBeGreaterThan(15);
  });

  // Matches the approved Figma Page Item Current contract (component set
  // 2024:2894, Current 2024:2892) — brand/primary family, not the
  // previously-shipped neutral/elevated treatment.
  test("matches the approved brand/primary contract in Flat, Gradient, and Glass", async ({
    page,
  }) => {
    const { current } = paginationLocators(page);
    await expect(current).toBeVisible();

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      const bg = await resolvedRgba(current, "backgroundColor");
      const color = await resolvedRgba(current, "color");
      const backdrop = await current.evaluate((el) => getComputedStyle(el).backdropFilter);
      expectColorClose(bg, hexToRgba("#6C4CF2"), `${mode} background`);
      expectColorClose(color, hexToRgba("#FFFFFF"), `${mode} content`);
      expect(backdrop, `${mode} backdrop-filter`).toBe("none");
    }

    await setSurfaceMode(page, "glass");
    const glassBg = await resolvedRgba(current, "backgroundColor");
    const glassColor = await resolvedRgba(current, "color");
    const glassBackdrop = await current.evaluate((el) => getComputedStyle(el).backdropFilter);
    expectColorClose(glassBg, hexToRgba("#6C4CF2", 0.18), "glass background");
    expectColorClose(glassColor, hexToRgba("#17181B"), "glass content");
    expect(glassBackdrop, "glass backdrop-filter").toBe("blur(16px)");
  });

  test("Current has verified geometry, typography, and no stroke in every Surface mode", async ({ page }) => {
    const { current } = paginationLocators(page);
    for (const mode of ["flat", "gradient", "glass"] as const) {
      await setSurfaceMode(page, mode);
      const result = await current.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          borderWidth: style.borderTopWidth,
          borderStyle: style.borderTopStyle,
        };
      });
      expect(result, `${mode} Current`).toEqual({
        width: 32,
        height: 32,
        fontSize: "16px",
        fontWeight: "700",
        borderWidth: "0px",
        borderStyle: "none",
      });
    }
  });

  test("Default has no fill, stroke, or blur and uses component/surface/content", async ({ page }) => {
    const { other } = paginationLocators(page);
    await expect(other).toBeVisible();

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expect((await resolvedRgba(other, "backgroundColor")).a, `${mode} background alpha`).toBe(0);
      expectColorClose(await resolvedRgba(other, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await other.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("none");
    }

    await setSurfaceMode(page, "glass");
    expect((await resolvedRgba(other, "backgroundColor")).a, "Glass background alpha").toBe(0);
    expectColorClose(await resolvedRgba(other, "color"), hexToRgba("#17181B"), "Glass content");
    expect(await other.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("none");

    const metrics = await other.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        borderWidth: style.borderTopWidth,
      };
    });
    expect(metrics).toEqual({ width: 32, height: 32, fontSize: "16px", fontWeight: "400", borderWidth: "0px" });
  });

  test("Hover uses the verified Surface fill, content, blur, and no stroke", async ({ page }) => {
    const { other } = paginationLocators(page);
    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      await other.hover();
      expectColorClose(await resolvedRgba(other, "backgroundColor"), hexToRgba("#F7F7F8"), `${mode} fill`);
      expectColorClose(await resolvedRgba(other, "color"), hexToRgba("#17181B"), `${mode} content`);
      expect(await other.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("none");
      expect(await other.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
    }

    await setSurfaceMode(page, "glass");
    await other.hover();
    expectColorClose(await resolvedRgba(other, "backgroundColor"), hexToRgba("#FFFFFF", 0.2), "Glass fill");
    expectColorClose(await resolvedRgba(other, "color"), hexToRgba("#17181B"), "Glass content");
    expect(await other.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("blur(16px)");
    expect(await other.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
  });

  test("ellipsis matches verified geometry, typography, and Surface content", async ({ page }) => {
    const { ellipsis } = paginationLocators(page);
    await expect(ellipsis).toBeVisible();
    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(ellipsis, "color"), hexToRgba("#A0A3AC"), `${mode} content`);
    }
    await setSurfaceMode(page, "glass");
    expectColorClose(await resolvedRgba(ellipsis, "color"), hexToRgba("#17181B"), "Glass content");
    expect(await ellipsis.evaluate((el) => {
      const style = getComputedStyle(el);
      return [el.getBoundingClientRect().width, el.getBoundingClientRect().height, style.fontSize];
    })).toEqual([32, 32, "16px"]);
  });

  test("Disabled Page Item uses the verified base content and whole-component opacity", async ({ page }) => {
    const { other } = paginationLocators(page);
    await other.evaluate((source) => {
      const disabledRule = Array.from(document.styleSheets)
        .flatMap((sheet) => {
          try {
            return Array.from(sheet.cssRules);
          } catch {
            return [];
          }
        })
        .find(
          (rule): rule is CSSStyleRule =>
            rule instanceof CSSStyleRule &&
            rule.style.opacity === "var(--opacity-disabled)" &&
            Array.from(source.classList).some((className) =>
              rule.selectorText.includes(`.${CSS.escape(className)}`),
            ),
        );
      if (!disabledRule) throw new Error("Pagination disabled Page Item rule was not loaded");
      const disabledClass = Array.from(disabledRule.selectorText.matchAll(/\.([\w-]+)/g))
        .map((match) => match[1])
        .find((className) => !source.classList.contains(className));
      if (!disabledClass) throw new Error("Pagination disabled class could not be resolved");

      const clone = source.cloneNode(true) as HTMLElement;
      clone.classList.add(disabledClass);
      clone.removeAttribute("href");
      clone.setAttribute("aria-disabled", "true");
      clone.setAttribute("data-e2e-disabled-page", "true");
      source.parentElement?.appendChild(clone);
    });

    const disabled = page.locator('[data-e2e-disabled-page="true"]');
    expectColorClose(await resolvedRgba(disabled, "color"), hexToRgba("#A0A3AC"), "disabled base content");
    const result = await disabled.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        opacity: style.opacity,
        borderWidth: style.borderTopWidth,
        backgroundAlpha: style.backgroundColor === "rgba(0, 0, 0, 0)" ? 0 : 1,
      };
    });
    expect(result).toEqual({
      width: 32,
      height: 32,
      fontSize: "16px",
      fontWeight: "400",
      opacity: "0.4",
      borderWidth: "0px",
      backgroundAlpha: 0,
    });
  });

  test("Page Item Shape modes resolve without geometry shift", async ({ page }) => {
    const { current, other } = paginationLocators(page);
    const cases = [
      { mode: "sharp", radius: "0px", clipped: false },
      { mode: "rounded", radius: "4px", clipped: false },
      { mode: "pill", radius: "9999px", clipped: false },
      { mode: "squircle", radius: "8px", clipped: true },
    ] as const;
    for (const expected of cases) {
      await page.evaluate((mode) => document.documentElement.setAttribute("data-skrewww-shape", mode), expected.mode);
      for (const item of [current, other]) {
        const result = await item.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            radius: style.borderRadius,
            clipPath: style.clipPath,
            box: [el.getBoundingClientRect().width, el.getBoundingClientRect().height],
          };
        });
        expect(result.radius).toBe(expected.radius);
        expect(result.box).toEqual([32, 32]);
        expect(result.clipPath === "none").toBe(!expected.clipped);
      }
    }
  });
});
