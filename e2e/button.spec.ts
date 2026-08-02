import { expect, test } from "./fixtures";

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
});
