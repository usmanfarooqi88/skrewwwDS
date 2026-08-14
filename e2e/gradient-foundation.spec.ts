import type { Locator, Page } from "@playwright/test";
import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  setSurfaceMode,
  test,
} from "./fixtures";

async function visual(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backdropFilter: style.backdropFilter,
      borderColor: style.borderColor,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      clipPath: style.clipPath,
      outlineColor: style.outlineColor,
    };
  });
}

function expectStableOverlay(image: string, layers = 1) {
  expect(image.match(/linear-gradient/g)).toHaveLength(layers);
  expect(image).toContain("linear-gradient(90deg");
  expect(image).toMatch(/#ffffff14|rgba\(255, 255, 255, 0\.08\)/);
  expect(image).toMatch(/#0000000a|rgba\(0, 0, 0, 0\.04\)/);
}

function buttonSurface(button: Locator) {
  return button.locator('[class*="visualSurface"]');
}

async function setButtonSurface(button: Locator, mode: "flat" | "gradient" | "glass") {
  await button.locator("xpath=ancestor::*[@data-skrewww-surface][1]").evaluate((node, value) => {
    node.setAttribute("data-skrewww-surface", value);
  }, mode);
}

async function expectGradientControl(page: Page, route: string, control: () => Locator) {
  await page.goto(route);
  await setSurfaceMode(page, "gradient");
  const locator = control();
  await expect(locator).toBeVisible();
  expectStableOverlay((await visual(locator)).backgroundImage);
  await locator.hover();
  expectStableOverlay((await visual(locator)).backgroundImage);
  await locator.focus();
  expectStableOverlay((await visual(locator)).backgroundImage);
}

test.describe("Stable-v1 Gradient foundation", () => {
  test("resolves the shared tokens only in Gradient mode", async ({ page }) => {
    await page.goto("/components/button");

    for (const mode of ["flat", "gradient", "glass"] as const) {
      await setSurfaceMode(page, mode);
      const values = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return {
          start: style.getPropertyValue("--component-surface-gradient-overlay-start").trim(),
          end: style.getPropertyValue("--component-surface-gradient-overlay-end").trim(),
          image: style.getPropertyValue("--component-surface-gradient-overlay").trim(),
        };
      });

      if (mode === "gradient") {
        expect(values.start).toBe("#ffffff14");
        expect(values.end).toBe("#0000000a");
        expectStableOverlay(values.image);
      } else {
        expect(values).toEqual({ start: "transparent", end: "transparent", image: "none" });
      }
    }
  });

  test("adds one overlay to Primary, Secondary, and Danger without replacing base fills", async ({
    page,
  }) => {
    await page.goto("/components/button");
    const variants = [
      { name: "Primary", base: "#6c4cf2" },
      { name: "Secondary", base: "#ffffff" },
      { name: "Danger", base: "#e5484d" },
    ];

    const primary = page.getByRole("button", { name: "Primary", exact: true });
    await setButtonSurface(primary, "flat");
    for (const variant of variants) {
      const surface = buttonSurface(page.getByRole("button", { name: variant.name, exact: true }));
      expect((await visual(surface)).backgroundImage).toBe("none");
      expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba(variant.base));
    }

    await setButtonSurface(primary, "gradient");
    for (const variant of variants) {
      const surface = buttonSurface(page.getByRole("button", { name: variant.name, exact: true }));
      expectStableOverlay((await visual(surface)).backgroundImage);
      expectColorClose(await resolvedRgba(surface, "backgroundColor"), hexToRgba(variant.base));
      expect((await visual(surface)).backdropFilter).toBe("none");
    }

    await setButtonSurface(primary, "glass");
    for (const variant of variants) {
      const surface = buttonSurface(page.getByRole("button", { name: variant.name, exact: true }));
      expect((await visual(surface)).backgroundImage).toBe("none");
      expect((await visual(surface)).backdropFilter).toBe("blur(16px)");
    }
  });

  test("covers the shared form-control family through hover and focus", async ({ page }) => {
    await expectGradientControl(page, "/components/text-input", () =>
      page.getByRole("textbox", { name: "Email address" }),
    );
    await expectGradientControl(page, "/components/search-field", () =>
      page.getByRole("searchbox", { name: "Search components" }),
    );
    await expectGradientControl(page, "/components/textarea", () =>
      page.getByRole("textbox", { name: "Description" }),
    );
    await expectGradientControl(page, "/components/select", () =>
      page.getByRole("combobox", { name: "Role", exact: true }),
    );
    await expectGradientControl(page, "/components/combobox", () =>
      page.getByRole("combobox", { name: "Country", exact: true }).first(),
    );
    await expectGradientControl(page, "/components/date-picker", () =>
      page.getByRole("textbox", { name: "Release date" }).first(),
    );
  });

  test("covers panels and container/content surfaces", async ({ page }) => {
    await page.goto("/components/card");
    await setSurfaceMode(page, "gradient");
    const card = page.getByRole("heading", { name: "Project overview" }).locator("xpath=../..");
    expectStableOverlay((await visual(card)).backgroundImage);

    await page.goto("/components/accordion");
    await setSurfaceMode(page, "gradient");
    const accordion = page.getByRole("button", { name: "What is Skrewww?" }).locator("xpath=../../..");
    expectStableOverlay((await visual(accordion)).backgroundImage);

    await page.goto("/components/empty-state");
    await setSurfaceMode(page, "gradient");
    const emptyState = page.getByRole("heading", { name: "Create your first project" }).locator("xpath=..");
    expectStableOverlay((await visual(emptyState)).backgroundImage);

    await page.goto("/components/dialog");
    await setSurfaceMode(page, "gradient");
    await page.getByRole("button", { name: "Open dialog" }).click();
    const dialog = page.getByRole("dialog", { name: "Beta documentation" });
    expectStableOverlay((await visual(dialog)).backgroundImage, 3);

    await page.goto("/components/drawer");
    await setSurfaceMode(page, "gradient");
    await page.getByRole("button", { name: "Open drawer", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Documentation settings" });
    expectStableOverlay((await visual(drawer)).backgroundImage);

    await page.goto("/components/menu");
    await setSurfaceMode(page, "gradient");
    await page.getByRole("button", { name: "More actions" }).click();
    const menuPanel = page.getByRole("menu").locator("xpath=../..");
    expectStableOverlay((await visual(menuPanel)).backgroundImage);

    await page.goto("/components/tag");
    await setSurfaceMode(page, "gradient");
    const tag = page.getByText("Documentation", { exact: true }).locator("xpath=..");
    expectStableOverlay((await visual(tag)).backgroundImage);

    await page.goto("/components/combobox");
    await setSurfaceMode(page, "gradient");
    await page.getByRole("combobox", { name: "Country", exact: true }).first().click();
    const comboboxPanel = page.getByRole("listbox", { name: "Country" }).locator("xpath=../..");
    expectStableOverlay((await visual(comboboxPanel)).backgroundImage);
  });

  test("preserves feedback hues and Toast Card surface", async ({ page }) => {
    await page.goto("/components/alert");
    await setSurfaceMode(page, "gradient");
    const info = page.getByText("Heads up", { exact: true }).locator("xpath=../..");
    expectStableOverlay((await visual(info)).backgroundImage);
    expectColorClose(await resolvedRgba(info, "backgroundColor"), hexToRgba("#dceefe"));

    await page.goto("/components/badge");
    await setSurfaceMode(page, "gradient");
    const success = page.getByText("Beta", { exact: true }).locator("xpath=..");
    expectStableOverlay((await visual(success)).backgroundImage);
    expectColorClose(await resolvedRgba(success, "backgroundColor"), hexToRgba("#1a8b4c", 0.1));

    await page.goto("/components/toast");
    await setSurfaceMode(page, "gradient");
    await page.getByRole("button", { name: "Show success toast" }).click();
    const toast = page.getByText("Your changes were saved successfully.").locator("xpath=../..");
    expectStableOverlay((await visual(toast)).backgroundImage);
    expectColorClose(await resolvedRgba(toast, "backgroundColor"), hexToRgba("#ffffff"));
  });

  test("includes persistent states and excludes transient hover states", async ({ page }) => {
    await page.goto("/components/calendar-day");
    await setSurfaceMode(page, "gradient");
    expectStableOverlay(
      (await visual(page.getByRole("button", { name: "14 July 2026" }))).backgroundImage,
    );

    await page.goto("/components/pagination");
    await setSurfaceMode(page, "gradient");
    const current = page.getByLabel("Page 3").first();
    expectStableOverlay((await visual(current)).backgroundImage);
    const pageHover = page.getByLabel("Page 2").first();
    await pageHover.hover();
    expect((await visual(pageHover)).backgroundImage).toBe("none");

    await page.goto("/components/tree-view");
    await setSurfaceMode(page, "gradient");
    const tree = page.getByRole("tree", { name: "Project files" });
    expectStableOverlay(
      (await visual(tree.getByRole("treeitem", { name: "index.tsx" }))).backgroundImage,
    );
    const treeHover = tree.getByRole("treeitem", { name: "README.md" });
    await treeHover.hover();
    expect((await visual(treeHover)).backgroundImage).toBe("none");

    await page.goto("/components/menu");
    await setSurfaceMode(page, "gradient");
    await page.getByRole("button", { name: "More actions" }).click();
    const menuHover = page.getByRole("menuitem", { name: "Share link" });
    await menuHover.hover();
    expect((await visual(menuHover)).backgroundImage).toBe("none");

    await page.goto("/components/list-item");
    await setSurfaceMode(page, "gradient");
    const listHover = page.getByRole("link", { name: "Button Primary actions and" });
    await listHover.hover();
    expect((await visual(listHover)).backgroundImage).toBe("none");

    await page.goto("/foundations");
    await setSurfaceMode(page, "gradient");
    const desktopSidebar = page.locator("aside");
    const activeSidebar = desktopSidebar.getByRole("link", { name: "Foundations", exact: true });
    expectStableOverlay((await visual(activeSidebar)).backgroundImage);
    const sidebarHover = desktopSidebar.getByRole("link", { name: "Button", exact: true });
    await sidebarHover.hover();
    expect((await visual(sidebarHover)).backgroundImage).toBe("none");
  });

  test("limits File Upload Gradient to Empty and Filled", async ({ page }) => {
    await page.goto("/components/file-upload");
    await setSurfaceMode(page, "gradient");

    const emptyInput = page.getByLabel("Profile photo");
    const empty = emptyInput.locator("xpath=..");
    expectStableOverlay((await visual(empty)).backgroundImage);

    await empty.evaluate((element) => {
      element.dispatchEvent(
        new DragEvent("dragenter", { bubbles: true, dataTransfer: new DataTransfer() }),
      );
    });
    await expect(empty).toHaveClass(/dropzoneDragging/);
    expect((await visual(empty)).backgroundImage).toBe("none");
    await empty.evaluate((element) => {
      element.dispatchEvent(
        new DragEvent("dragleave", { bubbles: true, dataTransfer: new DataTransfer() }),
      );
    });
    await expect(empty).not.toHaveClass(/dropzoneDragging/);

    const error = page.getByLabel("Upload with server error").locator("xpath=..");
    const disabled = page.getByLabel("Disabled upload").locator("xpath=..");
    expect((await visual(error)).backgroundImage).toBe("none");
    expect((await visual(disabled)).backgroundImage).toBe("none");

    await emptyInput.setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from("png"),
    });
    const filled = page.getByRole("list", { name: "Selected files" }).first();
    expectStableOverlay((await visual(filled)).backgroundImage);
  });

  test("keeps Table Flat and preserves Flat, Glass, focus, and Shape contracts", async ({ page }) => {
    await page.goto("/components/table");
    await setSurfaceMode(page, "gradient");
    const table = page.getByRole("table", { name: "Active projects" });
    const tableShell = table.locator("xpath=ancestor::*[@data-table-scroll][1]");
    const tableImage = (await visual(tableShell)).backgroundImage;
    expect(tableImage).not.toMatch(/#ffffff14|rgba\(255, 255, 255, 0\.08\)/);
    expect(tableImage).not.toMatch(/#0000000a|rgba\(0, 0, 0, 0\.04\)/);
    expectColorClose(await resolvedRgba(tableShell, "backgroundColor"), hexToRgba("#ffffff"));

    await page.goto("/components/text-input");
    const input = page.getByRole("textbox", { name: "Email address" });
    for (const mode of ["flat", "glass"] as const) {
      await setSurfaceMode(page, mode);
      expect((await visual(input)).backgroundImage).toBe("none");
    }

    await setSurfaceMode(page, "gradient");
    await input.focus();
    expect((await visual(input)).boxShadow).toContain("rgb(108, 76, 242)");

    const radii: string[] = [];
    const clips: string[] = [];
    for (const shape of ["sharp", "rounded", "pill", "squircle"]) {
      await page.locator("html").evaluate((node, value) => {
        node.setAttribute("data-skrewww-shape", value);
      }, shape);
      const styles = await visual(input);
      radii.push(styles.borderRadius);
      clips.push(styles.clipPath);
      expectStableOverlay(styles.backgroundImage);
    }
    expect(new Set(radii).size).toBeGreaterThan(1);
    expect(clips[3]).not.toBe("none");
  });
});
