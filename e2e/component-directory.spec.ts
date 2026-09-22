import { expect, test } from "./fixtures";

test.describe("component directory discovery", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("exposes categories, specialized directories, maturity, and documentation-only patterns", async ({ page }) => {
    await page.goto("/components");
    const main = page.getByRole("main");
    const categoryNav = main.getByRole("navigation", { name: "Component categories" });

    for (const category of [
      "Actions",
      "Forms",
      "Navigation",
      "Feedback",
      "Containers & Overlays",
      "Content & Data",
    ]) {
      await expect(categoryNav.getByRole("link", { name: new RegExp(`^${category}`) })).toBeVisible();
      await expect(main.getByRole("heading", { level: 2, name: category })).toBeVisible();
    }

    await expect(main.getByRole("link", { name: /Charts 5 components/ })).toHaveAttribute(
      "href",
      "/components/charts",
    );
    await expect(main.getByRole("link", { name: /Industries 3 components/ })).toHaveAttribute(
      "href",
      "/components/industries",
    );
    await expect(main.getByRole("link", { name: /Button Stable/ })).toHaveAttribute(
      "href",
      "/components/button",
    );
    await expect(main.getByRole("link", { name: /Button Group Beta/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Sidebar Nav Item Docs only/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Bar Chart/ })).toHaveCount(0);
  });

  test("supports category jumps, category pages, component navigation, Charts, and Industries", async ({ page }) => {
    await page.goto("/components");
    const main = page.getByRole("main");

    await main.getByRole("navigation", { name: "Component categories" }).getByRole("link", { name: /^Forms/ }).click();
    await expect(page).toHaveURL(/\/components#forms$/);
    await expect(main.getByRole("heading", { level: 2, name: "Forms" })).toBeVisible();

    await main.getByRole("link", { name: /Button Stable/ }).click();
    await expect(page).toHaveURL(/\/components\/button$/);

    await page.goto("/components");
    await page.getByRole("main").getByRole("link", { name: /Charts 5 components/ }).click();
    await expect(page).toHaveURL(/\/components\/charts$/);

    await page.goto("/components");
    await page.getByRole("main").getByRole("link", { name: /Industries 3 components/ }).click();
    await expect(page).toHaveURL(/\/components\/industries$/);
  });

  test("aligns category pages with the directory status treatment", async ({ page }) => {
    await page.goto("/components/category/navigation");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 2, name: /Components and documented patterns/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Breadcrumb Stable/ })).toBeVisible();
    await expect(main.getByRole("link", { name: /Top Nav Item Docs only/ })).toBeVisible();
  });
});

for (const viewport of [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 900, height: 800 },
  { width: 1280, height: 900 },
  { width: 1440, height: 900 },
]) {
  test(`component directory remains scannable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/components");
    const metrics = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      columns: getComputedStyle(document.querySelector("main section ul")!).gridTemplateColumns.split(" ").length,
    }));
    expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
    expect(metrics.columns).toBe(viewport.width >= 768 ? 2 : 1);
    await expect(page.getByRole("heading", { level: 1, name: "Components" })).toBeVisible();
  });
}

test.describe("NAV-3 regression routes", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const [path, heading] of [
    ["/components/button", "Button"],
    ["/components/bar-chart", "Bar Chart"],
    ["/components/charts", "Charts"],
    ["/components/industries", "Industries"],
    ["/foundations", "Foundations"],
    ["/agent-kit", "Agent Kit"],
  ] as const) {
    test(`${path} remains reachable`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });
  }
});
