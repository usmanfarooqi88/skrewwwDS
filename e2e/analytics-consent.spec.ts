import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

const CONSENT_KEY = "skrewww.analyticsConsent.v1";

/**
 * Stubs the real gtag.js fetch so tests stay hermetic — this environment has
 * no route to googletagmanager.com at all, so a real request would just
 * hang/fail rather than ever reach this handler; a CI environment with real
 * egress would hit it and get a harmless empty response either way.
 *
 * Because of that missing route, "was GA requested" is verified via
 * gaScriptTagCount() (DOM evidence: the <script src> @next/third-parties
 * injects) rather than by counting intercepted requests — confirmed by hand
 * against both `next dev` and the production build that the script tag
 * appears/doesn't appear exactly when expected, independent of whether the
 * fetch it triggers can actually complete in this sandbox.
 */
async function stubGtagScript(page: Page) {
  await page.route("**/googletagmanager.com/gtag/js**", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
}

function gaScriptTagCount(page: Page): Promise<number> {
  return page.evaluate(
    () => document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]').length,
  );
}

function banner(page: Page) {
  return page.getByRole("region", { name: "Analytics preferences" });
}

test.describe("Analytics consent", () => {
  test("fresh visitor: banner is visible and GA is never requested", async ({ page }) => {
    await stubGtagScript(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    await page.waitForTimeout(300);
    expect(await gaScriptTagCount(page)).toBe(0);
  });

  test("fresh visitor: named business events do not fire while undecided", async ({ page }) => {
    await stubGtagScript(page);
    await page.goto("/");
    const dataLayerLength = await page.evaluate(() => (window.dataLayer ?? []).length);
    await page.getByRole("link", { name: "Get free Figma file" }).click({ modifiers: ["Meta"] });
    await page.waitForTimeout(200);
    const events = await page.evaluate(
      (before) => (window.dataLayer ?? []).slice(before).map((entry) => Array.from(entry as unknown[])),
      dataLayerLength,
    );
    expect(events.some((entry) => entry[1] === "free_figma_click")).toBe(false);
  });

  test("Decline: persists, closes the banner, GA stays unrequested, and a reload keeps it hidden", async ({
    page,
  }) => {
    await stubGtagScript(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();

    await page.getByRole("button", { name: "Decline" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("denied");

    await page.reload();
    await expect(banner(page)).toBeHidden();
    await page.waitForTimeout(300);
    expect(await gaScriptTagCount(page)).toBe(0);
  });

  test("Decline: named business events remain suppressed after declining", async ({ page }) => {
    await stubGtagScript(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Decline" }).click();
    await expect(banner(page)).toBeHidden();

    const dataLayerLength = await page.evaluate(() => (window.dataLayer ?? []).length);
    await page.getByRole("link", { name: "Get Skrewww Pro" }).click({ modifiers: ["Meta"] });
    await page.waitForTimeout(200);
    const events = await page.evaluate(
      (before) => (window.dataLayer ?? []).slice(before).map((entry) => Array.from(entry as unknown[])),
      dataLayerLength,
    );
    expect(events.some((entry) => entry[1] === "pro_gumroad_click")).toBe(false);
  });

  test("Allow: persists, sends a scoped consent update, loads GA exactly once, and outbound links stay unchanged", async ({
    page,
  }) => {
    await stubGtagScript(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();

    const figmaLink = page.getByRole("link", { name: "Get free Figma file" });
    const gumroadLink = page.getByRole("link", { name: "Get Skrewww Pro" });
    await expect(figmaLink).toHaveAttribute(
      "href",
      "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
    );
    await expect(figmaLink).toHaveAttribute("target", "_blank");
    await expect(figmaLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(gumroadLink).toHaveAttribute("href", "https://usmanfarooqi.gumroad.com/l/skrewww-pro");

    await page.getByRole("button", { name: "Allow analytics" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("granted");

    await expect
      .poll(() => gaScriptTagCount(page), { message: "GA script tag should be present exactly once" })
      .toBe(1);

    const dataLayer = await page.evaluate(() => (window.dataLayer ?? []).map((entry) => Array.from(entry as unknown[])));
    const consentUpdate = dataLayer.find((entry) => entry[0] === "consent" && entry[1] === "update");
    expect(consentUpdate?.[2]).toEqual({
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    // The update must be queued before GA's own config call, per Consent Mode v2.
    const configIndex = dataLayer.findIndex((entry) => entry[0] === "config");
    const updateIndex = dataLayer.indexOf(consentUpdate!);
    expect(updateIndex).toBeLessThan(configIndex === -1 ? Infinity : configIndex);

    // Outbound navigation still works exactly as before, unaffected by tracking.
    await expect(figmaLink).toHaveAttribute("href", /figma\.com/);
    await expect(gumroadLink).toHaveAttribute("href", /gumroad\.com/);
  });

  test("Allow: named CTA events fire exactly once per click with the correct payload", async ({ page }) => {
    await stubGtagScript(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Allow analytics" }).click();
    await expect(banner(page)).toBeHidden();

    const dataLayerLength = await page.evaluate(() => (window.dataLayer ?? []).length);
    await page.getByRole("link", { name: "Get free Figma file" }).click({ modifiers: ["Meta"] });
    await page.waitForTimeout(200);
    const events = await page.evaluate(
      (before) => (window.dataLayer ?? []).slice(before).map((entry) => Array.from(entry as unknown[])),
      dataLayerLength,
    );
    const figmaEvents = events.filter((entry) => entry[1] === "free_figma_click");
    expect(figmaEvents).toHaveLength(1);
    expect(figmaEvents[0][2]).toEqual({
      cta_location: "home_hero",
      destination: "https://www.figma.com/community/file/1666920112751907121/skrewww-design-system-free",
      page_path: "/",
    });
  });

  test("returning granted visitor: banner stays hidden and GA loads once", async ({ page }) => {
    await stubGtagScript(page);
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CONSENT_KEY, "granted"],
    );
    await page.goto("/");
    await expect(banner(page)).toBeHidden();
    await expect.poll(() => gaScriptTagCount(page)).toBe(1);
  });

  test("returning denied visitor: banner stays hidden and GA is never requested", async ({ page }) => {
    await stubGtagScript(page);
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CONSENT_KEY, "denied"],
    );
    await page.goto("/");
    await expect(banner(page)).toBeHidden();
    await page.waitForTimeout(300);
    expect(await gaScriptTagCount(page)).toBe(0);
  });

  test("malformed stored value safely falls back to the undecided/banner state", async ({ page }) => {
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CONSENT_KEY, "yes-please"],
    );
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
  });

  test("reopening: a granted visitor can switch to denied immediately via the sidebar link, no reload needed", async ({
    page,
  }) => {
    await stubGtagScript(page);
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CONSENT_KEY, "granted"],
    );
    await page.goto("/");
    await expect(banner(page)).toBeHidden();

    await page.getByRole("button", { name: "Analytics preferences" }).click();
    await expect(banner(page)).toBeVisible();

    await page.getByRole("button", { name: "Decline" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("denied");

    const dataLayer = await page.evaluate(() => (window.dataLayer ?? []).map((entry) => Array.from(entry as unknown[])));
    const lastUpdate = [...dataLayer].reverse().find((entry) => entry[0] === "consent" && entry[1] === "update");
    expect(lastUpdate?.[2]).toMatchObject({ analytics_storage: "denied" });
  });

  test("reopening: a denied visitor can switch to granted without a page reload", async ({ page }) => {
    await stubGtagScript(page);
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      [CONSENT_KEY, "denied"],
    );
    await page.goto("/");
    await expect(banner(page)).toBeHidden();
    expect(await gaScriptTagCount(page)).toBe(0);

    await page.getByRole("button", { name: "Analytics preferences" }).click();
    await expect(banner(page)).toBeVisible();

    await page.getByRole("button", { name: "Allow analytics" }).click();
    await expect(banner(page)).toBeHidden();
    expect(await page.evaluate((key) => window.localStorage.getItem(key), CONSENT_KEY)).toBe("granted");
    await expect.poll(() => gaScriptTagCount(page)).toBe(1);
  });

  test("banner is keyboard accessible with visible focus, and is not a modal/focus trap", async ({ page }) => {
    await stubGtagScript(page);
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).not.toHaveAttribute("aria-modal");

    await page.getByRole("button", { name: "Decline" }).focus();
    await expect(page.getByRole("button", { name: "Decline" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Allow analytics" })).toBeFocused();
    // Tab again — a real modal/focus trap would keep focus inside the
    // banner; this should be free to move to whatever's next in the page.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Allow analytics" })).not.toBeFocused();
  });

  test("UTM parameters survive initial landing unmodified", async ({ page }) => {
    await stubGtagScript(page);
    await page.goto("/?utm_source=test&utm_medium=email&utm_campaign=launch&utm_content=variant_a");
    expect(page.url()).toContain("utm_source=test");
    expect(page.url()).toContain("utm_medium=email");
    expect(page.url()).toContain("utm_campaign=launch");
    expect(page.url()).toContain("utm_content=variant_a");
  });
});
