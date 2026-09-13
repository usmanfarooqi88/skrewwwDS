import { expect, test } from "./fixtures";

test.describe("Number Input", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/number-input");
  });

  test("exposes a labeled spinbutton with steppers", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Quantity" }).first();
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("type", "text");
    await expect(page.getByRole("button", { name: "Increment" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Decrement" }).first()).toBeVisible();
  });

  test("types decimals and updates the value readout", async ({ page }) => {
    const group = page.locator('[data-testid="number-input-value"]').locator("..");
    const input = page.getByRole("spinbutton", { name: "Quantity" }).first();
    await input.click();
    await input.fill("");
    await input.pressSequentially("12");
    await expect(page.getByTestId("number-input-value")).toContainText("12");
    await input.blur();
    await expect(input).toHaveValue("12");
    await expect(group).toBeVisible();
  });

  test("increment and arrow keys step the value", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Quantity" }).first();
    await expect(input).toHaveValue("1");
    await page.getByRole("button", { name: "Increment" }).first().click();
    await expect(input).toHaveValue("2");
    await expect(page.getByTestId("number-input-value")).toContainText("2");
    await input.focus();
    await page.keyboard.press("ArrowDown");
    await expect(input).toHaveValue("1");
  });

  test("clamps to max on blur", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Quantity" }).first();
    await input.fill("150");
    await input.blur();
    await expect(input).toHaveValue("99");
    await expect(page.getByTestId("number-input-value")).toContainText("99");
  });

  test("paste keeps numeric text", async ({ page }) => {
    const input = page.getByRole("spinbutton", { name: "Quantity" }).first();
    await input.fill("");
    await input.focus();
    await input.evaluate((el) => {
      const data = new DataTransfer();
      data.setData("text/plain", "42abc");
      el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: data }));
    });
    await expect(input).toHaveValue("42");
  });

  test("disabled and error states", async ({ page }) => {
    await expect(page.getByRole("spinbutton", { name: "Quantity" }).nth(1)).toBeDisabled();
    const errorField = page.getByRole("spinbutton", { name: "Threshold" });
    await expect(errorField).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Must be 10 or less.")).toBeVisible();
  });

  test("narrow viewport remains usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    await expect(page.getByRole("spinbutton", { name: "Quantity" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Increment" }).first()).toBeVisible();
  });
});
