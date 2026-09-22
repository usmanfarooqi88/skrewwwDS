import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  setSurfaceMode,
  test,
} from "./fixtures";

const modes = ["flat", "gradient", "glass"] as const;

function expectStableGradient(image: string) {
  expect(image).toContain("linear-gradient(90deg");
  expect(image).toMatch(/#ffffff14|rgba\(255, 255, 255, 0\.08\)/);
  expect(image).toMatch(/#0000000a|rgba\(0, 0, 0, 0\.04\)/);
}

async function visual(locator: import("@playwright/test").Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      backgroundImage: style.backgroundImage,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow,
      outlineColor: style.outlineColor,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      pointerEvents: style.pointerEvents,
    };
  });
}

test.describe("Sidebar Nav Surface parity", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/foundations");
  });

  test("uses the role-appropriate menu highlight contract across Surface modes", async ({
    page,
  }) => {
    const sidebar = page.locator("aside");
    const active = sidebar.getByRole("link", { name: "Foundations", exact: true });
    const hover = sidebar.getByRole("link", { name: "Overview", exact: true });

    await expect(active).toHaveAttribute("aria-current", "page");
    await expect(hover).not.toHaveAttribute("aria-current", "page");

    for (const mode of modes) {
      await setSurfaceMode(page, mode);
      await hover.hover();

      const expectedSurface =
        mode === "glass" ? hexToRgba("#ffffff", 0.2) : hexToRgba("#f7f7f8");
      expectColorClose(
        await resolvedRgba(active, "backgroundColor"),
        expectedSurface,
        `${mode} active surface`,
      );
      expectColorClose(
        await resolvedRgba(hover, "backgroundColor"),
        expectedSurface,
        `${mode} hover surface`,
      );

      const activeVisual = await visual(active);
      const hoverVisual = await visual(hover);
      if (mode === "gradient") {
        expectStableGradient(activeVisual.backgroundImage);
      } else {
        expect(activeVisual.backgroundImage).toBe("none");
      }
      expect(hoverVisual.backgroundImage).toBe("none");
      expect(activeVisual.backdropFilter).toBe("none");
      expect(hoverVisual.backdropFilter).toBe("none");
      expect(activeVisual.boxShadow).toBe("none");
      expect(hoverVisual.boxShadow).toBe("none");
      expect(activeVisual.pointerEvents).toBe("auto");
      expect(hoverVisual.pointerEvents).toBe("auto");
    }
  });

  test("preserves focus and follows the shared navigation Shape contract", async ({
    page,
  }) => {
    const active = page
      .locator("aside")
      .getByRole("link", { name: "Foundations", exact: true });

    await setSurfaceMode(page, "gradient");
    await active.focus();
    const focused = await visual(active);
    expect(focused.outlineColor).toBe("rgb(108, 76, 242)");
    expect(focused.outlineStyle).toBe("solid");
    expect(focused.outlineWidth).toBe("2px");

    const expectedRadii = {
      sharp: "0px",
      rounded: "6px",
      pill: "9999px",
      squircle: "8px",
    } as const;
    for (const [shape, expectedRadius] of Object.entries(expectedRadii)) {
      await page.locator("html").evaluate((element, value) => {
        element.setAttribute("data-skrewww-shape", value);
      }, shape);
      expect((await visual(active)).borderRadius).toBe(expectedRadius);
    }
  });

  test("keeps the composed Dropdown Trigger on the Secondary Button Glass contract", async ({
    page,
  }) => {
    await page.goto("/components/menu");
    await setSurfaceMode(page, "glass");

    const trigger = page.getByRole("button", { name: "Project actions", exact: true });
    const surface = trigger.locator('[aria-hidden="true"]').first();
    expectColorClose(
      await resolvedRgba(surface, "backgroundColor"),
      hexToRgba("#ffffff", 0.12),
      "composed Dropdown Trigger Glass surface",
    );
    expect(await surface.evaluate((element) => getComputedStyle(element).backdropFilter)).toBe(
      "blur(16px)",
    );

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("menu", { name: "Project actions" })).toBeVisible();
  });
});
