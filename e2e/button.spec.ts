import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";
import type { Locator } from "@playwright/test";

function visualSurface(button: Locator) {
  return button.locator('[aria-hidden="true"]').first();
}

test.describe("Button browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/button");
  });

  // Regression check for a real descender-clipping bug: .button's line-height
  // was set to the unitless value 1, which is tighter than this font's real
  // ascent+descent metrics. Combined with .label's overflow: hidden, the
  // bottom of descenders (y/g/j/p/q) was visibly cut off. jsdom has no real
  // text-layout engine, so this can only be caught with real browser
  // rendering — a Vitest/jsdom assertion on scrollHeight/clientHeight would
  // be meaningless. "Primary" and "Secondary" both end in a descender ("y").
  test("does not clip label descenders at any size", async ({ page }) => {
    const labels = page.getByRole("button", { name: /^(Primary|Secondary|Danger|Small|Medium|Large)$/ });
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = labels.nth(i);
      const label = button.locator("span").first();
      const { clientHeight, scrollHeight, text } = await label.evaluate((el) => ({
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
        text: el.textContent,
      }));
      expect(scrollHeight, `"${text}" label is clipped`).toBeLessThanOrEqual(clientHeight);
    }
  });

  test("provides a layered backdrop for visual Glass inspection", async ({ page }) => {
    const backdrop = page.getByTestId("button-glass-qa-backdrop");
    await expect(backdrop).toBeVisible();
    await expect(backdrop.locator(':scope > [aria-hidden="true"]')).toHaveCount(3);
    await expect(backdrop.getByTestId("button-glass-qa-stripes")).toBeVisible();
    await expect(backdrop.getByRole("button", { name: "Primary" })).toBeVisible();
    await expect(backdrop.getByRole("button", { name: "Secondary" })).toBeVisible();
    await expect(backdrop.getByRole("button", { name: "Danger" })).toBeVisible();
  });

  test("switches Surface and Shape modes with obvious active controls", async ({ page }) => {
    const controls = page.getByTestId("button-preview-mode-controls");
    const flat = controls.getByRole("button", { name: "Flat" });
    const gradient = controls.getByRole("button", { name: "Gradient" });
    const glass = controls.getByRole("button", { name: "Glass" });
    const rounded = controls.getByRole("button", { name: "Rounded" });
    const squircle = controls.getByRole("button", { name: "Squircle" });
    const secondary = page.getByRole("button", { name: "Secondary", exact: true });

    await expect(flat).toHaveAttribute("aria-pressed", "true");
    await expect(glass).toHaveAttribute("aria-pressed", "false");
    await expect(rounded).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "flat");

    await glass.click();
    await expect(glass).toHaveAttribute("aria-pressed", "true");
    await expect(flat).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "glass");
    await expect(page.getByTestId("button-glass-qa-backdrop")).toBeVisible();
    expect(await visualSurface(secondary).evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("blur(16px)");

    await gradient.click();
    await expect(gradient).toHaveAttribute("aria-pressed", "true");
    await expect(glass).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "gradient");
    expect(await visualSurface(secondary).evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("none");

    await squircle.click();
    await expect(squircle).toHaveAttribute("aria-pressed", "true");
    await expect(rounded).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-shape", "squircle");
  });
});

// Regression coverage for the verified Figma Glass contract (Button
// component set 2012:7752 — Primary Medium/Default 2012:7712, Danger
// Medium/Default 2012:7742), implemented 2026-08-11. Before this fix,
// Primary/Danger had zero [data-skrewww-surface="glass"] rule at all and
// rendered identically across Flat/Gradient/Glass.
test.describe("Button Surface (Layer 3 Glass contract)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/button");
  });

  test("Primary matches the approved contract in Flat, Gradient, and Glass", async ({ page }) => {
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    await expect(primary).toBeVisible();

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(visualSurface(primary), "backgroundColor"), hexToRgba("#6C4CF2"), `${mode} background`);
      expectColorClose(await resolvedRgba(primary, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await visualSurface(primary).evaluate((el) => getComputedStyle(el).backdropFilter), `${mode} backdrop-filter`).toBe(
        "none",
      );
    }

    await setSurfaceMode(page, "glass");
    expectColorClose(await resolvedRgba(visualSurface(primary), "backgroundColor"), hexToRgba("#6C4CF2", 0.18), "glass background");
    expectColorClose(await resolvedRgba(primary, "color"), hexToRgba("#17181B"), "glass content");
    expect(await visualSurface(primary).evaluate((el) => getComputedStyle(el).backdropFilter), "glass backdrop-filter").toBe(
      "blur(16px)",
    );
  });

  test("Danger matches the approved contract in Flat, Gradient, and Glass", async ({ page }) => {
    const danger = page.getByRole("button", { name: "Danger", exact: true });
    await expect(danger).toBeVisible();

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D"), `${mode} background`);
      expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await visualSurface(danger).evaluate((el) => getComputedStyle(el).backdropFilter), `${mode} backdrop-filter`).toBe(
        "none",
      );
    }

    await setSurfaceMode(page, "glass");
    expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D", 0.58), "glass background");
    expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#17181B"), "glass content");
    expect(await visualSurface(danger).evaluate((el) => getComputedStyle(el).backdropFilter), "glass backdrop-filter").toBe(
      "blur(16px)",
    );
  });

  test("Primary and Danger stay semantically distinct in Glass mode", async ({ page }) => {
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const danger = page.getByRole("button", { name: "Danger", exact: true });
    await setSurfaceMode(page, "glass");

    const [primaryBg, dangerBg] = await Promise.all([
      resolvedRgba(visualSurface(primary), "backgroundColor"),
      resolvedRgba(visualSurface(danger), "backgroundColor"),
    ]);
    const delta =
      Math.abs(primaryBg.r - dangerBg.r) + Math.abs(primaryBg.g - dangerBg.g) + Math.abs(primaryBg.b - dangerBg.b);
    expect(
      delta,
      `Primary ${JSON.stringify(primaryBg)} must not collapse into Danger's family ${JSON.stringify(dangerBg)}`,
    ).toBeGreaterThan(30);
  });

  test("Secondary uses the master-bound component Surface blur", async ({ page }) => {
    const secondary = page.getByRole("button", { name: "Secondary", exact: true });
    await setSurfaceMode(page, "glass");
    const backdrop = await visualSurface(secondary).evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(backdrop).toBe("blur(16px)");
  });

  test("Primary and Danger expose their separate verified Glass border gradients", async ({ page }) => {
    await setSurfaceMode(page, "glass");
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const danger = page.getByRole("button", { name: "Danger", exact: true });
    const [primaryBorder, dangerBorder] = await Promise.all([
      visualSurface(primary).evaluate((el) => getComputedStyle(el, "::before").backgroundImage),
      visualSurface(danger).evaluate((el) => getComputedStyle(el, "::before").backgroundImage),
    ]);

    expect(primaryBorder).toContain("17.526deg");
    expect(primaryBorder).toContain("rgba(255, 255, 255, 0.8) 0%");
    expect(primaryBorder).toContain("50%");
    expect(primaryBorder).toContain("100%");
    expect(dangerBorder).toContain("17.526deg");
    expect(dangerBorder).toContain("rgba(255, 255, 255, 0.8) 0%");
    expect(dangerBorder).not.toBe(primaryBorder);
  });

  test("Danger uses verified interaction and disabled values in every Surface mode", async ({ page }) => {
    const danger = page.getByRole("button", { name: "Danger", exact: true });

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      await danger.hover();
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#CC3B37"), `${mode} hover`);
      await page.mouse.down();
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#B3261E"), `${mode} pressed`);
      await page.mouse.up();
    }

    await setSurfaceMode(page, "glass");
    await danger.hover();
    expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#CC3B37", 0.64), "glass hover");
    await page.mouse.down();
    expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#B3261E", 0.7), "glass pressed");
    await page.mouse.up();

    await danger.evaluate((el) => el.setAttribute("disabled", ""));
    expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D", 0.58), "glass disabled fill");
    expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#17181B"), "glass disabled content");
    expect(await danger.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.4");

    for (const mode of ["flat", "gradient"] as const) {
      await setSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D"), `${mode} disabled fill`);
      expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#FFFFFF"), `${mode} disabled content`);
    }
  });

  test("Primary uses verified Flat and translucent Glass interaction values", async ({ page }) => {
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const surface = visualSurface(primary);

    await setSurfaceMode(page, "flat");
    await primary.hover();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#5638D6"), "flat hover");
    await page.mouse.down();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#4229AD"), "flat pressed");
    await page.mouse.up();

    await setSurfaceMode(page, "glass");
    await page.mouse.move(0, 0);
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#6C4CF2", 0.18), "glass default");
    await primary.hover();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#5638D6", 0.24), "glass hover");
    await page.mouse.down();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#4229AD", 0.3), "glass pressed");
    await page.mouse.up();
    expectColorClose(await resolvedRgba(primary, "color"), hexToRgba("#17181B"), "glass content");
    await primary.evaluate((el) => el.setAttribute("disabled", ""));
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#6C4CF2", 0.18), "glass disabled base");
    expectColorClose(await resolvedRgba(primary, "color"), hexToRgba("#17181B"), "glass disabled content");
    expect(await primary.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.4");
  });

  test("Secondary keeps Figma Glass base bindings through Disabled", async ({ page }) => {
    const secondary = page.getByRole("button", { name: "Secondary", exact: true });
    const surface = visualSurface(secondary);
    await setSurfaceMode(page, "glass");

    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#FFFFFF", 0.12), "glass default");
    expectColorClose(await resolvedRgba(secondary, "color"), hexToRgba("#131316"), "glass content");
    expect(await surface.evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("blur(16px)");
    await secondary.hover();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#FFFFFF", 0.2), "glass hover");
    await page.mouse.down();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#FFFFFF", 0.2), "glass pressed");
    await page.mouse.up();
    await secondary.evaluate((el) => el.setAttribute("disabled", ""));
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#FFFFFF", 0.12), "glass disabled base");
    expectColorClose(await resolvedRgba(secondary, "color"), hexToRgba("#131316"), "glass disabled content");
    expect(await secondary.evaluate((el) => getComputedStyle(el).opacity)).toBe("0.4");
  });

  test("Focused Primary and Danger resolve Surface-aware outside gradients without layout shift", async ({ page }) => {
    const variants = [
      {
        name: "Primary",
        tokens: [
          "--component-button-primary-border-start",
          "--component-button-primary-border-mid",
          "--component-button-primary-border-end",
        ],
        glassStops: ["rgba(255, 255, 255, 0.8) 0%", "rgba(108, 76, 242, 0.6) 50%", "rgba(108, 76, 242, 0.15) 100%"],
      },
      {
        name: "Danger",
        tokens: [
          "--component-button-danger-border-start",
          "--component-button-danger-border-mid",
          "--component-button-danger-border-end",
        ],
        glassStops: ["rgba(255, 255, 255, 0.8) 0%", "rgba(229, 72, 77, 0.6) 50%", "rgba(229, 72, 77, 0.15) 100%"],
      },
    ] as const;

    for (const variant of variants) {
      const { name, tokens, glassStops } = variant;
      const button = page.getByRole("button", { name, exact: true });
      const before = await button.boundingBox();

      for (const mode of ["flat", "gradient"] as const) {
        await setSurfaceMode(page, mode);
        await button.focus();
        const values = await button.evaluate((el, names) => {
          const style = getComputedStyle(el);
          return names.map((token) => style.getPropertyValue(token).trim());
        }, tokens);
        expect(values, `${name} ${mode} focus stops`).toEqual([
          "#fff0",
          name === "Primary" ? "#6c4cf200" : "#e5484d00",
          name === "Primary" ? "#6c4cf200" : "#e5484d00",
        ]);
      }

      await setSurfaceMode(page, "glass");
      await button.focus();
      await expect(button).toBeFocused();
      const focusStroke = await button.evaluate((el) => {
        const style = getComputedStyle(el, "::before");
        return { backgroundImage: style.backgroundImage, inset: style.inset, pointerEvents: style.pointerEvents };
      });
      expect(focusStroke.backgroundImage).toContain("17.526deg");
      for (const stop of glassStops) expect(focusStroke.backgroundImage).toContain(stop);
      expect(focusStroke.inset).toBe("-1px");
      expect(focusStroke.pointerEvents).toBe("none");
      const after = await button.boundingBox();
      expect(after?.width).toBe(before?.width);
      expect(after?.height).toBe(before?.height);
    }
  });

  test("preserves Button sizing across Shape modes and all three sizes", async ({ page }) => {
    const controls = page.getByTestId("button-preview-mode-controls");
    const primary = page.getByRole("button", { name: "Primary", exact: true });

    for (const [mode, radius] of [["Sharp", "0px"], ["Rounded", "4px"], ["Pill", "9999px"], ["Squircle", "8px"]] as const) {
      await controls.getByRole("button", { name: mode }).click();
      expect(await primary.evaluate((el) => getComputedStyle(el).borderRadius)).toBe(radius);
    }
    expect(await visualSurface(primary).evaluate((el) => getComputedStyle(el).clipPath)).not.toBe("none");

    for (const [name, minHeight] of [["Small", 32], ["Medium", 40], ["Large", 48]] as const) {
      const button = page.getByRole("button", { name, exact: true });
      expect((await button.boundingBox())?.height).toBe(minHeight);
    }
  });

  test("preserves intrinsic and full-width public-root layout", async ({ page }) => {
    const intrinsic = page.getByRole("button", { name: "Primary", exact: true });
    const fullWidth = page.getByRole("button", { name: "Full width", exact: true });
    const intrinsicBox = await intrinsic.boundingBox();
    const fullBox = await fullWidth.boundingBox();
    expect(intrinsicBox).not.toBeNull();
    expect(fullBox).not.toBeNull();
    expect(fullBox!.width).toBeGreaterThan(intrinsicBox!.width);
    expect(await fullWidth.evaluate((el) => el.tagName)).toBe("BUTTON");
  });
});
