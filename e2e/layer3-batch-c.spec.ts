import { expect, expectColorClose, hexToRgba, resolvedRgba, setSurfaceMode, test } from "./fixtures";

const modes = ["flat", "gradient", "glass"] as const;

async function visualStyles(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      backgroundImage: style.backgroundImage,
      borderRadius: style.borderRadius,
      borderStyle: style.borderStyle,
      borderWidth: style.borderWidth,
      boxShadow: style.boxShadow,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      zIndex: style.zIndex,
    };
  });
}

function expectBlur(mode: (typeof modes)[number], value: string) {
  expect(value).toBe(mode === "glass" ? "blur(16px)" : "none");
}

function expectStableGradient(image: string) {
  expect(image.match(/linear-gradient/g)).toHaveLength(1);
  expect(image).toContain("linear-gradient(90deg");
  expect(image).toMatch(/#ffffff14|rgba\(255, 255, 255, 0\.08\)/);
  expect(image).toMatch(/#0000000a|rgba\(0, 0, 0, 0\.04\)/);
}

test.describe("Layer 3 Batch C Surface parity", () => {
  for (const mode of modes) {
    test(`File Upload follows its state-specific Surface contracts in ${mode}`, async ({ page }) => {
      await page.goto("/components/file-upload");
      await setSurfaceMode(page, mode);

      const empty = page.locator('input[name="profile-photo"]').locator("..");
      const dragging = page.locator('input[name="attachments"]').locator("..");
      const error = page.locator('input[name="server-error-doc"]').locator("..");
      const disabled = page.locator('input[name="disabled-doc"]').locator("..");

      for (const dropzone of [empty, error, disabled]) {
        const styles = await visualStyles(dropzone);
        expectColorClose(
          await resolvedRgba(dropzone, "backgroundColor"),
          hexToRgba("#ffffff", mode === "glass" ? 0.12 : 1),
        );
        // Chromium quantizes the declared 1.5px Figma stroke to one device
        // pixel at the test harness's DPR 1; border style and color verify
        // the treatment without asserting an impossible fractional result.
        expect(styles.borderWidth).toBe("1px");
        expect(styles.borderStyle).toBe("dashed");
        expect(styles.boxShadow).toBe("none");
        expectBlur(mode, styles.backdropFilter);
      }

      expectColorClose(
        await resolvedRgba(empty, "borderColor"),
        hexToRgba(mode === "glass" ? "#ffffff" : "#dfe0e4", mode === "glass" ? 0.24 : 1),
      );
      expectColorClose(await resolvedRgba(error, "borderColor"), hexToRgba("#e5484d"));
      expect((await visualStyles(disabled)).opacity).toBe("0.4");
      const emptyStyles = await visualStyles(empty);
      const errorStyles = await visualStyles(error);
      const disabledStyles = await visualStyles(disabled);
      if (mode === "gradient") {
        expectStableGradient(emptyStyles.backgroundImage);
        expectStableGradient(errorStyles.backgroundImage);
      } else {
        expect(emptyStyles.backgroundImage).toBe("none");
        expect(errorStyles.backgroundImage).toBe("none");
      }
      expect(disabledStyles.backgroundImage).toBe("none");
      expect(errorStyles.pointerEvents).toBe("auto");
      expect(errorStyles.zIndex).toBe("auto");
      const muted = hexToRgba(mode === "glass" ? "#131316" : "#a0a3ac");
      expectColorClose(await resolvedRgba(empty.locator("p").first(), "color"), muted);
      expectColorClose(await resolvedRgba(empty.locator("p").nth(1), "color"), muted);
      expectColorClose(await resolvedRgba(empty.locator("svg"), "color"), muted);
      expectColorClose(
        await resolvedRgba(disabled.locator("p").first(), "color"),
        hexToRgba("#a0a3ac"),
      );
      expectColorClose(await resolvedRgba(error.locator("p").first(), "color"), hexToRgba("#e5484d"));
      expectColorClose(await resolvedRgba(error.locator("svg"), "color"), hexToRgba("#e5484d"));
      expectColorClose(
        await resolvedRgba(page.getByText("The server could not process these files."), "color"),
        hexToRgba("#d92d3e"),
      );

      await dragging.evaluate((element) => {
        element.dispatchEvent(
          new DragEvent("dragenter", { bubbles: true, dataTransfer: new DataTransfer() }),
        );
      });
      await expect(dragging).toHaveClass(/dropzoneDragging/);
      const draggingStyles = await visualStyles(dragging);
      expect(draggingStyles.backgroundImage).toBe("none");
      expectColorClose(
        await resolvedRgba(dragging, "backgroundColor"),
        hexToRgba(mode === "glass" ? "#ffffff" : "#f7f7f8", mode === "glass" ? 0.2 : 1),
      );
      expectColorClose(await resolvedRgba(dragging, "borderColor"), hexToRgba("#6c4cf2"));
      expectBlur(mode, draggingStyles.backdropFilter);
      expectColorClose(await resolvedRgba(dragging.locator("p").first(), "color"), hexToRgba("#131316"));
      expectColorClose(await resolvedRgba(dragging.locator("svg"), "color"), hexToRgba("#6c4cf2"));

      await page.locator('input[name="profile-photo"]').setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from("png"),
      });
      const filled = page.getByRole("list", { name: "Selected files" });
      const filledStyles = await visualStyles(filled);
      expectColorClose(
        await resolvedRgba(filled, "backgroundColor"),
        hexToRgba("#ffffff", mode === "glass" ? 0.12 : 1),
      );
      expectColorClose(
        await resolvedRgba(filled, "borderColor"),
        hexToRgba(mode === "glass" ? "#ffffff" : "#dfe0e4", mode === "glass" ? 0.24 : 1),
      );
      expect(filledStyles.borderWidth).toBe("1px");
      expect(filledStyles.borderStyle).toBe("solid");
      expect(filledStyles.boxShadow).toBe("none");
      expectBlur(mode, filledStyles.backdropFilter);
      if (mode === "gradient") {
        expectStableGradient(filledStyles.backgroundImage);
      } else {
        expect(filledStyles.backgroundImage).toBe("none");
      }
      expectColorClose(await resolvedRgba(filled.getByText("avatar.png"), "color"), hexToRgba("#131316"));
      expectColorClose(await resolvedRgba(filled.getByRole("button"), "color"), muted);

      if (mode === "gradient") {
        const expectedRadii = {
          sharp: "0px",
          rounded: "12px",
          pill: "16px",
          squircle: "16px",
        } as const;
        for (const [shape, expectedRadius] of Object.entries(expectedRadii)) {
          await page.locator("html").evaluate((element, value) => {
            element.setAttribute("data-skrewww-shape", value);
          }, shape);
          const shapedError = await visualStyles(error);
          expect(shapedError.borderRadius).toBe(expectedRadius);
          expectStableGradient(shapedError.backgroundImage);
          expect(shapedError.boxShadow).toBe("none");
        }

        await error.evaluate((element) => {
          element.dispatchEvent(
            new DragEvent("dragenter", { bubbles: true, dataTransfer: new DataTransfer() }),
          );
        });
        await expect(error).toHaveClass(/dropzoneDragging/);
        const draggingError = await visualStyles(error);
        expect(draggingError.backgroundImage).toBe("none");
        expectColorClose(await resolvedRgba(error, "backgroundColor"), hexToRgba("#f7f7f8"));
        expectColorClose(await resolvedRgba(error, "borderColor"), hexToRgba("#e5484d"));
        await error.evaluate((element) => {
          element.dispatchEvent(
            new DragEvent("dragleave", { bubbles: true, dataTransfer: new DataTransfer() }),
          );
        });
        await expect(error).not.toHaveClass(/dropzoneDragging/);
        expectStableGradient((await visualStyles(error)).backgroundImage);

        await page.getByLabel("Upload with server error").setInputFiles({
          name: "error.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("pdf"),
        });
        const errorList = error.locator("xpath=..").getByRole("list", {
          name: "Selected files",
        });
        expectStableGradient((await visualStyles(error)).backgroundImage);
        expectStableGradient((await visualStyles(errorList)).backgroundImage);
        expectColorClose(await resolvedRgba(errorList, "borderColor"), hexToRgba("#dfe0e4"));
        expectColorClose(
          await resolvedRgba(errorList.getByText("error.pdf"), "color"),
          hexToRgba("#131316"),
        );

        const errorStateClass = (await error.getAttribute("class"))
          ?.split(/\s+/)
          .find((className) => className.includes("dropzoneError"));
        expect(errorStateClass).toBeTruthy();
        await disabled.evaluate((element, className) => {
          element.classList.add(className);
        }, errorStateClass!);
        const disabledError = await visualStyles(disabled);
        expect(disabledError.backgroundImage).toBe("none");
        expect(disabledError.opacity).toBe("0.4");
        expectColorClose(
          await resolvedRgba(disabled, "backgroundColor"),
          hexToRgba("#ffffff"),
        );
        await expect(page.getByLabel("Disabled upload")).toBeDisabled();
      }
    });

    test(`List Item keeps Default transparent and applies Surface only on hover in ${mode}`, async ({ page }) => {
      await page.goto("/components/list-item");
      await setSurfaceMode(page, mode);

      const staticRow = page.getByText("Usman Farooqi", { exact: true }).locator("xpath=../..");
      const interactive = page.getByRole("link", { name: "Button Primary actions and" });

      for (const row of [staticRow, interactive]) {
        const styles = await visualStyles(row);
        expectColorClose(await resolvedRgba(row, "backgroundColor"), hexToRgba("#000000", 0));
        expect(styles.borderWidth).toBe("0px");
        expect(styles.boxShadow).toBe("none");
        expect(styles.backdropFilter).toBe("none");
      }

      await interactive.hover();
      const hoverStyles = await visualStyles(interactive);
      expectColorClose(
        await resolvedRgba(interactive, "backgroundColor"),
        hexToRgba(mode === "glass" ? "#ffffff" : "#f7f7f8", mode === "glass" ? 0.2 : 1),
      );
      expect(hoverStyles.borderWidth).toBe("0px");
      expect(hoverStyles.boxShadow).toBe("none");
      expectBlur(mode, hoverStyles.backdropFilter);

      expectColorClose(
        await resolvedRgba(page.getByText("Usman Farooqi", { exact: true }), "color"),
        hexToRgba("#131316"),
      );
      const description = page.getByText("Updated Button documentation", { exact: true });
      const metadata = page.getByText("2h ago", { exact: true });
      for (const content of [description, metadata]) {
        expectColorClose(
          await resolvedRgba(content, "color"),
          hexToRgba(mode === "glass" ? "#131316" : "#a0a3ac"),
        );
      }
      const folderRow = page.getByText("Design tokens", { exact: true }).locator("xpath=../..");
      expectColorClose(
        await resolvedRgba(folderRow.locator('[class*="leading"]'), "color"),
        hexToRgba(mode === "glass" ? "#131316" : "#a0a3ac"),
      );
    });

    test(`shared Menu Item hover stays isolated and matches the verified ${mode} token`, async ({ page }) => {
      await page.goto("/components/menu");
      await setSurfaceMode(page, mode);
      await page.getByRole("button", { name: "More actions" }).click();

      const hoverItem = page.getByRole("menuitem", { name: "Share link" });
      const disabledItem = page.getByRole("menuitem", { name: "Export (disabled)" });
      const before = await hoverItem.boundingBox();
      await hoverItem.hover();
      const after = await hoverItem.boundingBox();
      const hoverStyles = await visualStyles(hoverItem);

      expectColorClose(
        await resolvedRgba(hoverItem, "backgroundColor"),
        hexToRgba(mode === "glass" ? "#ffffff" : "#f7f7f8", mode === "glass" ? 0.2 : 1),
      );
      expect(hoverStyles.borderWidth).toBe("0px");
      expect(hoverStyles.boxShadow).toBe("none");
      expect(hoverStyles.backdropFilter).toBe("none");
      expect(after).toEqual(before);

      await disabledItem.hover();
      expectColorClose(
        await resolvedRgba(disabledItem, "backgroundColor"),
        hexToRgba("#000000", 0),
      );
      await expect(disabledItem).toHaveAttribute("aria-disabled", "true");

      await page.goto("/components/tree-view");
      await setSurfaceMode(page, mode);
      const tree = page.getByRole("tree", { name: "Project files" });
      const selectedTreeItem = tree.getByRole("treeitem", { name: "index.tsx" });
      const hoverTreeItem = tree.getByRole("treeitem", { name: "README.md" });
      const expectedSharedSurface = hexToRgba(
        mode === "glass" ? "#ffffff" : "#f7f7f8",
        mode === "glass" ? 0.2 : 1,
      );

      expectColorClose(
        await resolvedRgba(selectedTreeItem, "backgroundColor"),
        expectedSharedSurface,
      );
      const treeBefore = await hoverTreeItem.boundingBox();
      await hoverTreeItem.hover();
      expectColorClose(await resolvedRgba(hoverTreeItem, "backgroundColor"), expectedSharedSurface);
      const treeAfter = await hoverTreeItem.boundingBox();
      expect(treeAfter?.width).toBe(treeBefore?.width);
      expect(treeAfter?.height).toBe(treeBefore?.height);
      const treeStyles = await visualStyles(hoverTreeItem);
      expect(treeStyles.borderWidth).toBe("0px");
      expect(treeStyles.boxShadow).toBe("none");
    });
  }
});
