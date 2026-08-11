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
    const menu = page.getByRole("button", { name: "Open documentation menu" });
    await menu.click();
    const drawer = page.getByRole("dialog", { name: "Documentation navigation" });
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: "Date Picker" }).click();
    await expect(page).toHaveURL(/\/components\/date-picker$/);
    await expect(drawer).toHaveCount(0);
    await expect(menu).toBeFocused();
  });

  test("preserves drawer width, alignment, and the top-right close header", async ({ page }) => {
    await page.goto("/components/select");
    await page.getByRole("button", { name: "Open documentation menu" }).click();

    const drawer = page.getByRole("dialog", { name: "Documentation navigation" });
    const close = drawer.getByRole("button", { name: "Close drawer" });
    const navigation = drawer.getByRole("navigation", { name: "Documentation" });
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
        const body = element.querySelector('nav[aria-label="Documentation"]')?.parentElement;
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
    await page.getByRole("button", { name: "Open documentation menu" }).click();

    const drawer = page.getByRole("dialog", { name: "Documentation navigation" });
    const close = drawer.getByRole("button", { name: "Close drawer" });
    const navigation = drawer.getByRole("navigation", { name: "Documentation" });
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
    await expect(page.getByRole("button", { name: "Open documentation menu" })).toHaveCount(0);
  });
});
