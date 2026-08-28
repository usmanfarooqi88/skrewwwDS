import { expect, test } from "./fixtures";

test.describe("Changelog", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/changelog");
  });

  test("renders with a heading and the newest release first", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();
    const firstArticle = page.locator("article").first();
    await expect(firstArticle).toBeVisible();
    await expect(firstArticle.locator("time")).toBeVisible();
  });

  test("shows New, Improved, and Fixed labels with content", async ({ page }) => {
    // Scoped to the Skrewww 1.0 entry specifically, not "the newest article"
    // — a newer entry legitimately doesn't need to use all three item types
    // (e.g. an analytics-only release has no "Fixed" item), but this entry
    // always carries all three and exercises the badge rendering itself.
    const skrewww1Article = page.locator("article").filter({ hasText: "Skrewww 1.0" });
    await expect(skrewww1Article.getByText("New", { exact: true })).toBeVisible();
    await expect(skrewww1Article.getByText("Improved", { exact: true })).toBeVisible();
    await expect(skrewww1Article.getByText("Fixed", { exact: true })).toBeVisible();
  });

  test("is reachable from the sidebar navigation", async ({ page }) => {
    await page.goto("/foundations");
    await page.getByRole("link", { name: "Changelog" }).click();
    await expect(page).toHaveURL(/\/changelog$/);
    await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();
  });

  test("has no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Changelog — mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("has no horizontal overflow and readable labels", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(hasOverflow).toBe(false);

    const firstArticle = page.locator("article").first();
    await expect(firstArticle.getByText("New", { exact: true })).toBeVisible();
  });
});
