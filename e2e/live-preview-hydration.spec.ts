import { expect, test } from "./fixtures";

/**
 * Browser-infrastructure guard. Component pages stream each live preview as a
 * lazy Suspense boundary. If an urgent app-wide update (e.g. the analytics
 * consent provider's mount read) reaches that boundary before it hydrates,
 * React discards the server HTML and client-renders the preview ~100ms after
 * `load`. Tests then measured or clicked detached nodes and saw empty computed
 * styles, zero-size boxes, and ignored keypresses across unrelated specs.
 *
 * This asserts the server-rendered preview node is the one that hydrates
 * (not replaced), and that the readiness marker the fixtures wait on
 * (components/docs/ComponentLiveSection.tsx) actually reaches "ready".
 */
// Scoped to the preview section: docs content elsewhere in <main> (e.g. a
// props table) is outside the lazy boundary and would be matched first.
const PREVIEW = 'section[aria-label="Interactive component preview"]';

for (const { slug, selector } of [
  { slug: "switch", selector: `${PREVIEW} button[role="switch"]` },
  { slug: "table", selector: `${PREVIEW} table` },
]) {
  test(`${slug}: live preview hydrates in place instead of being replaced`, async ({ page }) => {
    await page.addInitScript((sel) => {
      const record = () => {
        const el = document.querySelector(sel);
        if (el && !(window as unknown as { __firstPreviewNode?: Element }).__firstPreviewNode) {
          (window as unknown as { __firstPreviewNode?: Element }).__firstPreviewNode = el;
        }
      };
      new MutationObserver(record).observe(document, { childList: true, subtree: true });
    }, selector);

    // The shared fixture's goto also waits for the readiness marker.
    await page.goto(`/components/${slug}`);

    await expect(page.locator("[data-live-preview-state]")).toHaveAttribute(
      "data-live-preview-state",
      "ready",
    );

    const sameNode = await page.evaluate((sel) => {
      const first = (window as unknown as { __firstPreviewNode?: Element }).__firstPreviewNode;
      return Boolean(first) && first === document.querySelector(sel) && first!.isConnected;
    }, selector);
    expect(sameNode, "the server-rendered preview node must survive hydration").toBe(true);
  });
}
