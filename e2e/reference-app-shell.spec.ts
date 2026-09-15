import { expect, test } from "./fixtures";

async function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
}

test.describe("Reference App shell", () => {
  test("desktop shell shows aside nav, active route, and main content", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference");

    await expect(page.getByRole("complementary", { name: "Reference app sidebar" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Reference app" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation" })).toHaveCount(0);

    await page.getByRole("navigation", { name: "Reference app" }).getByRole("link", { name: "Requests" }).click();
    await expect(page).toHaveURL(/\/reference\/data$/);
    await expect(page.getByRole("heading", { name: "Requests", level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Requests" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    expect(errors).toEqual([]);
  });

  test("narrow desktop keeps aside navigation at 900px", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("/reference/settings");
    await expect(page.getByRole("complementary", { name: "Reference app sidebar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  });

  test("mobile drawer opens, navigates, and restores focus on Escape", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/reference");

    await expect(page.getByRole("complementary", { name: "Reference app sidebar" })).toBeHidden();
    const menuButton = page.getByRole("button", { name: "Open navigation" });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const drawerNav = page.getByRole("dialog").getByRole("navigation", { name: "Reference app" });
    await expect(drawerNav).toBeVisible();
    await drawerNav.getByRole("link", { name: "New request" }).click();
    await expect(page).toHaveURL(/\/reference\/new$/);
    await expect(page.getByRole("heading", { name: "New request", level: 1 })).toBeVisible();

    await menuButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    expect(errors).toEqual([]);
  });

  test("edit route resolves fixture id and 404s unknown ids", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/edit/req_001");
    await expect(page.getByRole("heading", { name: "Edit req_001", level: 1 })).toBeVisible();

    const missing = await page.goto("/reference/edit/req_missing");
    expect(missing?.status()).toBe(404);
  });
});
