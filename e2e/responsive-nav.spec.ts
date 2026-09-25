import { expect, type Locator, test } from "@playwright/test";

const viewports = [
  { name: "mobile-narrow", width: 320, height: 640 },
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test.describe(`Responsive docs layout (${viewport.name})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("component page has no horizontal overflow and visible H1", async ({ page }) => {
      await page.goto("/components/date-picker");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      expect(overflow).toBe(true);
      await expect(page.getByRole("heading", { level: 1, name: "Date Picker" })).toBeVisible();
    });
  });
}

test.describe("Mobile drawer navigation", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  async function waitForDrawerMotion(drawer: Locator) {
    await drawer.evaluate(async (element) => {
      await Promise.all(
        element
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
  }

  test("renders the enlarged mobile Skrewww logo", async ({ page }) => {
    await page.goto("/");
    const logo = page.getByRole("img", { name: "skrewww" });
    await expect(logo).toBeVisible();
    const box = await logo.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeCloseTo(24, 0);
  });

  test("opens labelled drawer, navigates, closes, and restores menu focus", async ({ page }) => {
    await page.goto("/components/select");
    const menu = page.getByRole("button", { name: "Open Components section navigation" });
    await menu.click();
    const drawer = page.getByRole("dialog", { name: "Components section navigation" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Date Picker" }).click();
    await expect(page).toHaveURL(/\/components\/date-picker$/);
    await expect(drawer).toHaveCount(0);
    await expect(menu).toBeFocused();
  });

  test("preserves drawer width, alignment, and the top-right close header", async ({ page }) => {
    await page.goto("/components/select");
    await page.getByRole("button", { name: "Open Components section navigation" }).click();

    const drawer = page.getByRole("dialog", { name: "Components section navigation" });
    const close = drawer.getByRole("button", { name: "Close drawer" });
    const navigation = drawer.getByRole("navigation", { name: "Components section" });
    const drawerBody = navigation.locator("..");
    const closeHeader = close.locator("..");
    await waitForDrawerMotion(drawer);
    const [drawerBox, closeBox, headerBox, bodyBox, navigationBox, metrics] = await Promise.all([
      drawer.boundingBox(),
      close.boundingBox(),
      closeHeader.boundingBox(),
      drawerBody.boundingBox(),
      navigation.boundingBox(),
      drawer.evaluate((element) => {
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        const drawerStyle = getComputedStyle(element);
        const body = element.querySelector('nav[aria-label="Components section"]')?.parentElement;
        const bodyStyle = body ? getComputedStyle(body) : null;
        return {
          expectedWidth: Math.min(24 * rootFontSize, window.innerWidth * 0.92),
          drawerOverflowY: drawerStyle.overflowY,
          bodyOverflowY: bodyStyle?.overflowY,
          bodyPaddingLeft: bodyStyle?.paddingLeft,
          bodyPaddingRight: bodyStyle?.paddingRight,
        };
      }),
    ]);

    expect(drawerBox).not.toBeNull();
    expect(closeBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(bodyBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect(drawerBox!.width).toBeCloseTo(metrics.expectedWidth, 0);
    expect(closeBox!.width).toBeGreaterThanOrEqual(44);
    expect(closeBox!.height).toBeGreaterThanOrEqual(44);
    expect(closeBox!.x - drawerBox!.x).toBeGreaterThan(drawerBox!.width / 2);
    expect(
      Math.abs(drawerBox!.x + drawerBox!.width - (closeBox!.x + closeBox!.width) - 20),
    ).toBeLessThanOrEqual(1);
    expect(Math.abs(closeBox!.y - drawerBox!.y - 20)).toBeLessThanOrEqual(1);
    expect(bodyBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height);
    const bodyPaddingLeft = Number.parseFloat(metrics.bodyPaddingLeft ?? "0");
    const bodyPaddingRight = Number.parseFloat(metrics.bodyPaddingRight ?? "0");
    expect(navigationBox!.x).toBeCloseTo(bodyBox!.x + bodyPaddingLeft, 0);
    expect(navigationBox!.width).toBeCloseTo(
      bodyBox!.width - bodyPaddingLeft - bodyPaddingRight,
      0,
    );
    expect(metrics.bodyOverflowY).toBe("auto");
    expect(metrics.drawerOverflowY).toBe("hidden");
  });

  test("keeps the close header fixed while only DrawerBody scrolls", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 480 });
    await page.goto("/components/select");
    await page.getByRole("button", { name: "Open Components section navigation" }).click();

    const drawer = page.getByRole("dialog", { name: "Components section navigation" });
    const close = drawer.getByRole("button", { name: "Close drawer" });
    const navigation = drawer.getByRole("navigation", { name: "Components section" });
    const drawerBody = navigation.locator("..");
    await waitForDrawerMotion(drawer);
    const before = await close.boundingBox();
    expect(before).not.toBeNull();

    const scrollResult = await drawerBody.evaluate((body) => {
      const panel = body.parentElement;
      const beforeBody = body.scrollTop;
      const beforePanel = panel?.scrollTop ?? 0;
      body.scrollTop = 240;
      return {
        beforeBody,
        afterBody: body.scrollTop,
        beforePanel,
        afterPanel: panel?.scrollTop ?? 0,
        bodyScrollHeight: body.scrollHeight,
        bodyClientHeight: body.clientHeight,
        bodyOverflowY: getComputedStyle(body).overflowY,
        panelOverflowY: panel ? getComputedStyle(panel).overflowY : null,
      };
    });

    const after = await close.boundingBox();
    expect(after).not.toBeNull();
    expect(scrollResult.bodyScrollHeight).toBeGreaterThan(scrollResult.bodyClientHeight);
    expect(scrollResult.afterBody).toBeGreaterThan(scrollResult.beforeBody);
    expect(scrollResult.bodyOverflowY).toBe("auto");
    expect(scrollResult.panelOverflowY).toBe("hidden");
    expect(scrollResult.beforePanel).toBe(0);
    expect(scrollResult.afterPanel).toBe(0);
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);
  });

  test("does not expose visible desktop sidebar landmark on mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("aside")).toBeHidden();
  });
});

test.describe("Desktop sidebar navigation", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows fixed sidebar and hides mobile menu trigger", async ({ page }) => {
    await page.goto("/components/button");
    await expect(page.locator("aside")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveCount(0);
  });
});

// Compact mobile header: one row holding the logo, the contextual section
// trigger and the global menu icon button (no separate section row).
const compactHeaderRoutes = [
  { path: "/", section: null },
  { path: "/docs", section: "Docs" },
  { path: "/foundations", section: "Docs" },
  { path: "/components", section: "Components" },
  { path: "/components/button", section: "Components" },
  { path: "/components/data-table", section: "Components" },
  { path: "/components/charts", section: "Charts" },
  { path: "/guard", section: null },
  { path: "/agent-kit", section: null },
  { path: "/changelog", section: null },
] as const;

for (const width of [320, 360, 375, 390, 430]) {
  test.describe(`Compact mobile header (${width}px)`, () => {
    test.use({ viewport: { width, height: 812 } });

    for (const route of compactHeaderRoutes) {
      test(`${route.path} has one header row with usable controls`, async ({ page }) => {
        await page.goto(route.path);
        const header = page.locator("header").first();
        const menu = page.getByRole("button", { name: "Open navigation menu" });
        const logo = page.getByRole("link", { name: "Skrewww home" });
        await expect(menu).toBeVisible();

        const headerBox = (await header.boundingBox())!;
        expect(headerBox.height).toBeLessThanOrEqual(64);

        const menuBox = (await menu.boundingBox())!;
        const logoBox = (await logo.boundingBox())!;
        expect(menuBox.width).toBeGreaterThanOrEqual(44);
        expect(menuBox.height).toBeGreaterThanOrEqual(44);
        expect(menuBox.y).toBeGreaterThanOrEqual(headerBox.y);
        expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(headerBox.y + headerBox.height + 1);
        expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(menuBox.x);

        if (route.section) {
          const sectionTrigger = page.getByRole("button", {
            name: `Open ${route.section} section navigation`,
          });
          await expect(sectionTrigger).toBeVisible();
          await expect(sectionTrigger).toContainText(route.section);
          const box = (await sectionTrigger.boundingBox())!;
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(box.y + box.height).toBeLessThanOrEqual(headerBox.y + headerBox.height + 1);
          // Sits between the logo and the menu button, on the same row.
          expect(box.x).toBeGreaterThanOrEqual(logoBox.x + logoBox.width);
          expect(box.x + box.width).toBeLessThanOrEqual(menuBox.x);
        } else {
          await expect(page.getByRole("button", { name: /section navigation/ })).toHaveCount(0);
        }

        // Page content (breadcrumb or H1, whichever is first) starts right under
        // the single header row — no second navigation row in between.
        const contentTop = await page.evaluate(() => {
          const tops = Array.from(
            document.querySelectorAll('main h1, main nav[aria-label="Breadcrumb"]'),
          ).map((element) => element.getBoundingClientRect().top);
          return Math.min(...tops);
        });
        // The homepage keeps its own hero layout (a badge precedes the H1), so it is exempt.
        if (route.path !== "/") {
          expect(contentTop - (headerBox.y + headerBox.height)).toBeLessThanOrEqual(64);
        }

        const widths = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
        }));
        expect(widths.document).toBeLessThanOrEqual(widths.viewport);
      });
    }

    test("both drawers open, close with Escape and restore focus", async ({ page }) => {
      await page.goto("/foundations");
      const sectionTrigger = page.getByRole("button", { name: "Open Docs section navigation" });
      await sectionTrigger.click();
      await expect(page.getByRole("dialog", { name: "Docs section navigation" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(sectionTrigger).toBeFocused();

      const menu = page.getByRole("button", { name: "Open navigation menu" });
      await menu.click();
      await expect(page.getByRole("dialog", { name: "Navigation" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(menu).toBeFocused();
    });
  });
}

test.describe("Compact mobile header keeps the top spacing tight", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("/foundations heading begins about 40px below the header", async ({ page }) => {
    await page.goto("/foundations");
    const header = (await page.locator("header").first().boundingBox())!;
    const h1 = (await page.getByRole("heading", { level: 1, name: "Foundations" }).boundingBox())!;
    const gap = h1.y - (header.y + header.height);
    expect(gap).toBeGreaterThanOrEqual(32);
    expect(gap).toBeLessThanOrEqual(48);
  });
});

test.describe("Desktop header is unaffected by the compact mobile header", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("shows the global nav row and no mobile triggers", async ({ page }) => {
    await page.goto("/components/button");
    await expect(page.getByRole("navigation", { name: "Global" })).toBeVisible();
    await expect(page.getByRole("button", { name: /section navigation/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Open navigation menu" })).toHaveCount(0);
    const header = (await page.locator("header").first().boundingBox())!;
    expect(header.height).toBeLessThanOrEqual(64);
    await expect(page.locator("aside")).toBeVisible();
  });
});
