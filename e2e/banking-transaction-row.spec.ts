import { expect, expectColorClose, hexToRgba, resolvedRgba, rgbaStringToRgba, setSurfaceMode, test } from "./fixtures";
import type { Locator } from "@playwright/test";

const DANGER_TEXT = "#CC3B37";
const SUCCESS = "#1A8B4C";
const WARNING = "#B36A00";
const AA_NORMAL_TEXT = 4.5;

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

test.describe("Banking Transaction Row browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/banking-transaction-row");
  });

  test("loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Banking Transaction Row" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("opens the anchored Popover on click and shows the merchant's detail fields", async ({ page }) => {
    const trigger = page.getByRole("button", { name: /Coffee Collective/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const dialog = page.getByRole("dialog", { name: "Coffee Collective transaction details" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Category");
    await expect(dialog).toContainText("Dining");
    await expect(dialog).toContainText("Transaction ID");
  });

  test("closes the Popover on outside click and restores aria-expanded=false", async ({ page }) => {
    const trigger = page.getByRole("button", { name: /Coffee Collective/ });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("closes with Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: /Coffee Collective/ });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("only one row's Popover is open at a time", async ({ page }) => {
    const coffeeTrigger = page.getByRole("button", { name: /Coffee Collective/ });
    const transitTrigger = page.getByRole("button", { name: /Metro Transit Authority/ });

    await coffeeTrigger.click();
    await expect(page.getByRole("dialog", { name: /Coffee Collective/ })).toBeVisible();

    await transitTrigger.click();
    await expect(page.getByRole("dialog", { name: /Metro Transit Authority/ })).toBeVisible();
    await expect(page.getByRole("dialog", { name: /Coffee Collective/ })).not.toBeVisible();
  });

  test("colors success, warning, and error statuses distinctly using existing semantic tokens", async ({ page }) => {
    // The page has several <ul> sections (Known open questions, Related
    // components, Related tokens) above the live preview — scope to the
    // one actually containing the transaction rows, not just the first <ul>.
    const list = page.locator("ul").filter({ hasText: "Coffee Collective" });
    await expect(list.locator('[class*="amount"][class*="success"]')).toHaveCount(2);
    await expect(list.locator('[class*="amount"][class*="warning"]')).toHaveCount(1);
    await expect(list.locator('[class*="amount"][class*="error"]')).toHaveCount(1);
  });
});

/**
 * D2: the declined-transaction amount is normal text, not a
 * call-to-action, so it uses semantic/text/danger (#CC3B37) rather than
 * semantic/action/danger (chrome/fill, danger/500) — the latter fails WCAG AA
 * for text at this size against the row's real background. Success/warning colors are
 * unrelated tokens and must stay unaffected; a negative amount on a
 * status="success" row must stay success-colored — sign is not status.
 */
test.describe("Banking Transaction Row error-text contract (D2)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/banking-transaction-row");
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
  });

  function list(page: import("@playwright/test").Page) {
    return page.locator("ul").filter({ hasText: "Coffee Collective" });
  }

  test("error amount resolves semantic-text-danger (#CC3B37) at rest", async ({ page }) => {
    const errorAmount = list(page).locator('[class*="amount"][class*="error"]');
    expectColorClose(await resolvedRgba(errorAmount, "color"), hexToRgba(DANGER_TEXT), "error amount rest");
  });

  test("error amount stays #CC3B37 on row hover (only the row background changes)", async ({ page }) => {
    const errorAmount = list(page).locator('[class*="amount"][class*="error"]');
    const row = page.getByRole("button", { name: /Skyline Electronics/ });
    await row.hover();
    expectColorClose(await resolvedRgba(errorAmount, "color"), hexToRgba(DANGER_TEXT), "error amount hover");
  });

  test("error amount meets AA (>=4.5:1) at rest on its real white/Card background", async ({ page }) => {
    const errorAmount = list(page).locator('[class*="amount"][class*="error"]');
    const fg = await resolvedRgba(errorAmount, "color");
    const bg = await effectiveBackground(errorAmount);
    expect(bg.a, "background must be fully opaque, not measured against transparent").toBeGreaterThan(0.99);
    const ratio = contrastRatio(fg, bg);
    expect(ratio, `rest contrast ${ratio} against ${JSON.stringify(bg)}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test("error amount meets AA (>=4.5:1) on the row's hover surface", async ({ page }) => {
    const errorAmount = list(page).locator('[class*="amount"][class*="error"]');
    const row = page.getByRole("button", { name: /Skyline Electronics/ });
    await row.hover();
    const fg = await resolvedRgba(errorAmount, "color");
    const hoverBgCss = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
    const hoverBg = rgbaStringToRgba(hoverBgCss);
    expectColorClose(hoverBg, hexToRgba("#F7F7F8"), "hover surface unchanged (menu-item-hover)");
    const ratio = contrastRatio(fg, hoverBg);
    expect(ratio, `hover contrast ${ratio} against ${hoverBgCss}`).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  test("Glass: error amount stays #CC3B37 and the composited background remains fully opaque white", async ({
    page,
  }) => {
    await setSurfaceMode(page, "glass");
    const errorAmount = list(page).locator('[class*="amount"][class*="error"]');
    expectColorClose(await resolvedRgba(errorAmount, "color"), hexToRgba(DANGER_TEXT), "glass error amount");

    // Glass's translucent Card fill (rgba(255,255,255,0.72)) sits over a
    // plain white page in this real composition (no busy background art
    // anywhere in the ancestor chain) — white blended with white at any
    // alpha is exactly white, so contrast here equals the Flat case. This
    // is verified against the actual computed ancestor chain, not assumed.
    const cardBg = await errorAmount.evaluate((el) => {
      let node: Element | null = el;
      while (node) {
        const cls = (node.className || "").toString();
        if (/\bcard-module.*card\b/.test(cls) || /__card\b/.test(cls)) return getComputedStyle(node).backgroundColor;
        node = node.parentElement;
      }
      return null;
    });
    expect(cardBg).not.toBeNull();
    const cardRgba = rgbaStringToRgba(cardBg as string);
    // Composite the translucent Card fill over the real white page behind
    // it (confirmed via body { background-color: white } in this route).
    const white = { r: 255, g: 255, b: 255 };
    const composited = {
      r: cardRgba.r * cardRgba.a + white.r * (1 - cardRgba.a),
      g: cardRgba.g * cardRgba.a + white.g * (1 - cardRgba.a),
      b: cardRgba.b * cardRgba.a + white.b * (1 - cardRgba.a),
    };
    const fg = await resolvedRgba(errorAmount, "color");
    const ratio = contrastRatio(fg, composited);
    expect(ratio, `glass contrast ${ratio} against composited ${JSON.stringify(composited)}`).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  test("success amount (including a negative-amount row) and warning amount colors are unaffected", async ({
    page,
  }) => {
    const successAmounts = list(page).locator('[class*="amount"][class*="success"]');
    await expect(successAmounts).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      expectColorClose(await resolvedRgba(successAmounts.nth(i), "color"), hexToRgba(SUCCESS), `success amount ${i}`);
    }
    const warningAmount = list(page).locator('[class*="amount"][class*="warning"]');
    expectColorClose(await resolvedRgba(warningAmount, "color"), hexToRgba(WARNING), "warning amount");
  });

  test("negative-success row does not receive the error class or error color", async ({ page }) => {
    // "Coffee Collective" is status="success" with amount "-$4.75" — a
    // negative amount that must stay success-colored, proving status (not
    // the sign of the amount) drives the color.
    const coffeeRow = page.getByRole("button", { name: /Coffee Collective/ });
    const amount = coffeeRow.locator('[class*="amount"]');
    await expect(amount).toHaveText("-$4.75");
    await expect(coffeeRow.locator('[class*="amount"][class*="error"]')).toHaveCount(0);
    await expect(coffeeRow.locator('[class*="amount"][class*="success"]')).toHaveCount(1);
    expectColorClose(await resolvedRgba(amount, "color"), hexToRgba(SUCCESS), "negative success amount color");
  });
});
