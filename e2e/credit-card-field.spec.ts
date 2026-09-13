import { expect, test } from "./fixtures";

test.describe("Credit Card Field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/credit-card-field");
  });

  test("exposes three labeled text segments", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).first();
    await expect(group).toBeVisible();
    await expect(group.getByRole("textbox", { name: "Card number" })).toBeVisible();
    await expect(group.getByRole("textbox", { name: "Expiry" })).toBeVisible();
    await expect(group.getByRole("textbox", { name: "CVC" })).toBeVisible();
  });

  test("formats typed number and keeps digit-only state readout", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).first();
    const number = group.getByRole("textbox", { name: "Card number" });
    await number.click();
    await number.pressSequentially("41111111");
    await expect(number).toHaveValue("4111 1111");
    await expect(page.getByTestId("credit-card-field-digits")).toContainText("41111111");
  });

  test("formats expiry as MM/YY", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).first();
    const expiry = group.getByRole("textbox", { name: "Expiry" });
    await expiry.click();
    await expiry.pressSequentially("1230");
    await expect(expiry).toHaveValue("12/30");
  });

  test("paste strips non-digits into the number field", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).first();
    const number = group.getByRole("textbox", { name: "Card number" });
    await number.focus();
    await number.evaluate((el) => {
      const data = new DataTransfer();
      data.setData("text/plain", "4111-1111-1111-1111");
      el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: data }));
    });
    await expect(number).toHaveValue("4111 1111 1111 1111");
    await expect(page.getByTestId("credit-card-field-digits")).toContainText("4111111111111111");
  });

  test("Tab moves across segments", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).first();
    await group.getByRole("textbox", { name: "Card number" }).focus();
    await page.keyboard.press("Tab");
    await expect(group.getByRole("textbox", { name: "Expiry" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(group.getByRole("textbox", { name: "CVC" })).toBeFocused();
  });

  test("disabled segments are not editable", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).nth(2);
    await expect(group.getByRole("textbox", { name: "Card number" })).toBeDisabled();
  });

  test("error state exposes invalid messaging", async ({ page }) => {
    const group = page.getByRole("group", { name: "Card details" }).nth(1);
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Check the card details and try again.")).toBeVisible();
  });

  test("narrow viewport keeps the compound shell usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    const group = page.getByRole("group", { name: "Card details" }).first();
    await expect(group.getByRole("textbox", { name: "Card number" })).toBeVisible();
    await expect(group.getByRole("textbox", { name: "CVC" })).toBeVisible();
  });
});
