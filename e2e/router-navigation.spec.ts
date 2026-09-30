import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Canonical Skrewww links render native anchors and know nothing about Next.
 * The docs app connects them to next/navigation through one adapter
 * (components/providers/NextRouterIntegration.tsx) so internal links keep
 * client-side navigation. These tests prove that contract in a real browser.
 */

/** Records whether the page's own handlers cancelled each click's default. */
async function recordClickDefaults(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __clicks: boolean[]; __alive: string };
    w.__clicks = [];
    w.__alive = "same-document";
    // Bubble phase on document runs after React's handlers on the root container.
    document.addEventListener("click", (event) => w.__clicks.push(event.defaultPrevented), {
      capture: false,
    });
  });
}

const clicks = (page: Page) =>
  page.evaluate(() => (window as unknown as { __clicks: boolean[] }).__clicks);
const alive = (page: Page) =>
  page.evaluate(() => (window as unknown as { __alive?: string }).__alive);

test.describe("Router integration in the docs app", () => {
  test("a canonical Button with href remains a real anchor", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Browse components" });
    await expect(cta).toHaveCount(1);
    expect(await cta.evaluate((el) => el.tagName)).toBe("A");
    await expect(cta).toHaveAttribute("href", "/components");
  });

  test("a canonical Link remains a real anchor with href and accessible name", async ({ page }) => {
    await page.goto("/components/link");
    const internal = page.getByRole("link", { name: "Internal documentation link" });
    expect(await internal.evaluate((el) => el.tagName)).toBe("A");
    await expect(internal).toHaveAttribute("href", "/components/button");
  });

  test("a plain click on an internal link navigates client-side (no document reload)", async ({ page }) => {
    await page.goto("/");
    await recordClickDefaults(page);

    await page.getByRole("link", { name: "Browse components" }).click();
    await expect(page).toHaveURL(/\/components$/);

    // The same JS document is still alive, so this was not a full page load.
    expect(await alive(page)).toBe("same-document");
    expect((await clicks(page))[0]).toBe(true);
  });

  test("a Button link on /reference also navigates client-side", async ({ page }) => {
    await page.goto("/reference");
    await recordClickDefaults(page);
    await page.getByRole("link", { name: "New request" }).first().click();
    await expect(page).toHaveURL(/\/reference\/new$/);
    expect(await alive(page)).toBe("same-document");
  });

  test("modified clicks are left to the browser and do not navigate this page", async ({ page, context }) => {
    await page.goto("/");
    await recordClickDefaults(page);
    const link = page.getByRole("link", { name: "Browse components" });

    const popup = context.waitForEvent("page");
    await link.click({ modifiers: ["ControlOrMeta"] });
    (await popup).close().catch(() => {});

    await expect(page).toHaveURL(/\/$/);
    expect((await clicks(page))[0]).toBe(false);
  });

  test("an external target=_blank link is not intercepted", async ({ page, context }) => {
    await page.goto("/components/link");
    await recordClickDefaults(page);
    const external = page.getByRole("link", { name: "External reference" });
    await expect(external).toHaveAttribute("href", "https://example.com");
    await expect(external).toHaveAttribute("target", "_blank");

    await context.route("https://example.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "text/html", body: "<title>external</title>" }),
    );
    const popup = context.waitForEvent("page");
    await external.click();
    (await popup).close().catch(() => {});

    await expect(page).toHaveURL(/\/components\/link$/);
    expect((await clicks(page))[0]).toBe(false);
  });
});
