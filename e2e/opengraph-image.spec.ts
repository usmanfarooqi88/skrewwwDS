import { expect, test } from "./fixtures";

/**
 * Guards the production social-image contract: /opengraph-image must return
 * a real PNG body. Satori silently-or-loudly fails when a multi-child node
 * lacks display:flex|contents|none — production previously returned
 * HTTP 200 with content-length 0.
 */
test.describe("/opengraph-image", () => {
  test("returns a non-empty PNG body", async ({ page }) => {
    const response = await page.request.get("/opengraph-image");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"] ?? "").toContain("image/png");

    const body = await response.body();
    expect(body.byteLength).toBeGreaterThan(1000);
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    expect(Array.from(body.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  });
});
