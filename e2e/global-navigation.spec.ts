import { expect, test } from "./fixtures";

const activeCases = [
  ["/docs", "Docs"],
  ["/foundations", "Docs"],
  ["/components", "Components"],
  ["/components/button", "Components"],
  ["/components/category/forms", "Components"],
  ["/components/industries", "Components"],
  ["/components/industries/banking", "Components"],
  ["/components/charts", "Charts"],
  ["/components/bar-chart", "Charts"],
  ["/components/line-chart", "Charts"],
  ["/components/area-chart", "Charts"],
  ["/components/chart-card", "Charts"],
  ["/components/chart-metric", "Charts"],
  ["/agent-kit", "Agent Kit"],
] as const;

test.describe("global navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("desktop destinations, active states, and Resources menu are canonical", async ({ page }) => {
    for (const [path, activeLabel] of activeCases) {
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: "Global" });
      await expect(nav.getByRole("link", { name: activeLabel, exact: true })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    }

    await page.goto("/guard");
    const nav = page.getByRole("navigation", { name: "Global" });
    await expect(nav.getByRole("button", { name: "Resources" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await nav.getByRole("button", { name: "Resources" }).press("ArrowDown");
    const menu = page.getByRole("menu", { name: "Resources" });
    await expect(menu.getByRole("menuitem")).toHaveText([
      "Guard",
      "Changelog",
      "GitHub",
      "Figma Free",
      "Figma Pro",
    ]);
    await expect(menu.getByRole("menuitem", { name: "Guard" })).toBeFocused();
    await expect(menu.getByRole("menuitem", { name: "GitHub" })).toHaveAttribute("target", "_blank");
    await page.keyboard.press("Escape");
    await expect(nav.getByRole("button", { name: "Resources" })).toBeFocused();
  });

  test("desktop social shortcuts are canonical, external, and placed after Resources", async ({ page }) => {
    await page.goto("/components");
    const nav = page.getByRole("navigation", { name: "Global" });
    const resources = nav.getByRole("button", { name: "Resources" });
    const socialGroup = nav.getByRole("group", { name: "Social links" });
    const expected = {
      GitHub: "https://github.com/usmanfarooqi88/skrewwwDS",
      Instagram: "https://www.instagram.com/skrewww/",
      LinkedIn: "https://www.linkedin.com/company/skrewww-ds/",
    };

    for (const [label, href] of Object.entries(expected)) {
      const link = socialGroup.getByRole("link", { name: label });
      await expect(link).toHaveAttribute("href", href);
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", /noopener.*noreferrer/);
    }

    const [resourcesBox, socialBox, navBox] = await Promise.all([
      resources.boundingBox(),
      socialGroup.boundingBox(),
      nav.boundingBox(),
    ]);
    expect(resourcesBox).not.toBeNull();
    expect(socialBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(socialBox!.x).toBeGreaterThan(resourcesBox!.x + resourcesBox!.width);
    expect(socialBox!.x + socialBox!.width).toBeCloseTo(navBox!.x + navBox!.width, 0);
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  });

  test("Docs and Charts hubs expose only real destinations and logical breadcrumbs", async ({ page }) => {
    await page.goto("/docs");
    await expect(page.getByRole("heading", { level: 1, name: "Docs" })).toBeVisible();
    for (const label of ["Foundations", "Components", "Charts", "Agent Kit", "Guard", "Changelog"]) {
      await expect(page.getByRole("main").getByRole("link", { name: new RegExp(`^${label}`) })).toBeVisible();
    }

    await page.goto("/components/charts");
    await expect(page.getByRole("heading", { level: 1, name: "Charts" })).toBeVisible();
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb).toContainText("Components");
    await expect(breadcrumb).toContainText("Charts");
    for (const label of ["Bar Chart", "Line Chart", "Area Chart", "Chart Card", "Chart Metric"]) {
      await expect(page.getByRole("main").getByRole("link", { name: new RegExp(`^${label}`) })).toBeVisible();
    }
    await expect(page.getByRole("main")).not.toContainText(/Scatter|Pie|Donut|Gauge|Heatmap|Waterfall|Funnel|Treemap/);
  });

  test("Reference App remains isolated from docs chrome and noindexed", async ({ page }) => {
    await page.goto("/reference");
    await expect(page.getByRole("navigation", { name: "Global" })).toHaveCount(0);
    await expect(page.getByRole("complementary", { name: "Reference app sidebar" })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex.*nofollow|nofollow.*noindex/);
  });
});

test.describe("mobile global navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("keeps global navigation separate from contextual section navigation", async ({ page }) => {
    await page.goto("/components/button");
    const trigger = page.getByRole("button", { name: "Open navigation menu" });
    await trigger.click();
    const drawer = page.getByRole("dialog", { name: "Navigation" });
    const global = drawer.getByRole("navigation", { name: "Global" });
    for (const label of ["Docs", "Components", "Charts", "Agent Kit", "Guard", "Changelog", "GitHub", "Figma Free", "Figma Pro"]) {
      await expect(global.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(drawer.getByRole("link", { name: "Button", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(trigger).toBeFocused();

    const sectionTrigger = page.getByRole("button", { name: "Open Components section navigation" });
    await sectionTrigger.click();
    const sectionDrawer = page.getByRole("dialog", { name: "Components section navigation" });
    await expect(sectionDrawer.getByRole("navigation", { name: "Components section" }).getByRole("link", { name: "Button", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sectionTrigger).toBeFocused();

    const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  });
});

test.describe("global navigation responsive boundaries", () => {
  for (const viewport of [
    { name: "narrow desktop", width: 900, height: 800 },
    { name: "desktop", width: 1280, height: 800 },
    { name: "wide desktop", width: 1440, height: 900 },
  ]) {
    test(`${viewport.name} keeps chrome aligned and exposes the skip link`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/components/charts");
      const metrics = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        headerBottom: document.querySelector("header")?.getBoundingClientRect().bottom,
        sidebarTop: document.querySelector("aside")?.getBoundingClientRect().top,
      }));
      expect(metrics.document).toBeLessThanOrEqual(metrics.viewport + 1);
      expect(Math.abs((metrics.sidebarTop ?? 0) - (metrics.headerBottom ?? 0))).toBeLessThanOrEqual(1);

      await page.keyboard.press("Tab");
      const skipLink = page.getByRole("link", { name: "Skip to content" });
      await expect(skipLink).toBeFocused();
      await skipLink.press("Enter");
      await expect(page.getByRole("main")).toBeFocused();

      const socialGroup = page.getByRole("group", { name: "Social links" });
      if (viewport.width >= 1024) {
        await expect(socialGroup).toBeVisible();
      } else {
        await expect(socialGroup).toBeHidden();
      }
    });
  }
});

test.describe("contextual section navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("renders the one correct sidebar, exact active item, or no sidebar", async ({ page }) => {
    const cases = [
      ["/docs", "Docs", "Overview"],
      ["/foundations", "Docs", "Foundations"],
      ["/components", "Components", "Overview"],
      ["/components/button", "Components", "Button"],
      ["/components/category/forms", "Components", "Forms overview"],
      ["/components/industries", "Components", "Industries overview"],
      ["/components/industries/banking", "Components", "Banking"],
      ["/components/charts", "Charts", "Overview"],
      ["/components/bar-chart", "Charts", "Bar Chart"],
      ["/components/line-chart", "Charts", "Line Chart"],
      ["/components/area-chart", "Charts", "Area Chart"],
      ["/components/chart-card", "Charts", "Chart Card"],
      ["/components/chart-metric", "Charts", "Chart Metric"],
    ] as const;

    for (const [path, section, active] of cases) {
      await page.goto(path);
      const nav = page.getByRole("navigation", { name: `${section} section` });
      await expect(nav).toBeVisible();
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(nav.getByRole("link", { name: active, exact: true })).toHaveAttribute("aria-current", "page");
    }

    for (const path of ["/", "/agent-kit", "/guard", "/changelog"]) {
      await page.goto(path);
      await expect(page.locator("aside")).toHaveCount(0);
      expect(await page.getByRole("main").evaluate((main) => main.getBoundingClientRect().left)).toBe(0);
    }
  });
});
