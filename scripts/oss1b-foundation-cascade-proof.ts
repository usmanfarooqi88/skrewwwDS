/**
 * OSS-1B Option B cascade proof — computed styles, not source inspection.
 *
 * Loads the *generated* Foundation CSS (exact consumer bytes) into a blank
 * Chromium page and proves:
 *   1. Component-tier defaults resolve on :root / <html>
 *   2. Shape mode overrides beat those defaults when set on <html>
 *   3. Surface mode overrides beat those defaults when set on <html>
 *   4. Cross-component tokens (popover / calendar-day) resolve without
 *      another component's CSS module present
 *
 * Run: npx tsx scripts/oss1b-foundation-cascade-proof.ts
 */
import { chromium } from "@playwright/test";
import { extractFoundationCss } from "../lib/shadcn-registry-generator";

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function ok(message: string) {
  console.log(`  ✓ ${message}`);
}

async function main() {
  const css = extractFoundationCss();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html><head><style>${css}</style></head>
<body>
  <div id="badge" style="
    padding: var(--badge-padding-y-md) var(--badge-padding-x-md);
    border-radius: var(--badge-radius);
    background: var(--badge-success-surface);
    border: 1px solid var(--badge-success-border);
    color: var(--badge-success-text);
    gap: var(--badge-gap);
  "></div>
  <div id="alert" style="
    padding: var(--feedback-padding);
    border-radius: var(--feedback-radius);
    border: 1px solid var(--feedback-info-border);
    background: var(--feedback-info-surface);
  "></div>
  <div id="menu" style="background: var(--menu-surface);"></div>
  <div id="page" style="border-radius: var(--pagination-page-radius);"></div>
  <div id="upload" style="background: var(--file-upload-dragging-surface);"></div>
  <div id="popover" style="
    background: var(--popover-surface);
    box-shadow: var(--popover-elevation);
    border: 1px solid var(--popover-border);
  "></div>
  <div id="day" style="
    width: var(--calendar-day-size);
    height: var(--calendar-day-size);
    border-radius: var(--calendar-day-radius);
  "></div>
</body></html>`);

  const read = (id: string) =>
    page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        paddingTop: s.paddingTop,
        paddingLeft: s.paddingLeft,
        borderRadius: s.borderTopLeftRadius,
        background: s.backgroundColor,
        borderColor: s.borderTopColor,
        color: s.color,
        width: s.width,
        height: s.height,
        boxShadow: s.boxShadow,
        tokenBadgeGap: getComputedStyle(document.documentElement).getPropertyValue("--badge-gap").trim(),
        tokenMenuSurface: getComputedStyle(document.documentElement).getPropertyValue("--menu-surface").trim(),
        tokenPageRadius: getComputedStyle(document.documentElement).getPropertyValue("--pagination-page-radius").trim(),
        tokenUpload: getComputedStyle(document.documentElement).getPropertyValue("--file-upload-dragging-surface").trim(),
        tokenPopover: getComputedStyle(document.documentElement).getPropertyValue("--popover-surface").trim(),
        tokenDaySize: getComputedStyle(document.documentElement).getPropertyValue("--calendar-day-size").trim(),
      };
    });

  // --- Defaults ---
  const badge = await read("badge");
  if (badge.paddingTop === "0px" || badge.paddingLeft === "0px") fail(`Badge padding unresolved: ${JSON.stringify(badge)}`);
  if (badge.borderRadius === "0px") fail(`Badge radius unresolved: ${badge.borderRadius}`);
  if (badge.background === "rgba(0, 0, 0, 0)" || badge.background === "transparent") {
    fail(`Badge background unresolved: ${badge.background}`);
  }
  ok(`Badge defaults resolve (pad ${badge.paddingTop}/${badge.paddingLeft}, radius ${badge.borderRadius}, bg ${badge.background})`);

  const alert = await read("alert");
  if (alert.paddingTop === "0px") fail(`Alert padding unresolved`);
  if (alert.borderRadius === "0px") fail(`Alert radius unresolved`);
  ok(`Alert defaults resolve (pad ${alert.paddingTop}, radius ${alert.borderRadius}, border ${alert.borderColor})`);

  const menuDefault = await read("menu");
  ok(`Menu default surface: ${menuDefault.background} (token ${menuDefault.tokenMenuSurface})`);

  const pageDefault = await read("page");
  ok(`Pagination default radius: ${pageDefault.borderRadius} (token ${pageDefault.tokenPageRadius})`);

  const uploadDefault = await read("upload");
  ok(`File Upload dragging default: ${uploadDefault.background}`);

  const popover = await read("popover");
  if (!popover.tokenPopover) fail("Popover surface token missing from Foundation");
  if (popover.boxShadow === "none") fail("Popover elevation unresolved (shadow-4 primitives)");
  ok(`Popover tokens resolve without Select/Date Picker CSS (bg ${popover.background}, shadow present)`);

  const day = await read("day");
  if (day.width === "0px" || day.height === "0px") fail(`Calendar day size unresolved: ${day.width}×${day.height}`);
  ok(`Calendar day tokens resolve without Calendar Period Cell CSS (${day.width}, radius ${day.borderRadius})`);

  // --- Shape mode on <html> (equal specificity → later source wins) ---
  await page.evaluate(() => document.documentElement.setAttribute("data-skrewww-shape", "pill"));
  const pagePill = await read("page");
  if (pagePill.borderRadius === pageDefault.borderRadius) {
    fail(`Shape=pill did not override pagination radius (still ${pagePill.borderRadius})`);
  }
  ok(`Shape=pill overrides pagination radius: ${pageDefault.borderRadius} → ${pagePill.borderRadius}`);

  await page.evaluate(() => document.documentElement.setAttribute("data-skrewww-shape", "sharp"));
  const pageSharp = await read("page");
  if (pageSharp.borderRadius !== "0px") {
    fail(`Shape=sharp expected 0px pagination radius, got ${pageSharp.borderRadius}`);
  }
  ok(`Shape=sharp overrides pagination radius to 0px`);

  await page.evaluate(() => document.documentElement.removeAttribute("data-skrewww-shape"));

  // --- Surface mode on <html> ---
  await page.evaluate(() => document.documentElement.setAttribute("data-skrewww-surface", "glass"));
  const menuGlass = await read("menu");
  const uploadGlass = await read("upload");
  if (menuGlass.background === menuDefault.background) {
    fail(`Surface=glass did not override menu surface`);
  }
  if (uploadGlass.background === uploadDefault.background) {
    fail(`Surface=glass did not override file-upload dragging surface`);
  }
  ok(`Surface=glass overrides menu: ${menuDefault.background} → ${menuGlass.background}`);
  ok(`Surface=glass overrides file-upload dragging: ${uploadDefault.background} → ${uploadGlass.background}`);

  await page.evaluate(() => document.documentElement.removeAttribute("data-skrewww-surface"));
  const menuRestored = await read("menu");
  if (menuRestored.background !== menuDefault.background) {
    fail(`Removing Surface mode did not restore menu default`);
  }
  ok("Removing Surface mode restores menu default");

  await browser.close();
  console.log("\nOSS-1B Foundation cascade proof: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
