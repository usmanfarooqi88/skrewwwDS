import { expect, expectColorClose, hexToRgba, resolvedRgba, rgbaStringToRgba, test } from "./fixtures";

test.describe("Switch", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/switch");
  });

  test("Off/default track fill uses the current semantic-border-strong value with no visible border", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    await expect(off).toBeVisible();

    // Intermediate Phase-1 state: the token still resolves neutral/300
    // (#C5C6CC) — Phase 2 moves this to neutral/400 separately.
    expectColorClose(await resolvedRgba(off, "backgroundColor"), hexToRgba("#C5C6CC"), "off track fill");

    const border = await off.evaluate((el) => {
      const style = getComputedStyle(el);
      return { width: style.borderWidth, style: style.borderStyle };
    });
    expect(border.width, "off must have no visible border").toBe("0px");
    expect(border.style).toBe("none");
  });

  test("On/checked keeps the action-primary fill with no unintended border", async ({ page }) => {
    const on = page.getByRole("switch", { name: "On by default" });
    expectColorClose(await resolvedRgba(on, "backgroundColor"), hexToRgba("#6C4CF2"), "on track fill");

    const borderWidth = await on.evaluate((el) => getComputedStyle(el).borderWidth);
    expect(borderWidth, "on must have no border").toBe("0px");
  });

  test("Off and On stay clearly distinct", async ({ page }) => {
    const off = page.getByRole("switch", { name: "Off by default" });
    const on = page.getByRole("switch", { name: "On by default" });
    const [offBg, onBg] = await Promise.all([
      resolvedRgba(off, "backgroundColor"),
      resolvedRgba(on, "backgroundColor"),
    ]);
    const delta = Math.abs(offBg.r - onBg.r) + Math.abs(offBg.g - onBg.g) + Math.abs(offBg.b - onBg.b);
    expect(delta, `Off ${JSON.stringify(offBg)} must remain clearly distinct from On ${JSON.stringify(onBg)}`).toBeGreaterThan(
      30,
    );
  });

  test("Disabled keeps its existing disabled fill with no resurrected border", async ({ page }) => {
    const disabled = page.getByRole("switch", { name: "Disabled" });
    expectColorClose(await resolvedRgba(disabled, "backgroundColor"), hexToRgba("#EDEDF0"), "disabled track fill");

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
    expectColorClose(await resolvedRgba(off, "backgroundColor"), hexToRgba("#C5C6CC"), "track fill unchanged on focus");
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
