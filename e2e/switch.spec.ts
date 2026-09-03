import { expect, expectColorClose, hexToRgba, resolvedRgba, rgbaStringToRgba, test } from "./fixtures";

test.describe("Switch", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/switch");
  });

  test("Off/default track fill uses the current semantic-border-strong value with no visible border", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    await expect(off).toBeVisible();

    // Canonical Figma value as of Phase 2 — neutral/400 (#A0A3AC).
    // The fill lives on ::before (see switch.module.css) so Disabled can
    // dim the track without dimming the Thumb.
    expectColorClose(await resolvedRgba(off, "backgroundColor", "::before"), hexToRgba("#A0A3AC"), "off track fill");

    const border = await off.evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: style.borderWidth, style: style.borderStyle };
    });
    expect(border.width, "off must have no visible border").toBe("0px");
    expect(border.style).toBe("none");
  });

  test("On/checked keeps the action-primary fill with no unintended border", async ({ page }) => {
    const on = page.getByRole("switch", { name: "On by default" });
    expectColorClose(await resolvedRgba(on, "backgroundColor", "::before"), hexToRgba("#6C4CF2"), "on track fill");

    const borderWidth = await on.evaluate((el) => getComputedStyle(el).borderWidth);
    expect(borderWidth, "on must have no border").toBe("0px");
  });

  test("On/hover uses the confirmed semantic-action-primary-hover fill (color/brand/600)", async ({ page }) => {
    const on = page.getByRole("switch", { name: "On by default" });
    // Figma's On/Hover Track fill is bound to color/brand/600 (#5638D6) —
    // the same primitive semantic-action-primary-hover already aliases.
    await on.hover();
    // The fill transitions over 0.15s (background-color ease) — wait it out
    // before sampling, or the read can land mid-tween.
    await page.waitForTimeout(200);
    expectColorClose(await resolvedRgba(on, "backgroundColor", "::before"), hexToRgba("#5638D6"), "on/hover track fill");
  });

  test("Off/hover fill is unchanged — Figma's Off/Hover variant reuses the Off/Default fill", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    await off.hover();
    await page.waitForTimeout(200);
    expectColorClose(await resolvedRgba(off, "backgroundColor", "::before"), hexToRgba("#A0A3AC"), "off/hover track fill");
  });

  test("Off and On stay clearly distinct", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    const on = page.getByRole("switch", { name: "On by default" });
    const [offBg, onBg] = await Promise.all([
      resolvedRgba(off, "backgroundColor", "::before"),
      resolvedRgba(on, "backgroundColor", "::before"),
    ]);
    const delta = Math.abs(offBg.r - onBg.r) + Math.abs(offBg.g - onBg.g) + Math.abs(offBg.b - onBg.b);
    expect(delta, `Off ${JSON.stringify(offBg)} must remain clearly distinct from On ${JSON.stringify(onBg)}`).toBeGreaterThan(
      30,
    );
  });

  test("Disabled dims Track and Label to 40% opacity but keeps Thumb fully opaque", async ({ page }) => {
    const disabled = page.getByRole("switch", { name: "Disabled" });

    // Track fill keeps its Off base color (semantic/border/strong) — Figma
    // dims via node opacity, not a swapped-in disabled surface color.
    expectColorClose(await resolvedRgba(disabled, "backgroundColor", "::before"), hexToRgba("#A0A3AC"), "disabled track fill");

    const trackOpacity = await disabled.evaluate((el) => Number(getComputedStyle(el, "::before").opacity));
    expect(trackOpacity, "track ::before opacity").toBeCloseTo(0.4, 2);

    const thumbOpacity = await disabled.evaluate(
      (el) => Number(getComputedStyle(el.querySelector("span")!).opacity),
    );
    expect(thumbOpacity, "thumb must stay fully opaque — Figma's Thumb node opacity is 1 even when Disabled").toBe(1);

    const labelOpacity = await page
      .locator("#" + (await disabled.getAttribute("aria-labelledby")))
      .evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(labelOpacity, "label opacity").toBeCloseTo(0.4, 2);

    const borderWidth = await disabled.evaluate((el) => getComputedStyle(el).borderWidth);
    expect(borderWidth, "disabled must have no border").toBe("0px");
  });

  test("focus ring remains independent of the track fill", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });

    await off.focus();
    await expect(off).toBeFocused();
    expect(await off.evaluate((el) => el.matches(":focus-visible"))).toBe(true);

    const focus = await off.evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth, color: style.outlineColor };
    });
    expect(focus.style).toBe("solid");
    expect(focus.width).toBe("2px");
    expectColorClose(rgbaStringToRgba(focus.color), hexToRgba("#6C4CF2"), "focus ring colour");

    // The track fill itself must be unaffected by focus.
    expectColorClose(
      await resolvedRgba(off, "backgroundColor", "::before"),
      hexToRgba("#A0A3AC"),
      "track fill unchanged on focus",
    );

    // Focus does not shift or resize the 40×24 track.
    const box = await off.boundingBox();
    expect(box?.width).toBeCloseTo(40, 0);
    expect(box?.height).toBeCloseTo(24, 0);
  });

  test("label gap is exactly 8px (--control-gap), not the previous 12px approximation", async ({ page }) => {
    const control = page.getByRole("switch", { name: "Off by default" }).locator("..");
    const gap = await control.evaluate((el) => getComputedStyle(el).gap);
    expect(gap).toBe("8px");
  });

  test("thumb travel is exactly 18px — Off x=2, On x=20 relative to the track", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    const on = page.getByRole("switch", { name: "On by default" });

    const offTrackBox = await off.boundingBox();
    const offThumbBox = await off.locator("span").first().boundingBox();
    const onTrackBox = await on.boundingBox();
    const onThumbBox = await on.locator("span").first().boundingBox();
    if (!offTrackBox || !offThumbBox || !onTrackBox || !onThumbBox) throw new Error("missing bounding box");

    const offInset = offThumbBox.x - offTrackBox.x;
    const onInset = onThumbBox.x - onTrackBox.x;
    expect(offInset, "Off thumb inset").toBeCloseTo(2, 0);
    expect(onInset, "On thumb inset").toBeCloseTo(20, 0);
    expect(onInset - offInset, "effective travel").toBeCloseTo(18, 0);
  });

  test("Shape modes change the Track radius, keep the Thumb circular, and leave geometry/colors/gap untouched", async ({
    page,
  }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    const on = page.getByRole("switch", { name: "On by default" });
    const control = off.locator("..");

    // Track consumes the shared --shape-radius-control runtime token, same
    // as every other Shape-aware component — Switch does not own these
    // numbers. Rounded is 6px here, not Figma's newly-confirmed 4px; that
    // gap is pre-existing in the global [data-skrewww-shape="rounded"]
    // token (styles/tokens.css) and out of scope for a Switch-only change
    // — fixing it would move every other Shape-aware component's Rounded
    // radius too. Asserted as 6px to catch accidental regressions here;
    // update this value if/when that global token is corrected.
    const expectedRadius: Record<string, string> = {
      sharp: "0px",
      rounded: "6px",
      pill: "9999px",
      squircle: "8px",
    };

    for (const shape of ["sharp", "rounded", "pill", "squircle"] as const) {
      await page.evaluate((mode) => document.documentElement.setAttribute("data-skrewww-shape", mode), shape);

      const trackRadius = await off.evaluate((el) => getComputedStyle(el, "::before").borderRadius);
      expect(trackRadius, `${shape} track radius`).toBe(expectedRadius[shape]);

      const thumbRadius = await off.evaluate((el) => getComputedStyle(el.querySelector("span")!).borderRadius);
      expect(thumbRadius, `${shape} thumb stays circular`).toBe("50%");

      const trackBox = await off.boundingBox();
      expect(trackBox?.width, `${shape} track width`).toBeCloseTo(40, 0);
      expect(trackBox?.height, `${shape} track height`).toBeCloseTo(24, 0);

      const thumbBox = await off.locator("span").first().boundingBox();
      expect(thumbBox?.width, `${shape} thumb width`).toBeCloseTo(18, 0);
      expect(thumbBox?.height, `${shape} thumb height`).toBeCloseTo(18, 0);

      expectColorClose(
        await resolvedRgba(off, "backgroundColor", "::before"),
        hexToRgba("#A0A3AC"),
        `${shape} off fill unaffected by Shape`,
      );
      expectColorClose(
        await resolvedRgba(on, "backgroundColor", "::before"),
        hexToRgba("#6C4CF2"),
        `${shape} on fill unaffected by Shape`,
      );

      const gap = await control.evaluate((el) => getComputedStyle(el).gap);
      expect(gap, `${shape} label gap unaffected by Shape`).toBe("8px");
    }

    await page.evaluate(() => document.documentElement.removeAttribute("data-skrewww-shape"));
  });

  test("external track size and thumb geometry are unchanged", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    const on = page.getByRole("switch", { name: "On by default" });

    for (const [label, control] of [
      ["off", off],
      ["on", on],
    ] as const) {
      const box = await control.boundingBox();
      expect(box?.width, `${label} track width`).toBeCloseTo(40, 0);
      expect(box?.height, `${label} track height`).toBeCloseTo(24, 0);

      const thumb = control.locator("span").first();
      const thumbBox = await thumb.boundingBox();
      expect(thumbBox?.width, `${label} thumb width`).toBeCloseTo(18, 0);
      expect(thumbBox?.height, `${label} thumb height`).toBeCloseTo(18, 0);

      // Thumb stays vertically centered.
      if (box && thumbBox) {
        const topGap = thumbBox.y - box.y;
        const bottomGap = box.y + box.height - (thumbBox.y + thumbBox.height);
        expect(Math.abs(topGap - bottomGap), `${label} thumb vertical centering`).toBeLessThan(0.5);
      }
    }
  });
});
