import { expect, test } from "@playwright/test";

test.describe("Timeline browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/timeline");
  });

  test("renders the preview's events as a real ordered list with no console errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.reload();
    const list = page.getByRole("list").filter({ hasText: "Order placed" });
    await expect(list).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(4);
    expect(errors).toEqual([]);
  });

  test("suppresses the connector only on the last item, independent of state", async ({ page }) => {
    const list = page.getByRole("list").filter({ hasText: "Order placed" });
    const items = list.getByRole("listitem");

    // 4 items -> 3 connectors (every item except the last).
    await expect(list.locator('[class*="connector"]')).toHaveCount(3);
    // The last item ("Delivered") has no connector inside it.
    const lastItem = items.nth(3);
    await expect(lastItem).toContainText("Delivered");
    await expect(lastItem.locator('[class*="connector"]')).toHaveCount(0);
  });

  test("renders the highlighted item's larger marker and its long wrapping description in full", async ({
    page,
  }) => {
    const list = page.getByRole("list").filter({ hasText: "Order placed" });
    const highlightedItem = list.getByRole("listitem").nth(1);
    await expect(highlightedItem).toContainText("Payment confirmed");
    await expect(highlightedItem.locator('[class*="markerHighlighted"]')).toHaveCount(1);
    await expect(highlightedItem).toContainText("fraud detection system");
    // Not the last item, so it must still have a connector despite the long description.
    await expect(highlightedItem.locator('[class*="connector"]')).toHaveCount(1);
  });
});
