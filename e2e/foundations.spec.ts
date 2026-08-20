import { expect, test } from "./fixtures";

/**
 * Structural regression coverage for the /foundations render-blocking-font
 * fix: fonts.googleapis.com/fonts.gstatic.com were replaced by a
 * next/font/google self-hosted setup (app/layout.tsx). This protects the
 * optimization contract itself — no external font request, core content
 * still server-rendered — not a timing assertion (those vary by machine).
 */
test.describe("/foundations", () => {
  test("core content is present in the initial server response (no client-only render)", async ({ page }) => {
    await page.goto("/foundations");
    await expect(page.getByRole("heading", { level: 1, name: "Foundations" })).toBeVisible();

    // Fetch the raw HTML directly — this is what a crawler/SEO bot and the
    // initial paint both see, independent of any client-side hydration.
    const response = await page.request.get("/foundations");
    const html = await response.text();
    expect(html).toContain("Foundations");
    for (const collection of ["Primitive", "Semantic", "Component", "Brand", "Shape", "Surface"]) {
      expect(html, `${collection} collection heading in server HTML`).toContain(`>${collection}<`);
    }
  });

  test("does not load fonts from an external Google Fonts request (self-hosted via next/font)", async ({ page }) => {
    const externalFontRequests: string[] = [];
    page.on("request", (req) => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(req.url())) externalFontRequests.push(req.url());
    });

    await page.goto("/foundations");
    await expect(page.getByRole("heading", { level: 1, name: "Foundations" })).toBeVisible();

    expect(externalFontRequests, `unexpected external font requests: ${externalFontRequests.join(", ")}`).toEqual([]);
  });

  test("applies the self-hosted Inter/JetBrains Mono font stack", async ({ page }) => {
    await page.goto("/foundations");
    const heading = page.getByRole("heading", { level: 1, name: "Foundations" });
    const sansFamily = await heading.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(sansFamily.toLowerCase()).toContain("inter");

    const monoLabel = page.locator("h2.font-mono").first();
    const monoFamily = await monoLabel.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(monoFamily.toLowerCase()).toMatch(/jetbrains/);
  });
});
