import { test as base, expect } from "@playwright/test";

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
