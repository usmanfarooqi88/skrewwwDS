import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode } from "./fixtures";

function basicCountryInput(page: Page): Locator {
  return page
    .locator('input[placeholder="Search countries"]:not([aria-required="true"])')
    .first();
}

function assigneeInput(page: Page): Locator {
  return page.locator('input[placeholder="Search team members"]').first();
}

function longListInput(page: Page): Locator {
  return page.getByTestId("combobox-long-list");
}

test.describe("Combobox keyboard model", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/combobox");
  });

  test("opens from pointer and keeps focus in the input", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.click();
    await expect(page.getByRole("listbox", { name: "Country" })).toBeVisible();
    await expect(input).toBeFocused();
  });

  test("filters results while typing", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.fill("Ca");
    await expect(page.getByRole("option", { name: "Canada" })).toBeVisible();
    await expect(page.getByRole("option", { name: "United States" })).toHaveCount(0);
  });

  test("opens with ArrowDown and sets aria-activedescendant", async ({ page }) => {
    const input = assigneeInput(page);
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("listbox", { name: "Assignee" })).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
  });

  test("selects with Enter and keeps input focus", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.click();
    await input.fill("Ca");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Canada");
    await expect(input).toBeFocused();
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });

  test("shows no-results state", async ({ page }) => {
    await basicCountryInput(page).fill("zzz");
    await expect(page.getByRole("listbox", { name: "Country" }).getByText("No results found")).toBeVisible();
  });

  test("announces no-results through a polite status region", async ({ page }) => {
    await basicCountryInput(page).fill("zzz");
    await expect(
      page.locator('[role="status"]').filter({ hasText: "No results found." }).first(),
    ).toBeVisible();
  });

  test("disabled option cannot be selected", async ({ page }) => {
    await assigneeInput(page).click();
    await page.getByRole("option", { name: "Taylor Brooks" }).click({ force: true });
    await expect(page.getByRole("listbox", { name: "Assignee" })).toBeVisible();
  });

  test("Escape closes without clearing committed value", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.click();
    await input.fill("Ca");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Canada");
    await input.click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox", { name: "Country" })).toHaveCount(0);
    await expect(input).toHaveValue("Canada");
  });

  test("Tab closes and moves focus away from the input", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.click();
    await expect(page.getByRole("listbox", { name: "Country" })).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("listbox", { name: "Country" })).toHaveCount(0);
    await expect(input).not.toBeFocused();
  });

  test("does not expose dialog role", async ({ page }) => {
    await basicCountryInput(page).click();
    await expect(page.getByRole("listbox", { name: "Country" })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("works inside dialog overlay scope", async ({ page }) => {
    const dialog = page.getByRole("dialog", { name: "Nested overlays" });
    await page.getByRole("button", { name: "Open dialog with combobox" }).click();
    await expect(dialog).toBeVisible();
    const input = dialog.getByRole("combobox", { name: "Country" });
    await input.click();
    const listbox = page.getByRole("listbox", { name: "Country" });
    await expect(listbox).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(dialog).toBeVisible();

    // toBeVisible() alone only checks layout (non-zero box, not display:none/visibility:hidden)
    // — it does NOT catch the listbox being painted *behind* the dialog panel by a stale
    // z-index stacking order. Reopen (input is already focused after Escape, so ArrowDown
    // reopens it without needing a fresh focus event) and perform a real click on an option:
    // this exercises Playwright's actionability/interception check, which fails if another
    // element (the dialog panel) intercepts the pointer event at that point on screen. This is
    // the assertion that actually catches the stacking regression this test now guards against
    // (see components/ui/internal/useOverlayEscape.ts).
    await page.keyboard.press("ArrowDown");
    await expect(listbox).toBeVisible();
    await listbox.getByRole("option", { name: "United States" }).click();
    await expect(input).toHaveValue("United States");
  });

  test("works inside drawer overlay scope", async ({ page }) => {
    await page.getByRole("button", { name: "Open drawer with combobox" }).click();
    const drawer = page.getByRole("dialog", { name: "Drawer filters" });
    await expect(drawer).toBeVisible();
    const input = drawer.getByRole("combobox", { name: "Country" });
    await input.click();
    const listbox = page.getByRole("listbox", { name: "Country" });
    await expect(listbox).toBeVisible();

    // Same stacking-order regression coverage as the dialog case above — a real click exercises
    // Playwright's interception check, unlike toBeVisible() alone.
    await listbox.getByRole("option", { name: "United States" }).click();
    await expect(input).toHaveValue("United States");
  });

  test("clears aria-activedescendant when closed", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.click();
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
    await page.keyboard.press("Escape");
    await expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  test("updates active descendant on pointer hover", async ({ page }) => {
    const input = basicCountryInput(page);
    await input.click();
    const canada = page.getByRole("option", { name: "Canada" });
    await canada.hover();
    await expect(input).toBeFocused();
    const canadaId = await canada.getAttribute("id");
    expect(canadaId).toBeTruthy();
    await expect(input).toHaveAttribute("aria-activedescendant", canadaId!);
  });
});

test.describe("Combobox responsive behavior", () => {
  test("works at mobile viewport width", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/components/combobox");
    const input = basicCountryInput(page);
    await input.click();
    await expect(page.getByRole("listbox", { name: "Country" })).toBeVisible();
    const listbox = page.getByRole("listbox", { name: "Country" });
    const box = await listbox.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);
  });

  test("scrolls active option into view in a long list", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 400 });
    await page.goto("/components/combobox");
    const input = longListInput(page);
    await input.click();
    for (let index = 0; index < 12; index += 1) {
      await page.keyboard.press("ArrowDown");
    }
    const activeId = await input.getAttribute("aria-activedescendant");
    expect(activeId).toBeTruthy();
    const visible = await page.evaluate((id) => {
      const option = document.getElementById(id!);
      const listbox = option?.closest('[role="listbox"]');
      if (!option || !listbox) return false;
      const optionRect = option.getBoundingClientRect();
      const listboxRect = listbox.getBoundingClientRect();
      return optionRect.top >= listboxRect.top && optionRect.bottom <= listboxRect.bottom;
    }, activeId);
    expect(visible).toBe(true);
  });
});

test.describe("Combobox form submission", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/combobox");
  });

  test("blocks invalid required submission and submits canonical value when selected", async ({
    page,
  }) => {
    const form = page.getByTestId("combobox-submit-form");
    const input = form.getByRole("combobox", { name: /Country/i });

    await form.getByRole("button", { name: "Submit country" }).click();
    const blocked = await input.evaluate((node) => !(node as HTMLInputElement).reportValidity());
    expect(blocked).toBe(true);

    await input.fill("Ca");
    await page.getByRole("option", { name: "Canada" }).click();
    const hiddenValue = await form.locator('input[type="hidden"][name="country"]').inputValue();
    expect(hiddenValue).toBe("ca");
  });

  test("does not satisfy required with typed but uncommitted text", async ({ page }) => {
    const form = page.getByTestId("combobox-submit-form");
    const input = form.getByRole("combobox", { name: /Country/i });
    await input.fill("Canada");
    const blocked = await input.evaluate((node) => !(node as HTMLInputElement).reportValidity());
    expect(blocked).toBe(true);
  });

  test("submits multiple combobox fields with distinct names", async ({ page }) => {
    const form = page.getByTestId("combobox-submit-form");
    await form.getByRole("combobox", { name: /Country/i }).fill("Ca");
    await page.getByRole("option", { name: "Canada" }).click();
    await form.getByRole("combobox", { name: "Assignee" }).fill("Alex");
    await page.getByRole("option", { name: "Alex Rivera" }).click();
    expect(await form.locator('input[type="hidden"][name="country"]').inputValue()).toBe("ca");
    expect(await form.locator('input[type="hidden"][name="assignee"]').inputValue()).toBe("alex");
  });

  test("resets native form fields", async ({ page }) => {
    const form = page.getByTestId("combobox-submit-form");
    const country = form.getByRole("combobox", { name: /Country/i });
    await country.fill("Ca");
    await page.getByRole("option", { name: "Canada" }).click();
    await form.getByRole("button", { name: "Reset form" }).click();
    await expect(country).toHaveValue("");
    expect(await form.locator('input[type="hidden"][name="country"]').inputValue()).toBe("");
  });
});

const ROW_HIGHLIGHT_FLAT = hexToRgba("#f7f7f8");
const ROW_HIGHLIGHT_GLASS = hexToRgba("#ffffff", 0.2);
const FOCUS_RING = hexToRgba("#6c4cf2");
const DISABLED_TEXT = hexToRgba("#a0a3ac");
const SURFACE_MODES = ["flat", "gradient", "glass"] as const;

function expectedRowHighlight(mode: (typeof SURFACE_MODES)[number]) {
  return mode === "glass" ? ROW_HIGHLIGHT_GLASS : ROW_HIGHLIGHT_FLAT;
}

function countryListbox(page: Page): Locator {
  return page.getByRole("listbox", { name: "Country" });
}

function countryPanel(page: Page): Locator {
  return countryListbox(page).locator("xpath=../..");
}

async function optionVisual(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = style.outlineColor;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return {
      backdropFilter: style.backdropFilter,
      backgroundImage: style.backgroundImage,
      fontWeight: style.fontWeight,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineRgba: { r: data[0], g: data[1], b: data[2], a: data[3] / 255 },
    };
  });
}

function hasFocusRing(visual: { outlineStyle: string; outlineWidth: string }) {
  return visual.outlineStyle === "solid" && visual.outlineWidth === "2px";
}

function expectTransparentFill(
  color: { r: number; g: number; b: number; a: number },
  message: string,
) {
  expect(color.a, message).toBeLessThanOrEqual(0.03);
}

function expectGradientOverlay(image: string) {
  expect(image).toContain("linear-gradient");
  expect(image).toMatch(/#ffffff14|rgba\(255, 255, 255, 0\.08\)/);
}

function expectNoOverlay(image: string) {
  expect(image).toBe("none");
}

test.describe("Combobox option surface parity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/combobox");
  });

  for (const mode of SURFACE_MODES) {
    test(`${mode}: Default stays transparent; Hover/Active use row highlight; Selected keeps identity`, async ({
      page,
    }) => {
      await setSurfaceMode(page, mode);
      const input = basicCountryInput(page);
      await input.click();
      const listbox = countryListbox(page);
      await expect(listbox).toBeVisible();

      const unitedStates = listbox.getByRole("option", { name: "United States" });
      const canada = listbox.getByRole("option", { name: "Canada" });
      await canada.hover();

      expectTransparentFill(
        await resolvedRgba(unitedStates, "backgroundColor"),
        `${mode} default fill`,
      );
      const defaultVisual = await optionVisual(unitedStates);
      expect(defaultVisual.fontWeight === "400" || defaultVisual.fontWeight === "normal").toBe(true);
      expectNoOverlay(defaultVisual.backgroundImage);
      expect(defaultVisual.backdropFilter).toBe("none");
      expect(hasFocusRing(defaultVisual)).toBe(false);

      expectColorClose(
        await resolvedRgba(canada, "backgroundColor"),
        expectedRowHighlight(mode),
        `${mode} hover fill`,
      );
      const hoverVisual = await optionVisual(canada);
      expectNoOverlay(hoverVisual.backgroundImage);
      expect(hoverVisual.backdropFilter).toBe("none");

      await page.keyboard.press("ArrowDown");
      const activeId = await input.getAttribute("aria-activedescendant");
      expect(activeId).toBeTruthy();
      const active = page.locator(`[id="${activeId}"]`);
      expectColorClose(
        await resolvedRgba(active, "backgroundColor"),
        expectedRowHighlight(mode),
        `${mode} active fill`,
      );
      const activeVisual = await optionVisual(active);
      expect(hasFocusRing(activeVisual)).toBe(true);
      expectColorClose(activeVisual.outlineRgba, FOCUS_RING, `${mode} active focus ring`);
      expectNoOverlay(activeVisual.backgroundImage);
      expect(activeVisual.backdropFilter).toBe("none");

      await canada.click();
      await expect(input).toHaveValue("Canada");
      await page.keyboard.press("ArrowDown");
      await expect(countryListbox(page)).toBeVisible();
      const selected = countryListbox(page).getByRole("option", { name: "Canada" });
      await expect(selected).toHaveAttribute("aria-selected", "true");
      expectColorClose(
        await resolvedRgba(selected, "backgroundColor"),
        expectedRowHighlight(mode),
        `${mode} selected fill`,
      );
      const selectedVisual = await optionVisual(selected);
      expect(selectedVisual.fontWeight).toBe("500");
      expect(selectedVisual.backdropFilter).toBe("none");
      if (mode === "gradient") {
        expectGradientOverlay(selectedVisual.backgroundImage);
      } else {
        expectNoOverlay(selectedVisual.backgroundImage);
      }

      await selected.hover();
      const selectedHover = await optionVisual(selected);
      expect(selectedHover.fontWeight).toBe("500");
      expectColorClose(
        await resolvedRgba(selected, "backgroundColor"),
        expectedRowHighlight(mode),
        `${mode} selected+hover fill`,
      );
      if (mode === "gradient") {
        expectGradientOverlay(selectedHover.backgroundImage);
      } else {
        expectNoOverlay(selectedHover.backgroundImage);
      }
      expect(selectedHover.backdropFilter).toBe("none");
    });
  }

  test("Disabled option has no interactive highlight", async ({ page }) => {
    await assigneeInput(page).click();
    const disabled = page.getByRole("option", { name: "Taylor Brooks" });
    await expect(disabled).toHaveAttribute("aria-disabled", "true");
    await disabled.hover();
    expectTransparentFill(await resolvedRgba(disabled, "backgroundColor"), "disabled fill");
    expectColorClose(await resolvedRgba(disabled, "color"), DISABLED_TEXT);
    const visual = await optionVisual(disabled);
    expectNoOverlay(visual.backgroundImage);
    expect(visual.backdropFilter).toBe("none");
    expect(hasFocusRing(visual)).toBe(false);
  });

  for (const mode of SURFACE_MODES) {
    test(`${mode}: listbox shell is a no-shadow selectable-list panel`, async ({ page }) => {
      await setSurfaceMode(page, mode);
      await basicCountryInput(page).click();
      const listbox = countryListbox(page);
      await expect(listbox).toBeVisible();
      const panel = countryPanel(page);
      const styles = await panel.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          boxShadow: style.boxShadow,
          backdropFilter: style.backdropFilter,
          backgroundImage: style.backgroundImage,
          borderWidth: style.borderWidth,
        };
      });

      expect(styles.boxShadow, `${mode} shadow`).toBe("none");
      expect(styles.borderWidth, `${mode} border`).toBe("1px");
      if (mode === "glass") {
        expect(styles.backdropFilter).toBe("blur(16px)");
        expect(styles.backgroundImage).toBe("none");
        expectColorClose(await resolvedRgba(panel, "backgroundColor"), hexToRgba("#ffffff", 0.12));
        expectColorClose(await resolvedRgba(panel, "borderColor"), hexToRgba("#ffffff", 0.24));
      } else {
        expect(styles.backdropFilter, `${mode} blur`).toBe("none");
        expectColorClose(await resolvedRgba(panel, "backgroundColor"), hexToRgba("#ffffff"));
        if (mode === "gradient") {
          expectGradientOverlay(styles.backgroundImage);
        } else {
          expectNoOverlay(styles.backgroundImage);
        }
      }
    });
  }

  test("Glass panel owns 16px blur; option rows never blur", async ({ page }) => {
    await setSurfaceMode(page, "glass");
    await basicCountryInput(page).click();
    const listbox = countryListbox(page);
    await expect(listbox).toBeVisible();
    const panel = countryPanel(page);
    expect(await panel.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      "blur(16px)",
    );
    const option = listbox.getByRole("option", { name: "Canada" });
    await option.hover();
    expect(await option.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe("none");
    const selectedInput = basicCountryInput(page);
    await option.click();
    await expect(selectedInput).toHaveValue("Canada");
    await page.keyboard.press("ArrowDown");
    const selected = countryListbox(page).getByRole("option", { name: "Canada" });
    await expect(selected).toBeVisible();
    expect(await selected.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      "none",
    );
  });
});
