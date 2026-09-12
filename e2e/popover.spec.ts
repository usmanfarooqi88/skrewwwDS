import type { Locator, Page } from "@playwright/test";
import {
  expect,
  expectColorClose,
  hexToRgba,
  rgbaStringToRgba,
  setSurfaceMode,
  test,
} from "./fixtures";

const modes = ["flat", "gradient", "glass"] as const;

function extractGradientByAngle(image: string, angle: string) {
  const start = image.search(new RegExp(`linear-gradient\\(\\s*${angle}deg`));
  if (start < 0) {
    throw new Error(`missing ${angle}deg gradient in ${image}`);
  }
  let depth = 0;
  for (let index = start; index < image.length; index += 1) {
    const char = image[index];
    if (char === "(") depth += 1;
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return image.slice(start, index + 1);
    }
  }
  throw new Error(`unbalanced ${angle}deg gradient in ${image}`);
}

function parseLinearGradient(image: string) {
  const angle = Number.parseFloat(/linear-gradient\(\s*([\d.]+)deg/.exec(image)?.[1] ?? "NaN");
  const stopPattern = /(rgba?\([^)]*\))\s+([\d.]+)%/g;
  const stops: Array<{ color: string; position: number }> = [];
  let match = stopPattern.exec(image);
  while (match !== null) {
    stops.push({ color: match[1], position: Number.parseFloat(match[2]) });
    match = stopPattern.exec(image);
  }
  return { angle, stops };
}

async function openDocsPopover(page: Page) {
  await page.goto("/components/popover");
  await page.getByRole("button", { name: "View details" }).click();
  const popover = page.getByRole("dialog", { name: "Documentation status" });
  await expect(popover).toBeVisible();
  return popover;
}

async function shellStyles(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundImage: style.backgroundImage,
      backdropFilter: style.backdropFilter,
      boxShadow: style.boxShadow,
      padding: style.padding,
      borderRadius: style.borderRadius,
      borderWidth: style.borderWidth,
    };
  });
}

test.describe("Popover Surface parity", () => {
  for (const mode of modes) {
    test(`${mode}: Card surface, highlight rim, no list-shell border`, async ({ page }) => {
      const popover = await openDocsPopover(page);
      await setSurfaceMode(page, mode);
      const styles = await shellStyles(popover);

      expect(styles.borderWidth).toBe("1px");
      expect(styles.boxShadow).toBe("none");
      expect(styles.padding).toBe("12px");
      expect(styles.borderRadius).toBe("12px");
      expect(styles.backdropFilter).toBe(mode === "glass" ? "blur(16px)" : "none");
      expect(styles.backgroundImage).toContain("162.47deg");
      expect(styles.backgroundImage).not.toContain("90deg");
      expect((styles.backgroundImage.match(/linear-gradient/g) ?? []).length).toBe(2);
      expect(styles.backgroundImage).toContain(mode === "glass" ? "0.12" : "rgb(255, 255, 255)");
    });
  }

  test("Glass rim keeps the 3-stop Card highlight contract", async ({ page }) => {
    const popover = await openDocsPopover(page);
    await setSurfaceMode(page, "glass");
    const image = await popover.evaluate((element) => getComputedStyle(element).backgroundImage);
    const rim = parseLinearGradient(extractGradientByAngle(image, "162.47"));

    expect(rim.angle).toBeCloseTo(162.47, 2);
    expect(rim.stops.map((stop) => stop.position)).toEqual([0, 50, 100]);
    expectColorClose(rgbaStringToRgba(rim.stops[0].color), hexToRgba("#FFFFFF", 0.8), "highlight-1");
    expectColorClose(rgbaStringToRgba(rim.stops[1].color), hexToRgba("#DFE0E4", 0.5), "highlight-2");
    expectColorClose(rgbaStringToRgba(rim.stops[2].color), hexToRgba("#DFE0E4", 0.15), "highlight-3");
  });

  test("arrow uses Card surface/border and does not double-blur", async ({ page }) => {
    const popover = await openDocsPopover(page);
    const arrow = popover.locator('[class*="arrow"]');
    await expect(arrow).toBeVisible();

    for (const mode of modes) {
      await setSurfaceMode(page, mode);
      const styles = await arrow.evaluate((element) => {
        const style = getComputedStyle(element);
        // Placement flips which sides keep width; assert a visible side only.
        const sides = [
          { width: style.borderTopWidth, color: style.borderTopColor },
          { width: style.borderRightWidth, color: style.borderRightColor },
          { width: style.borderBottomWidth, color: style.borderBottomColor },
          { width: style.borderLeftWidth, color: style.borderLeftColor },
        ];
        const visible = sides.find((side) => side.width !== "0px");
        return {
          backgroundColor: style.backgroundColor,
          borderColor: visible?.color ?? style.borderTopColor,
          backdropFilter: style.backdropFilter,
        };
      });

      expect(styles.backdropFilter, `${mode} arrow blur`).toBe("none");
      if (mode === "glass") {
        expect(styles.backgroundColor).toMatch(/0\.12/);
        expect(styles.borderColor).toMatch(/0\.24/);
      } else {
        expect(styles.backgroundColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
        expect(styles.borderColor).toMatch(/rgb\(223,\s*224,\s*228\)/);
      }
    }
  });
});

test.describe("Popover consumer isolation", () => {
  test("Select listbox keeps the prior simple-shell lock", async ({ page }) => {
    await page.goto("/components/select");
    await page.getByRole("combobox", { name: "Role", exact: true }).click();
    const listbox = page.getByRole("listbox", { name: "Role" });
    await expect(listbox).toBeVisible();
    const panel = listbox.locator("xpath=ancestor::*[contains(@class, '__popover')][1]");
    const styles = await shellStyles(panel);

    expect(styles.backgroundImage).not.toContain("162.47deg");
    expect(styles.backdropFilter).toBe("none");

    await setSurfaceMode(page, "glass");
    const glass = await shellStyles(panel);
    expect(glass.backgroundImage).not.toContain("162.47deg");
    expect(glass.backdropFilter).toBe("blur(12px)");
  });

  test("Date Picker calendar keeps the prior simple-shell lock", async ({ page }) => {
    await page.goto("/components/date-picker");
    await page.getByRole("button", { name: "Open calendar" }).first().click();
    const grid = page.getByRole("grid", { name: "Choose date" });
    await expect(grid).toBeVisible();
    const panel = grid.locator("xpath=ancestor::*[contains(@class, '__popover')][1]");
    const styles = await shellStyles(panel);

    expect(styles.backgroundImage).not.toContain("162.47deg");
    expect(styles.backdropFilter).toBe("none");

    await setSurfaceMode(page, "glass");
    const glass = await shellStyles(panel);
    expect(glass.backgroundImage).not.toContain("162.47deg");
    expect(glass.backdropFilter).toBe("blur(12px)");
  });
});
