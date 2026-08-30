import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

const modes = ["flat", "gradient", "glass"] as const;
const statuses = ["info", "success", "warning", "error"] as const;

const alertSurface = {
  info: { flat: "#dceefe", gradient: "#dceefe", glass: "#dceefe" },
  success: { flat: "#dff5e6", gradient: "#dff5e6", glass: "#dff5e6" },
  warning: { flat: "#fef3d6", gradient: "#fef3d6", glass: "#fef3d6" },
  error: { flat: "#fde2e1", gradient: "#fde2e1", glass: "#fde2e1" },
} as const;

const alertTitle = {
  info: "Heads up",
  success: "Saved",
  warning: "Review required",
  error: "Upload failed",
} as const;

const iconColor = {
  info: "#3b82f6",
  success: "#30a46c",
  warning: "#f5a524",
  error: "#e5484d",
} as const;

async function visualStyles(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
    };
  });
}

function expectBlur(mode: (typeof modes)[number], value: string) {
  expect(value).toBe(mode === "glass" ? "blur(16px)" : "none");
}

test.describe("Layer 3 Batch B Surface parity", () => {
  for (const mode of modes) {
    test(`Toast uses the shared Card contract in ${mode}`, async ({ page }) => {
      await page.goto("/components/toast");
      await setSurfaceMode(page, mode);
      await page.getByRole("button", { name: "Show success toast" }).click();
      await page.getByRole("button", { name: "Show info toast" }).click();
      await page.getByRole("button", { name: "Show persistent error toast" }).click();

      for (const title of ["Saved", "Sync started", "Connection lost"]) {
        const titleNode = page.getByText(title, { exact: true });
        const toast = titleNode.locator("xpath=../..");
        const styles = await visualStyles(toast);
        expectColorClose(
          await resolvedRgba(toast, "backgroundColor"),
          hexToRgba("#ffffff", mode === "glass" ? 0.12 : 1),
        );
        expectColorClose(
          await resolvedRgba(toast, "borderColor"),
          hexToRgba(mode === "glass" ? "#ffffff" : "#dfe0e4", mode === "glass" ? 0.24 : 1),
        );
        expect(styles.borderWidth).toBe("1px");
        expect(styles.boxShadow).toBe("none");
        expectBlur(mode, styles.backdropFilter);
        expectColorClose(await resolvedRgba(titleNode, "color"), hexToRgba("#17181B"));
        expectColorClose(
          await resolvedRgba(toast.getByRole("button"), "color"),
          hexToRgba(mode === "glass" ? "#17181B" : "#a0a3ac"),
        );
      }
    });

    test(`Alert keeps feedback-specific surfaces in ${mode}`, async ({ page }) => {
      await page.goto("/components/alert");
      await setSurfaceMode(page, mode);

      for (const status of statuses) {
        const title = page.getByText(alertTitle[status], { exact: true });
        const alert = title.locator("xpath=../..");
        const description = alert.locator("p").nth(1);
        const icon = alert.locator("svg").first();
        const styles = await visualStyles(alert);

        expectColorClose(
          await resolvedRgba(alert, "backgroundColor"),
          hexToRgba(alertSurface[status][mode], mode === "glass" ? 0.45 : 1),
        );
        expect(styles.borderWidth).toBe("0px");
        expect(styles.boxShadow).toBe("none");
        expectBlur(mode, styles.backdropFilter);
        expectColorClose(await resolvedRgba(title, "color"), hexToRgba("#17181B"));
        expectColorClose(
          await resolvedRgba(description, "color"),
          hexToRgba("#5B5F68"),
        );
        expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(iconColor[status]));
      }

      const dismissibleTitle = page.getByText("Beta component", { exact: true });
      const dismissibleAlert = dismissibleTitle.locator("xpath=../..");
      expectColorClose(
        await resolvedRgba(dismissibleAlert.getByRole("button", { name: "Dismiss alert" }), "color"),
        hexToRgba(mode === "glass" ? "#17181B" : "#a0a3ac"),
      );
    });
  }
});
