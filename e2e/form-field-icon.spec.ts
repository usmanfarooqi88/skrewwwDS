import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  rgbaStringToRgba,
  setSurfaceMode,
  test,
} from "./fixtures";

/**
 * Form Field leading/trailing icons use the muted icon role, not the
 * standalone/default icon foreground that the Phosphor masters carry when
 * used on their own:
 *
 *   component/form-field/icon -> semantic/icon/muted -> color/neutral/400 -> #A0A3AC
 *
 * Two properties of that contract are locked here:
 *
 * 1. The colour is the muted role (#A0A3AC), deliberately lighter than the
 *    default icon foreground (#43464D).
 * 2. It is NOT surface-contextual. `--semantic-icon-muted` is declared once
 *    and never re-declared per Surface mode, so Flat / Gradient / Glass all
 *    resolve identically. Search Field deliberately differs — it overrides
 *    its own leading icon to `--component-surface-content-muted`, which IS
 *    surface-contextual, and is covered by e2e/search-field.spec.ts.
 *
 * Icon SIZE is intentionally not asserted here: React has no
 * `semantic/icon-size` CSS token layer yet (Figma-only structural contract),
 * so the rendered size is whatever icon node the consumer passes. See
 * docs/project-status.md.
 */
const ICON_MUTED = "#A0A3AC";

test.describe("Form Field icon colour", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/text-input");
  });

  test("leading icon resolves to the muted icon role in every Surface mode", async ({
    page,
  }) => {
    const field = page.getByRole("textbox", { name: "Search" });
    await expect(field).toBeVisible();

    const leadingIcon = field.locator("..").locator("span").first().locator("svg");
    await expect(leadingIcon).toBeVisible();

    for (const surface of ["flat", "gradient", "glass"] as const) {
      await setSurfaceMode(page, surface);

      expectColorClose(
        await resolvedRgba(leadingIcon, "color"),
        hexToRgba(ICON_MUTED),
        `${surface} leading icon colour`,
      );
    }
  });

  test("painted icon geometry inherits the muted colour via currentColor", async ({
    page,
  }) => {
    const field = page.getByRole("textbox", { name: "Search" });
    const paintedChild = field
      .locator("..")
      .locator("span")
      .first()
      .locator("svg")
      .locator("path, line, polyline, circle, rect")
      .first();

    await expect(paintedChild).toBeAttached();

    const painted = await paintedChild.evaluate((element) => {
      const style = getComputedStyle(element);
      return { stroke: style.stroke, fill: style.fill };
    });

    // Phosphor-style icons paint with currentColor on stroke and/or fill;
    // whichever is actually used must land on the muted role rather than
    // defaulting to the standalone icon foreground.
    const painters = [painted.stroke, painted.fill].filter(
      (value) => Boolean(value) && value !== "none",
    );
    expect(painters.length).toBeGreaterThan(0);

    for (const painter of painters) {
      expectColorClose(
        rgbaStringToRgba(painter),
        hexToRgba(ICON_MUTED),
        `painted icon child (${painter})`,
      );
    }
  });
});
