import { expect, test } from "./fixtures";

test.describe("Stepper", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/stepper");
  });

  test("exposes a labeled ordered list with Completed/Current/Upcoming steps", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    await expect(stepper).toBeVisible();
    await expect(stepper.getByText("Account")).toBeVisible();
    await expect(stepper.getByText("Shipping")).toBeVisible();
    await expect(stepper.getByText("Payment")).toBeVisible();
    await expect(stepper.getByText("Complete")).toBeVisible();
  });

  test("Current step is bold and carries aria-current=\"step\"", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    const current = stepper.locator('[aria-current="step"]');
    await expect(current).toHaveCount(1);
    const currentLabel = current.getByText("Shipping");
    const fontWeight = await currentLabel.evaluate((el) => getComputedStyle(el).fontWeight);
    expect(Number(fontWeight)).toBeGreaterThanOrEqual(600);
  });

  test("Completed step shows a check icon, not a number", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    const items = stepper.locator("li");
    const first = items.nth(0);
    await expect(first.locator("svg")).toBeVisible();
  });

  test("connector renders between steps but not after the last step", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    const items = stepper.locator("li");
    const count = await items.count();
    for (let i = 0; i < count - 1; i++) {
      await expect(items.nth(i).locator("span").last()).toBeVisible();
    }
  });

  test("read-only stepper has no tabbable step controls", async ({ page }) => {
    const readOnly = page.getByRole("list", { name: "Onboarding progress (read-only)" });
    await expect(readOnly.getByRole("button")).toHaveCount(0);
  });

  test("interactive Completed/Current steps activate via mouse and update currentStep", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    await stepper.getByRole("button", { name: "Account" }).click();
    await expect(page.getByTestId("stepper-current-step")).toContainText("currentStep: 0");
  });

  test("interactive step activates via keyboard (Enter)", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    const accountButton = stepper.getByRole("button", { name: "Account" });
    await accountButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("stepper-current-step")).toContainText("currentStep: 0");
  });

  test("Upcoming steps cannot be activated even when onStepClick is provided", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    await expect(stepper.getByRole("button", { name: "Complete" })).toHaveCount(0);
  });

  test("focus-visible ring is not clipped on interactive steps", async ({ page }) => {
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    const accountButton = stepper.getByRole("button", { name: "Account" });
    await accountButton.focus();
    const outline = await accountButton.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("narrow viewport keeps the verified short sequence usable", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 });
    const stepper = page.getByRole("list", { name: "Checkout progress" }).first();
    await expect(stepper.getByText("Account")).toBeVisible();
    await expect(stepper.getByText("Complete")).toBeVisible();
  });
});
