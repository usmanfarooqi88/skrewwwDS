import { expect, test, type Locator, type Page } from "@playwright/test";

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
