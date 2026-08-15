import { expect, expectColorClose, hexToRgba, resolvedRgba, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

/**
 * Cross-cutting verification for the Phase 2 --semantic-border-strong sync
 * (neutral/300 #C5C6CC -> neutral/400 #A0A3AC). Covers every legitimate
 * consumer family in one place, plus a Button Secondary regression guard
 * (Button no longer consumes this token — see button.spec.ts's own
 * dedicated Card-highlight-contract coverage for that side of Phase 1).
 */

const BORDER_STRONG = "#A0A3AC";
const BORDER_DEFAULT = "#DFE0E4";

// Reading borderColor immediately after .hover() can otherwise catch the
// 0.15s border-color transition mid-flight — see setSurfaceMode's
// rationale comment in fixtures.ts for the same real, observed flake.
async function disableTransitions(page: Page) {
  await page.evaluate(() => {
    if (!document.getElementById("__e2e-disable-transitions")) {
      const style = document.createElement("style");
      style.id = "__e2e-disable-transitions";
      style.textContent =
        "*, *::before, *::after { transition: none !important; animation: none !important; }";
      document.head.appendChild(style);
    }
  });
}

async function hoverBorderColor(page: Page, control: Locator) {
  await control.hover();
  return resolvedRgba(control, "borderColor");
}

test.describe("Text-entry family shares the semantic-border-strong Hover contract", () => {
  test("Text Input: Default stays semantic-border-default, Hover resolves to neutral/400", async ({ page }) => {
    await page.goto("/components/text-input");
    await disableTransitions(page);
    const input = page.getByLabel("Email address");
    expectColorClose(await resolvedRgba(input, "borderColor"), hexToRgba(BORDER_DEFAULT), "default");
    expectColorClose(await hoverBorderColor(page, input), hexToRgba(BORDER_STRONG), "hover");
  });

  test("Textarea Hover resolves to neutral/400", async ({ page }) => {
    await page.goto("/components/textarea");
    await disableTransitions(page);
    const textarea = page.getByLabel("Description");
    expectColorClose(await hoverBorderColor(page, textarea), hexToRgba(BORDER_STRONG), "hover");
  });

  test("Select Hover resolves to neutral/400", async ({ page }) => {
    await page.goto("/components/select");
    await disableTransitions(page);
    const trigger = page.getByRole("combobox", { name: /Role/ });
    expectColorClose(await hoverBorderColor(page, trigger), hexToRgba(BORDER_STRONG), "hover");
  });

  test("Search Field Hover resolves to neutral/400", async ({ page }) => {
    await page.goto("/components/search-field");
    await disableTransitions(page);
    const field = page.getByRole("searchbox", { name: "Search components" });
    expectColorClose(await hoverBorderColor(page, field), hexToRgba(BORDER_STRONG), "hover");
  });

  test("Combobox Hover resolves to neutral/400", async ({ page }) => {
    await page.goto("/components/combobox");
    await disableTransitions(page);
    const trigger = page.getByRole("combobox", { name: "Country", exact: true });
    expectColorClose(await hoverBorderColor(page, trigger), hexToRgba(BORDER_STRONG), "hover");
  });

  test("Date Picker Hover resolves to neutral/400", async ({ page }) => {
    await page.goto("/components/date-picker");
    await disableTransitions(page);
    const input = page.getByLabel("Release date");
    expectColorClose(await hoverBorderColor(page, input), hexToRgba(BORDER_STRONG), "hover");
  });
});

test.describe("Checkbox and Radio share the semantic-border-strong Hover contract", () => {
  test("Checkbox: Default/Hover/Checked/Disabled/Focus", async ({ page }) => {
    await page.goto("/components/checkbox");
    await disableTransitions(page);
    const unchecked = page.getByLabel("Unchecked", { exact: true });
    expectColorClose(await resolvedRgba(unchecked, "borderColor"), hexToRgba(BORDER_DEFAULT), "default");
    expectColorClose(await hoverBorderColor(page, unchecked), hexToRgba(BORDER_STRONG), "hover");

    // Checked keeps its existing action-primary treatment, unaffected by
    // this token's value.
    const checked = page.getByLabel("Checked", { exact: true });
    expectColorClose(await resolvedRgba(checked, "borderColor"), hexToRgba("#6C4CF2"), "checked unaffected");

    const disabled = page.getByLabel("Disabled");
    expect(await disabled.isDisabled()).toBe(true);
    const disabledBorder = await resolvedRgba(disabled, "borderColor");
    // Disabled uses a separate token family — must not have picked up
    // neutral/400.
    expect(disabledBorder).not.toEqual(hexToRgba(BORDER_STRONG));

    await unchecked.focus();
    const outline = await unchecked.evaluate((el) => getComputedStyle(el).outlineColor);
    expect(outline, "focus ring independent of border-strong").not.toBe("");
  });

  test("Radio: Default/Hover/Selected/Focus", async ({ page }) => {
    await page.goto("/components/radio");
    await disableTransitions(page);
    const starter = page.getByLabel("Pro");
    expectColorClose(await resolvedRgba(starter, "borderColor"), hexToRgba(BORDER_DEFAULT), "default");
    expectColorClose(await hoverBorderColor(page, starter), hexToRgba(BORDER_STRONG), "hover");

    const selected = page.getByLabel("Starter");
    expectColorClose(await resolvedRgba(selected, "borderColor"), hexToRgba("#6C4CF2"), "selected unaffected");
  });
});

test.describe("Button Secondary regression guard (must remain unaffected by Phase 2)", () => {
  test("Secondary boundary is unchanged by the semantic-border-strong value sync", async ({ page }) => {
    await page.goto("/components/button");
    await disableTransitions(page);
    const secondary = page.getByRole("button", { name: "Secondary", exact: true });
    const surface = secondary.locator('[aria-hidden="true"]').first();

    // Default boundary is still the Card highlight family's Flat value,
    // never neutral/400.
    const defaultBorder = await resolvedRgba(surface, "borderColor");
    expectColorClose(defaultBorder, hexToRgba(BORDER_DEFAULT), "default unaffected");

    await secondary.hover();
    const hoverBorder = await resolvedRgba(surface, "borderColor");
    expectColorClose(hoverBorder, hexToRgba(BORDER_DEFAULT), "hover boundary still unchanged, not neutral/400");
  });
});
