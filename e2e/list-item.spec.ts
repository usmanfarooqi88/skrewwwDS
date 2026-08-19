import { expect, expectColorClose, hexToRgba, resolvedRgba, rgbaStringToRgba, setSurfaceMode, test } from "./fixtures";
import type { Locator, Page } from "@playwright/test";

test.describe("List Item browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/list-item");
  });

  test("navigational row uses a real link", async ({ page }) => {
    const link = page.getByRole("link", { name: "Button Primary actions and" });
    await expect(link).toHaveAttribute("href", "/components/button");
  });

  test("action row receives keyboard activation", async ({ page }) => {
    const button = page.getByRole("button", { name: "Show archived components" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toBeFocused();
  });

  test("trailing action does not trigger a row-level action", async ({ page }) => {
    await page.getByRole("button", { name: "Download" }).click();
    await expect(page.getByRole("button", { name: "Download" })).toBeFocused();
  });
});

/**
 * component/list-item/supporting-text (Figma Surface variable): Description
 * and Metadata resolve semantic/text/secondary (#5B5F68) in Flat/Gradient
 * and semantic/text/primary (#17181B) in Glass — deliberately distinct from
 * the shared component/surface/content-muted, which other consumers (File
 * Upload, Table, List Item's own leading icon) keep using unchanged. Title
 * stays semantic/text/primary in every mode. See styles/tokens.css's
 * --component-list-item-supporting-text comment for the full rationale.
 */
const SUPPORTING_TEXT_FLAT = "#5B5F68";
const SUPPORTING_TEXT_GLASS = "#17181B";
const TEXT_PRIMARY = "#17181B";
const AA_NORMAL_TEXT = 4.5;

// Mirrors lib/wcag-contrast.ts's algorithm locally — no browser-side import
// path exists for a lib/ util inside page.evaluate, and this repo has no
// shared Playwright contrast helper to extend instead.
function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }) {
  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const ch = (v: number) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  };
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
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

test.describe("List Item Description/Metadata: component/list-item/supporting-text contract", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/list-item");
  });

  async function readRow(page: Page) {
    const title = page.locator('[class*="title"]').first();
    const description = page.locator('[class*="description"]').first();
    const metadata = page.locator('[class*="metadata"]').first();
    return { title, description, metadata };
  }

  test("Flat Default: Description/Metadata resolve the component token, Title unchanged, AA passes", async ({
    page,
  }) => {
    await setSurfaceMode(page, "flat");
    const { title, description, metadata } = await readRow(page);

    expectColorClose(await resolvedRgba(description, "color"), hexToRgba(SUPPORTING_TEXT_FLAT), "flat description");
    expectColorClose(await resolvedRgba(metadata, "color"), hexToRgba(SUPPORTING_TEXT_FLAT), "flat metadata");
    expectColorClose(await resolvedRgba(title, "color"), hexToRgba(TEXT_PRIMARY), "flat title unchanged");

    const resolvedToken = await description.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--component-list-item-supporting-text").trim(),
    );
    expect(resolvedToken.toLowerCase()).toBe(SUPPORTING_TEXT_FLAT.toLowerCase());

    const bg = await effectiveBackground(description);
    const descRatio = contrastRatio(await resolvedRgba(description, "color"), bg);
    const metaRatio = contrastRatio(await resolvedRgba(metadata, "color"), bg);
    expect(descRatio, `flat description contrast ${descRatio}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(metaRatio, `flat metadata contrast ${metaRatio}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test("Flat Hover: Description stays on the component token and keeps passing against the unchanged hover surface", async ({
    page,
  }) => {
    // The preview's interactive (href/onClick) rows only carry a
    // `description`, not `metadata`, and list-item.module.css has no
    // `.description:hover`/`.metadata:hover` rule of its own — hovering the
    // row cannot change either text color by construction. This proves
    // that architectural guarantee with a real pointer hover, not just
    // source inspection, and confirms the hover *background* token is
    // unchanged by this fix.
    await setSurfaceMode(page, "flat");
    const row = page.locator('[class*="interactive"]').first();
    await row.hover();

    const description = row.locator('[class*="description"]').first();
    expectColorClose(await resolvedRgba(description, "color"), hexToRgba(SUPPORTING_TEXT_FLAT), "flat hover description");

    const hoverBg = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
    const hoverBgRgba = rgbaStringToRgba(hoverBg);
    // --list-item-hover-surface (menu-item-hover) is untouched by this fix.
    expectColorClose(hoverBgRgba, hexToRgba("#F7F7F8"), "hover surface unchanged");

    const descRatio = contrastRatio(await resolvedRgba(description, "color"), hoverBgRgba);
    expect(descRatio, `flat hover description contrast ${descRatio} against ${hoverBg}`).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  test("Gradient: Description/Metadata resolve the component token and pass AA (verified rendered, not assumed from source)", async ({
    page,
  }) => {
    await setSurfaceMode(page, "gradient");
    const { title, description, metadata } = await readRow(page);

    expectColorClose(await resolvedRgba(description, "color"), hexToRgba(SUPPORTING_TEXT_FLAT), "gradient description");
    expectColorClose(await resolvedRgba(metadata, "color"), hexToRgba(SUPPORTING_TEXT_FLAT), "gradient metadata");
    expectColorClose(await resolvedRgba(title, "color"), hexToRgba(TEXT_PRIMARY), "gradient title unchanged");

    const bg = await effectiveBackground(description);
    const descRatio = contrastRatio(await resolvedRgba(description, "color"), bg);
    expect(descRatio, `gradient description contrast ${descRatio}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test("Glass: Description/Metadata resolve semantic-text-primary via the component token, Title unchanged", async ({
    page,
  }) => {
    await setSurfaceMode(page, "glass");
    const { title, description, metadata } = await readRow(page);

    expectColorClose(await resolvedRgba(description, "color"), hexToRgba(SUPPORTING_TEXT_GLASS), "glass description");
    expectColorClose(await resolvedRgba(metadata, "color"), hexToRgba(SUPPORTING_TEXT_GLASS), "glass metadata");
    expectColorClose(await resolvedRgba(title, "color"), hexToRgba(TEXT_PRIMARY), "glass title unchanged");

    const resolvedToken = await description.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--component-list-item-supporting-text").trim(),
    );
    expect(resolvedToken.toLowerCase()).toBe(SUPPORTING_TEXT_GLASS.toLowerCase());

    // Verify against the actual rendered/composited background rather than
    // assuming a pure-white theoretical floor — this preview's real page
    // context is light throughout, so the resting Card fill is the
    // meaningful comparison surface.
    const bg = await effectiveBackground(description);
    const descRatio = contrastRatio(await resolvedRgba(description, "color"), bg);
    expect(descRatio, `glass description contrast ${descRatio}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});

test.describe("Banking Transaction Row inherits the List Item supporting-text contract", () => {
  test("date (List Item description slot) resolves Flat/Glass correctly", async ({ page }) => {
    await page.goto("/components/banking-transaction-row");

    await setSurfaceMode(page, "flat");
    const flatDescription = page.locator('[class*="description"]').first();
    expectColorClose(await resolvedRgba(flatDescription, "color"), hexToRgba(SUPPORTING_TEXT_FLAT), "banking row date, flat");

    await setSurfaceMode(page, "glass");
    const glassDescription = page.locator('[class*="description"]').first();
    expectColorClose(
      await resolvedRgba(glassDescription, "color"),
      hexToRgba(SUPPORTING_TEXT_GLASS),
      "banking row date, glass",
    );
  });
});
