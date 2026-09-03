import { test as base, expect, type Locator, type Page } from "@playwright/test";

/**
 * Vercel Web Analytics and Speed Insights request their script from an
 * endpoint Vercel's own infrastructure injects at the edge
 * (`/_vercel/insights/script.js`, `/_vercel/speed-insights/script.js`).
 * That endpoint doesn't exist on a locally built/served instance, so every
 * page load 404s here even though it won't on the real deployment. Mock
 * both to a harmless empty response so "no console errors" assertions
 * test real regressions instead of this expected local-only gap.
 */
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.route("**/_vercel/insights/script.js", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    await page.route("**/_vercel/speed-insights/script.js", (route) =>
      route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
    );
    await runTest(page);
  },
});

export { expect };

/**
 * Resolves a computed color (background-color, color, border-color) to
 * concrete 0-255 RGB + 0-1 alpha, regardless of which CSS serialization
 * Chromium chose for it. Observed in practice on the same underlying
 * color-mix() value across different reads: "rgb(...)", "color(srgb ...)",
 * and "oklab(...)" — Chromium's choice isn't stable, so parsing the string
 * with a format-specific regex (as an earlier test in this repo did) is
 * brittle by construction. Painting the raw string onto a 1x1 canvas and
 * reading the pixel back sidesteps the serialization question entirely —
 * the canvas 2D context accepts any valid CSS Color 4 syntax as fillStyle
 * and always reports back in plain 8-bit RGBA, whichever format it was.
 */
export async function resolvedRgba(
  locator: Locator,
  property: "backgroundColor" | "color" | "borderColor" | "borderTopColor",
  pseudoElement?: string,
): Promise<{ r: number; g: number; b: number; a: number }> {
  return locator.evaluate(
    (el, [prop, pseudo]) => {
      const value = getComputedStyle(el, pseudo || undefined)[prop as "backgroundColor"];
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      // Indexed rather than destructured — this repo's tsconfig targets es5,
      // and destructuring a canvas ImageData's Uint8ClampedArray-like `data`
      // needs downlevelIteration / an es2015+ target.
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return { r: data[0], g: data[1], b: data[2], a: data[3] / 255 };
    },
    [property, pseudoElement ?? ""] as const,
  );
}

/** Parses a "#rrggbb" hex string (optionally with a separate 0-1 alpha) into the same {r,g,b,a} shape resolvedRgba returns. */
export function hexToRgba(hex: string, alpha = 1): { r: number; g: number; b: number; a: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: alpha,
  };
}

/**
 * Parses an `rgb()`/`rgba()` string into the same {r,g,b,a} shape as
 * resolvedRgba and hexToRgba. resolvedRgba reads a live element property, so
 * it cannot reach colors that only exist as stops *inside* a computed
 * `linear-gradient(...)` value; this covers that case without giving any
 * spec its own private color-comparison logic.
 */
export function rgbaStringToRgba(color: string): { r: number; g: number; b: number; a: number } {
  const parts = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?\s*\)/.exec(color);
  if (!parts) throw new Error(`Unparseable rgb/rgba color: ${color}`);
  return {
    r: Number(parts[1]),
    g: Number(parts[2]),
    b: Number(parts[3]),
    a: parts[4] === undefined ? 1 : Number(parts[4]),
  };
}

/**
 * Tolerant color comparison — a color-mix()/oklab round-trip through the
 * canvas premultiplied-alpha conversion in resolvedRgba introduces a few
 * units of 8-bit rounding error per channel, so exact equality is the
 * wrong bar here. ±4 per RGB channel and ±0.03 alpha is generous enough to
 * absorb that rounding while still catching a genuinely wrong color
 * (a different hue or a materially different opacity tier).
 */
export function expectColorClose(
  actual: { r: number; g: number; b: number; a: number },
  expected: { r: number; g: number; b: number; a: number },
  message?: string,
) {
  const label = message ? `${message}: ` : "";
  expect(actual.r, `${label}red channel — actual ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`).toBeGreaterThanOrEqual(expected.r - 4);
  expect(actual.r).toBeLessThanOrEqual(expected.r + 4);
  expect(actual.g).toBeGreaterThanOrEqual(expected.g - 4);
  expect(actual.g).toBeLessThanOrEqual(expected.g + 4);
  expect(actual.b).toBeGreaterThanOrEqual(expected.b - 4);
  expect(actual.b).toBeLessThanOrEqual(expected.b + 4);
  expect(actual.a).toBeGreaterThanOrEqual(expected.a - 0.03);
  expect(actual.a).toBeLessThanOrEqual(expected.a + 0.03);
}

/**
 * Sets the Surface mode for the current page's document. Several Glass-
 * mode rules (Button Primary/Danger, Avatar, Calendar Day Selected,
 * Pagination Current) change background-color, and .button/.day/.control
 * all have a real `transition: background-color 0.15s ease` — reading
 * getComputedStyle() immediately after the attribute flip can catch a
 * mid-transition interpolated color instead of the settled one.
 *
 * A fixed `waitForTimeout` after the flip was tried first and is
 * deliberately not what shipped: under Playwright's default parallel
 * workers all hitting the same server at once, one run needed ~200ms and
 * passed, a later run of the exact same test needed more and failed with
 * an alpha read mid-transition — a real, observed flake, not a
 * hypothetical one. Neutralizing transitions/animations for the page
 * instead makes the read deterministic rather than racing a guessed
 * duration against real-world server/render load.
 */
export async function setSurfaceMode(page: Page, mode: "flat" | "gradient" | "glass") {
  await page.evaluate((m) => {
    if (!document.getElementById("__e2e-disable-transitions")) {
      const style = document.createElement("style");
      style.id = "__e2e-disable-transitions";
      style.textContent =
        "*, *::before, *::after { transition: none !important; animation: none !important; }";
      document.head.appendChild(style);
    }
    document.documentElement.setAttribute("data-skrewww-surface", m);
    void document.body.offsetHeight;
  }, mode);
}

/**
 * Hold the real browser pointer on `locator` so CSS :active is genuine.
 *
 * `locator.hover()` + `page.mouse.down()` is not enough on the docs site:
 * `html { scroll-behavior: smooth }` keeps scrolling after hover places the
 * mouse, so mousedown hits stale viewport coordinates and :active matches
 * html/body instead of the target.
 */
export async function holdPointerPressed(page: Page, locator: Locator) {
  await locator.evaluate((el) => {
    document.documentElement.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
  });

  const first = await locator.boundingBox();
  expect(first, "target must have a bounding box before press").toBeTruthy();
  await page.mouse.move(first!.x + first!.width / 2, first!.y + first!.height / 2);

  const box = await locator.boundingBox();
  expect(box, "target must keep a bounding box after pointer move").toBeTruthy();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);

  expect(await locator.evaluate((el) => el.matches(":hover")), "target :hover before press").toBe(true);
  await page.mouse.down();
  expect(await locator.evaluate((el) => el.matches(":active")), "target :active while pointer is down").toBe(true);

  return {
    async release() {
      await page.mouse.up();
      expect(await locator.evaluate((el) => el.matches(":active")), "target :active after release").toBe(false);
    },
  };
}
