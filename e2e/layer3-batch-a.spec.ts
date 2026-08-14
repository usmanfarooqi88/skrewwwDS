import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

const modes = ["flat", "gradient", "glass"] as const;

const expected = {
  surface: {
    flat: hexToRgba("#ffffff"),
    gradient: hexToRgba("#ffffff"),
    glass: hexToRgba("#ffffff", 0.12),
  },
  border: {
    flat: hexToRgba("#dfe0e4"),
    gradient: hexToRgba("#dfe0e4"),
    glass: hexToRgba("#ffffff", 0.24),
  },
  // These components intentionally consume React's semantic-primary token.
  // The former repository-wide #131316 vs live-Figma #17181B drift was closed
  // at the Foundation layer (color/neutral/900), so this value is inherited,
  // never a component-only duplicate token.
  primary: hexToRgba("#17181B"),
  muted: {
    flat: hexToRgba("#a0a3ac"),
    gradient: hexToRgba("#a0a3ac"),
    glass: hexToRgba("#17181B"),
  },
};

async function visualStyles(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      borderStyle: style.borderStyle,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
      backgroundImage: style.backgroundImage,
    };
  });
}

function expectBlur(mode: (typeof modes)[number], value: string) {
  expect(value).toBe(mode === "glass" ? "blur(16px)" : "none");
}

test.describe("Layer 3 Batch A Surface parity", () => {
  for (const mode of modes) {
    test(`Dialog matches the ${mode} master contract`, async ({ page }) => {
      await page.goto("/components/dialog");
      await setSurfaceMode(page, mode);
      await page.getByRole("button", { name: "Open dialog" }).click();

      const dialog = page.getByRole("dialog", { name: "Beta documentation" });
      const title = page.getByRole("heading", { name: "Beta documentation" });
      const body = page.getByText("Dialog interrupts workflow for focused attention or a required decision.");
      const close = page.getByRole("button", { name: "Close dialog" });
      const styles = await visualStyles(dialog);

      expect(styles.borderWidth).toBe("1px");
      expect(styles.borderStyle).toBe("solid");
      expect(styles.boxShadow).toBe("none");
      expectBlur(mode, styles.backdropFilter);
      expect(styles.backgroundImage).toContain("linear-gradient");
      expect(styles.backgroundImage).toContain(mode === "glass" ? "0.12" : "rgb(255, 255, 255)");
      expectColorClose(await resolvedRgba(title, "color"), expected.primary);
      expectColorClose(await resolvedRgba(body, "color"), expected.muted[mode]);
      expectColorClose(await resolvedRgba(close, "color"), expected.muted[mode]);
    });

    test(`Drawer matches the ${mode} master contract`, async ({ page }) => {
      await page.goto("/components/drawer");
      await setSurfaceMode(page, mode);
      await page.getByRole("button", { name: "Open drawer", exact: true }).click();

      const drawer = page.getByRole("dialog", { name: "Documentation settings" });
      const title = page.getByRole("heading", { name: "Documentation settings" });
      const body = page.getByText("Drawer slides from the viewport edge for supplementary settings or forms.");
      const close = page.getByRole("button", { name: "Close drawer" });
      const styles = await visualStyles(drawer);

      expectColorClose(await resolvedRgba(drawer, "backgroundColor"), expected.surface[mode]);
      expect(styles.borderWidth).toBe("0px");
      expect(styles.boxShadow).toBe("none");
      expectBlur(mode, styles.backdropFilter);
      expectColorClose(await resolvedRgba(title, "color"), expected.primary);
      expectColorClose(await resolvedRgba(body, "color"), expected.muted[mode]);
      expectColorClose(await resolvedRgba(close, "color"), expected.muted[mode]);
    });

    test(`Accordion matches the ${mode} masters`, async ({ page }) => {
      await page.goto("/components/accordion");
      await setSurfaceMode(page, mode);

      const trigger = page.getByRole("button", { name: "What is Skrewww?" });
      const root = trigger.locator("xpath=../../..");
      const panel = page.getByRole("region", { name: "What is Skrewww?" });
      const icon = trigger.locator("svg");
      const styles = await visualStyles(root);

      expectColorClose(await resolvedRgba(root, "backgroundColor"), expected.surface[mode]);
      expectColorClose(await resolvedRgba(root, "borderColor"), expected.border[mode]);
      expect(styles.borderWidth).toBe("1px");
      expect(styles.boxShadow).toBe("none");
      expectBlur(mode, styles.backdropFilter);
      expectColorClose(await resolvedRgba(trigger, "color"), expected.primary);
      expectColorClose(await resolvedRgba(panel, "color"), expected.muted[mode]);
      expectColorClose(await resolvedRgba(icon, "color"), expected.muted[mode]);
    });

    test(`Empty State matches the ${mode} master contract`, async ({ page }) => {
      await page.goto("/components/empty-state");
      await setSurfaceMode(page, mode);

      const title = page.getByRole("heading", { name: "Create your first project" });
      const root = title.locator("xpath=..");
      const description = page.getByText("Projects organize components, tokens, and documentation previews.");
      const icon = root.locator("svg");
      const styles = await visualStyles(root);

      expectColorClose(await resolvedRgba(root, "backgroundColor"), expected.surface[mode]);
      expect(styles.borderWidth).toBe("0px");
      expect(styles.boxShadow).toBe("none");
      expectBlur(mode, styles.backdropFilter);
      expectColorClose(await resolvedRgba(title, "color"), expected.primary);
      expectColorClose(await resolvedRgba(description, "color"), expected.muted[mode]);
      expectColorClose(await resolvedRgba(icon, "color"), expected.muted[mode]);
    });
  }
});
