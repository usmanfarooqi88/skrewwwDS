import type { Page } from "@playwright/test";
import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

test.describe("Avatar browser behavior", () => {
  test("falls back from broken image to initials", async ({ page }) => {
    // Scope to the "Broken image fallback" preview. The live preview also
    // renders initials="UF", so a page-wide [data-fallback=initials] locator
    // is ambiguous: it false-passes against the working initials avatar while
    // the reserved-TLD src hangs, and strict-mode-fails once both are visible.
    // Chromium does not fire img.onError for that hanging src, so dispatch
    // the same error the unit test already covers (Avatar.test.tsx).
    await page.goto("/components/avatar");
    const group = page.getByRole("heading", { name: "Broken image fallback" }).locator("xpath=..");
    await group.scrollIntoViewIfNeeded();
    await expect(group.locator("img")).toBeVisible();
    await group.locator("img").dispatchEvent("error");
    const fallback = group.locator('[data-fallback="initials"]');
    await expect(fallback).toBeVisible();
    await expect(fallback).toHaveCount(1);
    await expect(fallback.locator("img")).toHaveCount(0);
    await expect(fallback).toHaveAttribute("role", "img");
  });
});

// Regression coverage for the verified Figma Glass contract (Avatar
// 2044:26027), implemented 2026-08-11 — shares Button Primary's
// component/button/primary/background family, confirmed 2026-08-11 to be
// a genuine Surface participant (previously omitted from the registry's
// relatedConcepts, a real metadata gap now corrected).
test.describe("Avatar Surface (Layer 3 Glass contract)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/avatar");
  });

  function initialsAvatar(page: Page) {
    // The first Avatar in the preview renders a real photo (no visible
    // text), so a plain .first() on all root elements would grab that one
    // instead. Filtering by the "UF" initials text — scoped to root-only
    // elements so the nested .initials span inside it isn't also matched —
    // reliably lands on the plain initials="UF" avatar, before the later
    // "Broken image fallback" section's own "UF" avatar in DOM order.
    return page.locator('[class*="__root"]').filter({ hasText: "UF" }).first();
  }

  test("matches the verified size, initials type, border, and circular shape contracts", async ({ page }) => {
    const cases = [
      { name: "Small avatar", size: 24, fontSize: "12px" },
      { name: "Medium avatar", size: 32, fontSize: "14px" },
      { name: "Large avatar", size: 48, fontSize: "16px" },
    ] as const;

    for (const expected of cases) {
      const avatar = page.getByRole("img", { name: expected.name });
      const box = await avatar.boundingBox();
      expect(box?.width, `${expected.name} width`).toBe(expected.size);
      expect(box?.height, `${expected.name} height`).toBe(expected.size);
      expect(await avatar.evaluate((el) => getComputedStyle(el).fontSize), `${expected.name} font-size`).toBe(
        expected.fontSize,
      );
      expect(await avatar.evaluate((el) => getComputedStyle(el).borderTopWidth), `${expected.name} border width`).toBe(
        "0px",
      );
      expect(await avatar.evaluate((el) => getComputedStyle(el).borderTopStyle), `${expected.name} border style`).toBe(
        "none",
      );
    }

    const avatar = page.getByRole("img", { name: "Medium avatar" });
    for (const shape of ["sharp", "rounded", "pill", "squircle"] as const) {
      await page.evaluate((mode) => document.documentElement.setAttribute("data-skrewww-shape", mode), shape);
      expect(await avatar.evaluate((el) => getComputedStyle(el).borderRadius), `${shape} radius`).toBe("9999px");
    }
  });

  test("matches the approved brand/primary contract in Flat, Gradient, and Glass", async ({
    page,
  }) => {
    const avatar = initialsAvatar(page);
    await expect(avatar).toBeVisible();

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(avatar, "backgroundColor"), hexToRgba("#6C4CF2"), `${mode} background`);
      expectColorClose(await resolvedRgba(avatar, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await avatar.evaluate((el) => getComputedStyle(el).backdropFilter), `${mode} backdrop-filter`).toBe(
        "none",
      );
    }

    await setSurfaceMode(page, "glass");
    expectColorClose(await resolvedRgba(avatar, "backgroundColor"), hexToRgba("#6C4CF2", 0.18), "glass background");
    expectColorClose(await resolvedRgba(avatar, "color"), hexToRgba("#17181B"), "glass content");
    expect(await avatar.evaluate((el) => getComputedStyle(el).backdropFilter), "glass backdrop-filter").toBe(
      "blur(16px)",
    );
  });
});
