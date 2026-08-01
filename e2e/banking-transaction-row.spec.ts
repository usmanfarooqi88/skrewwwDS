import { expect, test } from "./fixtures";

test.describe("Banking Transaction Row browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/banking-transaction-row");
  });

  test("loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Banking Transaction Row" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("opens the anchored Popover on click and shows the merchant's detail fields", async ({ page }) => {
    const trigger = page.getByRole("button", { name: /Coffee Collective/ });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const dialog = page.getByRole("dialog", { name: "Coffee Collective transaction details" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("Category");
    await expect(dialog).toContainText("Dining");
    await expect(dialog).toContainText("Transaction ID");
  });

  test("closes the Popover on outside click and restores aria-expanded=false", async ({ page }) => {
    const trigger = page.getByRole("button", { name: /Coffee Collective/ });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("closes with Escape", async ({ page }) => {
    const trigger = page.getByRole("button", { name: /Coffee Collective/ });
    await trigger.click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("only one row's Popover is open at a time", async ({ page }) => {
    const coffeeTrigger = page.getByRole("button", { name: /Coffee Collective/ });
    const transitTrigger = page.getByRole("button", { name: /Metro Transit Authority/ });

    await coffeeTrigger.click();
    await expect(page.getByRole("dialog", { name: /Coffee Collective/ })).toBeVisible();

    await transitTrigger.click();
    await expect(page.getByRole("dialog", { name: /Metro Transit Authority/ })).toBeVisible();
    await expect(page.getByRole("dialog", { name: /Coffee Collective/ })).not.toBeVisible();
  });

  test("colors success, warning, and error statuses distinctly using existing semantic tokens", async ({ page }) => {
    // The page has several <ul> sections (Known open questions, Related
    // components, Related tokens) above the live preview — scope to the
    // one actually containing the transaction rows, not just the first <ul>.
    const list = page.locator("ul").filter({ hasText: "Coffee Collective" });
    await expect(list.locator('[class*="amount"][class*="success"]')).toHaveCount(2);
    await expect(list.locator('[class*="amount"][class*="warning"]')).toHaveCount(1);
    await expect(list.locator('[class*="amount"][class*="error"]')).toHaveCount(1);
  });
});
