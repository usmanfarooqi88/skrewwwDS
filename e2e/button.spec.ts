import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  rgbaStringToRgba,
  test,
} from "./fixtures";
import type { Locator } from "@playwright/test";
import type { Page } from "@playwright/test";

function visualSurface(button: Locator) {
  return button.locator('[aria-hidden="true"]').first();
}

async function setButtonSurfaceMode(page: Page, mode: "flat" | "gradient" | "glass") {
  await page.evaluate(() => {
    if (!document.getElementById("__e2e-disable-transitions")) {
      const style = document.createElement("style");
      style.id = "__e2e-disable-transitions";
      style.textContent =
        "*, *::before, *::after { transition: none !important; animation: none !important; }";
      document.head.appendChild(style);
    }
  });
  const controls = page.getByTestId("button-preview-mode-controls");
  await controls.getByRole("button", { name: new RegExp(`^${mode}$`, "i") }).click();
  await expect(page.locator('[data-skrewww-preview-sandbox=""]').first()).toHaveAttribute(
    "data-skrewww-surface",
    mode,
  );
  await page.locator('[data-skrewww-preview-sandbox=""]').first().evaluate((node) => void node.clientWidth);
}

/**
 * Parses a computed `linear-gradient(...)` into its angle and stops so tests
 * can assert real rendered geometry instead of matching a substring. A plain
 * `toContain("135.25deg")` would still pass if the axis were mirrored or the
 * stop order reversed, which is exactly the class of regression the Glass rim
 * work was correcting.
 */
function parseLinearGradient(image: string) {
  const angle = Number.parseFloat(/linear-gradient\(\s*([\d.]+)deg/.exec(image)?.[1] ?? "NaN");
  const stopPattern = /(rgba?\([^)]*\))\s+([\d.]+)%/g;
  const stops: Array<{ color: string; position: number }> = [];
  let match = stopPattern.exec(image);
  while (match !== null) {
    stops.push({ color: match[1], position: Number.parseFloat(match[2]) });
    match = stopPattern.exec(image);
  }
  // CSS angles are measured with 0deg pointing up and increasing clockwise,
  // while screen space has y growing downward — so this is the direction the
  // gradient actually travels across the element.
  const radians = (angle * Math.PI) / 180;
  return { angle, stops, dx: Math.sin(radians), dy: -Math.cos(radians) };
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
    const sandboxes = page.locator('[data-skrewww-preview-sandbox=""]');
    await expect(sandboxes).toHaveCount(4);
    await expect(sandboxes.first()).toHaveAttribute("data-skrewww-surface", "flat");

    await glass.click();
    await expect(glass).toHaveAttribute("aria-pressed", "true");
    await expect(flat).toHaveAttribute("aria-pressed", "false");
    await expect(sandboxes.first()).toHaveAttribute("data-skrewww-surface", "glass");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "flat");
    await expect(page.getByTestId("button-glass-qa-backdrop")).toBeVisible();
    expect(await visualSurface(secondary).evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("blur(16px)");

    await gradient.click();
    await expect(gradient).toHaveAttribute("aria-pressed", "true");
    await expect(glass).toHaveAttribute("aria-pressed", "false");
    await expect(sandboxes.first()).toHaveAttribute("data-skrewww-surface", "gradient");
    expect(await visualSurface(secondary).evaluate((el) => getComputedStyle(el).backdropFilter)).toBe("none");

    await squircle.click();
    await expect(squircle).toHaveAttribute("aria-pressed", "true");
    await expect(rounded).toHaveAttribute("aria-pressed", "false");
    await expect(sandboxes.first()).toHaveAttribute("data-skrewww-shape", "squircle");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-shape", "rounded");
  });

  test("isolates all shape and surface modes from documentation cards", async ({ page }) => {
    const controls = page.getByTestId("button-preview-mode-controls");
    const cards = page.locator('[data-testid^="button-preview-"][data-testid$="-card"]');
    const sizesButton = page.getByRole("button", { name: "Small", exact: true });
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const initialCards = await cards.evaluateAll((nodes) => nodes.map((node) => {
      const style = getComputedStyle(node);
      return { radius: style.borderRadius, background: style.backgroundColor, border: style.borderColor };
    }));
    const initialPrimaryBox = await primary.boundingBox();

    for (const shape of ["Sharp", "Rounded", "Pill", "Squircle"]) {
      await controls.getByRole("button", { name: shape }).click();
      await expect(page.locator('[data-skrewww-preview-sandbox=""]').first()).toHaveAttribute(
        "data-skrewww-shape",
        shape.toLowerCase(),
      );
      expect(await cards.evaluateAll((nodes) => nodes.map((node) => {
        const style = getComputedStyle(node);
        return { radius: style.borderRadius, background: style.backgroundColor, border: style.borderColor };
      }))).toEqual(initialCards);
      expect(await sizesButton.evaluate((node) => getComputedStyle(node).getPropertyValue("--component-button-radius-control").trim()))
        .toBe(shape === "Sharp" ? "0px" : shape === "Rounded" ? "4px" : shape === "Pill" ? "9999px" : "8px");
    }

    for (const surface of ["Flat", "Gradient", "Glass"]) {
      await controls.getByRole("button", { name: surface }).click();
      await expect(page.locator('[data-skrewww-preview-sandbox=""]').first()).toHaveAttribute(
        "data-skrewww-surface",
        surface.toLowerCase(),
      );
      expect(await cards.evaluateAll((nodes) => nodes.map((node) => {
        const style = getComputedStyle(node);
        return { radius: style.borderRadius, background: style.backgroundColor, border: style.borderColor };
      }))).toEqual(initialCards);
    }

    const finalPrimaryBox = await primary.boundingBox();
    expect(finalPrimaryBox?.width).toBe(initialPrimaryBox?.width);
    expect(finalPrimaryBox?.height).toBe(initialPrimaryBox?.height);
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "flat");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-shape", "rounded");
  });

  test("does not leak mode state through client-side navigation", async ({ page }) => {
    const controls = page.getByTestId("button-preview-mode-controls");
    await controls.getByRole("button", { name: "Glass" }).click();
    await controls.getByRole("button", { name: "Squircle" }).click();
    await page.getByRole("link", { name: "Search Field", exact: true }).first().click();
    await expect(page).toHaveURL(/\/components\/search-field$/);
    await expect(page.locator('[data-skrewww-preview-sandbox=""]')).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "flat");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-shape", "rounded");

    await page.goBack();
    await expect(page).toHaveURL(/\/components\/button$/);
    await expect(page.getByTestId("button-preview-mode-controls").getByRole("button", { name: "Flat" }))
      .toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("button-preview-mode-controls").getByRole("button", { name: "Rounded" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  test("keeps scoped preview controls and content contained on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const controls = page.getByTestId("button-preview-mode-controls");
    await controls.getByRole("button", { name: "Glass" }).click();
    await controls.getByRole("button", { name: "Squircle" }).click();

    await expect(page.getByTestId("button-preview-live-card")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-surface", "flat");
    await expect(page.locator("html")).toHaveAttribute("data-skrewww-shape", "rounded");
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
      await setButtonSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(visualSurface(primary), "backgroundColor"), hexToRgba("#6C4CF2"), `${mode} background`);
      expectColorClose(await resolvedRgba(primary, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await visualSurface(primary).evaluate((el) => getComputedStyle(el).backdropFilter), `${mode} backdrop-filter`).toBe(
        "none",
      );
    }

    await setButtonSurfaceMode(page, "glass");
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
      await setButtonSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D"), `${mode} background`);
      expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#FFFFFF"), `${mode} content`);
      expect(await visualSurface(danger).evaluate((el) => getComputedStyle(el).backdropFilter), `${mode} backdrop-filter`).toBe(
        "none",
      );
    }

    await setButtonSurfaceMode(page, "glass");
    expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D", 0.58), "glass background");
    expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#17181B"), "glass content");
    expect(await visualSurface(danger).evaluate((el) => getComputedStyle(el).backdropFilter), "glass backdrop-filter").toBe(
      "blur(16px)",
    );
  });

  test("Primary and Danger stay semantically distinct in Glass mode", async ({ page }) => {
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const danger = page.getByRole("button", { name: "Danger", exact: true });
    await setButtonSurfaceMode(page, "glass");

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
    await setButtonSurfaceMode(page, "glass");
    const backdrop = await visualSurface(secondary).evaluate((el) => getComputedStyle(el).backdropFilter);
    expect(backdrop).toBe("blur(16px)");
  });

  test("Primary and Danger expose their separate verified Glass border gradients", async ({ page }) => {
    await setButtonSurfaceMode(page, "glass");
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const danger = page.getByRole("button", { name: "Danger", exact: true });
    const [primaryBorder, dangerBorder] = await Promise.all([
      visualSurface(primary).evaluate((el) => getComputedStyle(el, "::before").backgroundImage),
      visualSurface(danger).evaluate((el) => getComputedStyle(el, "::before").backgroundImage),
    ]);

    const cases = [
      { label: "Primary", image: primaryBorder, midHex: "#6C4CF2" },
      { label: "Danger", image: dangerBorder, midHex: "#E5484D" },
    ] as const;

    for (const { label, image, midHex } of cases) {
      const gradient = parseLinearGradient(image);

      // Shipped Glass rim axis — a deliberate fixed-angle approximation of
      // Figma's aspect-ratio-dependent handles, derived for the Medium
      // master box. See the derivation comment in button.module.css.
      expect(gradient.angle, `${label} rim angle`).toBeCloseTo(135.25, 2);

      // Direction correctness: the rim must travel down-and-right. The
      // previous 17.526deg value pointed up-and-right, mirroring the rim so
      // the bright white stop landed on the wrong edge. Asserting the vector
      // catches that even if the angle string were to change form.
      expect(gradient.dx, `${label} rim travels rightward`).toBeGreaterThan(0);
      expect(gradient.dy, `${label} rim travels downward`).toBeGreaterThan(0);

      expect(gradient.stops.map((stop) => stop.position), `${label} rim stops`).toEqual([0, 23.1, 46.2, 100]);

      expectColorClose(rgbaStringToRgba(gradient.stops[0].color), hexToRgba("#FFFFFF", 0.8), `${label} rim stop 0`);
      expectColorClose(rgbaStringToRgba(gradient.stops[1].color), hexToRgba(midHex, 0.6), `${label} rim stop 1`);
      expectColorClose(rgbaStringToRgba(gradient.stops[2].color), hexToRgba(midHex, 0.15), `${label} rim stop 2`);
      expectColorClose(rgbaStringToRgba(gradient.stops[3].color), hexToRgba(midHex, 0.15), `${label} rim held end colour`);
    }

    // Primary and Danger keep permanently separate token families.
    expect(dangerBorder).not.toBe(primaryBorder);
  });

  test("Danger uses verified interaction and disabled values in every Surface mode", async ({ page }) => {
    const danger = page.getByRole("button", { name: "Danger", exact: true });

    for (const mode of ["flat", "gradient"] as const) {
      await setButtonSurfaceMode(page, mode);
      await danger.hover();
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#CC3B37"), `${mode} hover`);
      await page.mouse.down();
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#B3261E"), `${mode} pressed`);
      await page.mouse.up();
    }

    await setButtonSurfaceMode(page, "glass");
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
      await setButtonSurfaceMode(page, mode);
      expectColorClose(await resolvedRgba(visualSurface(danger), "backgroundColor"), hexToRgba("#E5484D"), `${mode} disabled fill`);
      expectColorClose(await resolvedRgba(danger, "color"), hexToRgba("#FFFFFF"), `${mode} disabled content`);
    }
  });

  test("Primary uses verified Flat and translucent Glass interaction values", async ({ page }) => {
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    const surface = visualSurface(primary);

    await setButtonSurfaceMode(page, "flat");
    await primary.hover();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#5638D6"), "flat hover");
    await page.mouse.down();
    expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba("#4229AD"), "flat pressed");
    await page.mouse.up();

    await setButtonSurfaceMode(page, "glass");
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
    await setButtonSurfaceMode(page, "glass");

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

  test("keyboard focus uses one solid semantic outside ring across variants and Surfaces", async ({ page }) => {
    const variants = ["Primary", "Secondary", "Danger"] as const;

    for (const mode of ["flat", "gradient", "glass"] as const) {
      await setButtonSurfaceMode(page, mode);

      for (let variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
        const name = variants[variantIndex];
        const button = page.getByRole("button", { name, exact: true });
        const before = await button.boundingBox();

        // Begin from a known preceding control, then use Tab so Chromium—not
        // script focus—decides that :focus-visible matches.
        await page.getByRole("button", { name: "Squircle", exact: true }).focus();
        for (let tab = 0; tab <= variantIndex; tab += 1) await page.keyboard.press("Tab");
        await expect(button).toBeFocused();
        expect(await button.evaluate((el) => el.matches(":focus-visible"))).toBe(true);

        const focus = await button.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            style: style.outlineStyle,
            width: style.outlineWidth,
            offset: style.outlineOffset,
            color: style.outlineColor,
          };
        });
        expect(focus.style).toBe("solid");
        expect(focus.width).toBe("2px");
        expect(focus.offset).toBe("0px");
        expectColorClose(rgbaStringToRgba(focus.color), hexToRgba("#6C4CF2"), `${name} ${mode} focus colour`);

        if (mode === "glass" && name !== "Secondary") {
          const rim = await visualSurface(button).evaluate(
            (el) => getComputedStyle(el, "::before").backgroundImage,
          );
          expect(parseLinearGradient(rim).stops).toHaveLength(4);
        }

        const after = await button.boundingBox();
        expect(after?.width).toBe(before?.width);
        expect(after?.height).toBe(before?.height);
      }
    }
  });

  test("focus ring keeps size and Button radius aliases across sizes and implemented Shape modes", async ({ page }) => {
    for (const name of ["Small", "Medium", "Large"] as const) {
      const button = page.getByRole("button", { name, exact: true });
      await button.focus();
      expect(await button.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe("2px");
    }

    const controls = page.getByTestId("button-preview-mode-controls");
    const primary = page.getByRole("button", { name: "Primary", exact: true });
    for (const [mode, radius] of [["Sharp", "0px"], ["Rounded", "4px"], ["Pill", "9999px"], ["Squircle", "8px"]] as const) {
      await controls.getByRole("button", { name: mode }).click();
      for (let tab = 0; tab < 5 && !(await primary.evaluate((el) => el === document.activeElement)); tab += 1) {
        await page.keyboard.press("Tab");
      }
      await expect(primary).toBeFocused();
      expect(await primary.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
      const computed = await primary.evaluate((el) => {
        const style = getComputedStyle(el);
        return { radius: style.borderRadius, outline: style.outlineWidth };
      });
      expect(computed).toEqual({ radius, outline: "2px" });
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
