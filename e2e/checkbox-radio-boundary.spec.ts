import { expect, expectColorClose, hexToRgba, resolvedRgba, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

/**
 * Boundary geometry and state parity for Checkbox and Radio.
 *
 * Figma verified the *unselected* Default/Hover boundary at 1.5px for both
 * controls. That 1.5px figure is asserted in
 * components/ui/checkbox-radio-boundary.test.ts against the stylesheet
 * source, NOT here: headless Chromium floors a 1.5px border to 1px in its
 * used value (verified at deviceScaleFactor 1, 2 and 3), while headed
 * Chromium preserves 1.5px — so the rendered number is not a valid
 * cross-environment assertion. Everything asserted below is stable in both
 * headed and headless rendering.
 *
 * Radio's selected state keeps React's existing explicit 5px action-primary
 * ring (the dot is the collapsed padding box) — a separate construction,
 * deliberately NOT part of the 1.5px contract, and an integer width that
 * both engines agree on.
 */

const BORDER_DEFAULT = "#DFE0E4";
const BORDER_STRONG = "#A0A3AC";
const ACTION_PRIMARY = "#6C4CF2";

// border-color transitions over 0.15s; reading immediately after .hover()
// can otherwise sample mid-flight. Same rationale as fixtures.ts.
async function settle(page: Page) {
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation:none!important}",
  });
}

function box(locator: Locator) {
  return locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      borderWidth: cs.borderTopWidth,
      boxSizing: cs.boxSizing,
      width: +r.width.toFixed(3),
      height: +r.height.toFixed(3),
      outlineWidth: cs.outlineWidth,
      outlineOffset: cs.outlineOffset,
      outlineStyle: cs.outlineStyle,
    };
  });
}

async function expect16Square(locator: Locator, label: string) {
  const m = await box(locator);
  expect(m.width, `${label} outer width`).toBeCloseTo(16, 3);
  expect(m.height, `${label} outer height`).toBeCloseTo(16, 3);
  return m;
}

test.describe("Checkbox boundary width and geometry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/checkbox");
    await settle(page);
  });

  test("Default: border-default boundary at 16x16, explicit border-box", async ({ page }) => {
    const cb = page.getByLabel("Unchecked", { exact: true });
    const m = await expect16Square(cb, "default");
    expect(m.boxSizing, "explicit box-sizing").toBe("border-box");
    expectColorClose(await resolvedRgba(cb, "borderColor"), hexToRgba(BORDER_DEFAULT), "default colour");
  });

  test("Hover: border-strong boundary, geometry unchanged", async ({ page }) => {
    const cb = page.getByLabel("Unchecked", { exact: true });
    await cb.hover();
    await expect16Square(cb, "hover");
    expectColorClose(await resolvedRgba(cb, "borderColor"), hexToRgba(BORDER_STRONG), "hover colour");
  });

  test("Checked keeps the action-primary boundary and does not grey out on hover", async ({ page }) => {
    const cb = page.getByLabel("Checked", { exact: true });
    await expect16Square(cb, "checked rest");
    expectColorClose(await resolvedRgba(cb, "borderColor"), hexToRgba(ACTION_PRIMARY), "checked rest");

    await cb.hover();
    await expect16Square(cb, "checked hover");
    const hovered = await resolvedRgba(cb, "borderColor");
    expectColorClose(hovered, hexToRgba(ACTION_PRIMARY), "checked hover stays action-primary");
    // Explicit negative: the pre-fix defect painted border-strong here.
    expect(hovered, "checked hover must not become border-strong").not.toEqual(hexToRgba(BORDER_STRONG));
  });

  test("Indeterminate keeps the action-primary boundary and does not grey out on hover", async ({ page }) => {
    const cb = page.getByLabel("Indeterminate", { exact: true });
    await expect16Square(cb, "indeterminate rest");
    expectColorClose(await resolvedRgba(cb, "borderColor"), hexToRgba(ACTION_PRIMARY), "indeterminate rest");

    await cb.hover();
    await expect16Square(cb, "indeterminate hover");
    const hovered = await resolvedRgba(cb, "borderColor");
    expectColorClose(hovered, hexToRgba(ACTION_PRIMARY), "indeterminate hover stays action-primary");
    expect(hovered, "indeterminate hover must not become border-strong").not.toEqual(hexToRgba(BORDER_STRONG));
  });

  test("focus ring contract and geometry are unchanged by the wider boundary", async ({ page }) => {
    const cb = page.getByLabel("Unchecked", { exact: true });
    await cb.focus();
    expect(await cb.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    const m = await expect16Square(cb, "focus");
    expect(m.outlineWidth).toBe("2px");
    expect(m.outlineOffset).toBe("2px");
    expect(m.outlineStyle).toBe("solid");
  });
});

test.describe("Radio boundary width and geometry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/radio");
    await settle(page);
  });

  test("Default: border-default boundary at 16x16, explicit border-box", async ({ page }) => {
    const r = page.getByLabel("Pro", { exact: true });
    const m = await expect16Square(r, "default");
    expect(m.boxSizing, "explicit box-sizing").toBe("border-box");
    expectColorClose(await resolvedRgba(r, "borderColor"), hexToRgba(BORDER_DEFAULT), "default colour");
  });

  test("Hover: border-strong boundary, geometry unchanged", async ({ page }) => {
    const r = page.getByLabel("Pro", { exact: true });
    await r.hover();
    await expect16Square(r, "hover");
    expectColorClose(await resolvedRgba(r, "borderColor"), hexToRgba(BORDER_STRONG), "hover colour");
  });

  test("Selected keeps exactly 5px action-primary and survives hover unchanged", async ({ page }) => {
    const r = page.getByLabel("Starter", { exact: true });
    const rest = await expect16Square(r, "selected rest");
    // The 5px ring is the selected-dot construction — deliberately NOT
    // migrated to 1.5px.
    expect(rest.borderWidth, "selected border width").toBe("5px");
    expectColorClose(await resolvedRgba(r, "borderColor"), hexToRgba(ACTION_PRIMARY), "selected rest");

    await r.hover();
    const hov = await expect16Square(r, "selected hover");
    expect(hov.borderWidth, "selected hover keeps 5px").toBe("5px");
    const hovered = await resolvedRgba(r, "borderColor");
    expectColorClose(hovered, hexToRgba(ACTION_PRIMARY), "selected hover stays action-primary");
    expect(hovered, "selected hover must not become border-strong").not.toEqual(hexToRgba(BORDER_STRONG));
  });

  test("selected dot diameter is unchanged by the wider unselected boundary", async ({ page }) => {
    const r = page.getByLabel("Starter", { exact: true });
    // Dot = padding box = outer - 2 * 5px border.
    const dot = await r.evaluate((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return +(rect.width - 2 * parseFloat(cs.borderLeftWidth)).toFixed(3);
    });
    expect(dot, "selected dot diameter").toBeCloseTo(6, 3);
  });

  test("focus ring contract and geometry are unchanged by the wider boundary", async ({ page }) => {
    const r = page.getByLabel("Pro", { exact: true });
    await r.focus();
    expect(await r.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    const m = await expect16Square(r, "focus");
    expect(m.outlineWidth).toBe("2px");
    expect(m.outlineOffset).toBe("2px");
    expect(m.outlineStyle).toBe("solid");
  });
});
