import { expect, test } from "./fixtures";

test.describe("Phone Number Field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/phone-number-field");
  });

  test("exposes country select and type=tel number input", async ({ page }) => {
    const group = page.getByRole("group", { name: "Mobile number" }).first();
    await expect(group).toBeVisible();
    await expect(group.getByRole("combobox", { name: "Country" })).toBeVisible();
    const number = group.getByRole("textbox", { name: "Phone number" });
    await expect(number).toBeVisible();
    await expect(number).toHaveAttribute("type", "tel");
  });

  test("types and pastes international punctuation", async ({ page }) => {
    const group = page.getByRole("group", { name: "Mobile number" }).first();
    const number = group.getByRole("textbox", { name: "Phone number" });
    await number.click();
    await number.pressSequentially("+1 (555) 010");
    await expect(number).toHaveValue("+1 (555) 010");
    await expect(page.getByTestId("phone-number-field-value")).toContainText("+1 (555) 010");

    await number.fill("");
    await number.focus();
    await number.evaluate((el) => {
      const data = new DataTransfer();
      data.setData("text/plain", "+44-7700-900123");
      el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, clipboardData: data }));
    });
    await expect(number).toHaveValue("+44-7700-900123");
  });

  test("backspace edits the number without cursor corruption", async ({ page }) => {
    const group = page.getByRole("group", { name: "Mobile number" }).first();
    const number = group.getByRole("textbox", { name: "Phone number" });
    await number.click();
    await number.pressSequentially("555-0100");
    await number.press("Backspace");
    await expect(number).toHaveValue("555-010");
  });

  test("changes country via Select", async ({ page }) => {
    const group = page.getByRole("group", { name: "Mobile number" }).first();
    const country = group.getByRole("combobox", { name: "Country" });
    await country.click();
    await page.getByRole("option", { name: "United Kingdom (+44)" }).click();
    await expect(country).toContainText("United Kingdom (+44)");
    await expect(page.getByTestId("phone-number-field-value")).toContainText("GB");
  });

  test("disabled controls are not editable", async ({ page }) => {
    const group = page.getByRole("group", { name: "Mobile number" }).nth(2);
    await expect(group.getByRole("textbox", { name: "Phone number" })).toBeDisabled();
    await expect(group.getByRole("combobox", { name: "Country" })).toBeDisabled();
  });

  test("error state exposes invalid messaging", async ({ page }) => {
    const group = page.getByRole("group", { name: "Mobile number" }).nth(1);
    await expect(group).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Enter a valid phone number.")).toBeVisible();
  });

  test("narrow viewport keeps both controls usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    const group = page.getByRole("group", { name: "Mobile number" }).first();
    await expect(group.getByRole("combobox", { name: "Country" })).toBeVisible();
    await expect(group.getByRole("textbox", { name: "Phone number" })).toBeVisible();
  });
});
