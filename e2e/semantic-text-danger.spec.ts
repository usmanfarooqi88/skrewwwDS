import {
  expect,
  expectColorClose,
  hexToRgba,
  holdPointerPressed,
  resolvedRgba,
  rgbaStringToRgba,
  test,
} from "./fixtures";
import type { Locator } from "@playwright/test";

const DANGER_TEXT = "#cc3b37";
const ACTION_DANGER = "#e5484d";
const DANGER_PRESSED = "#b3261e";
const DROPZONE_ERROR = "#e5484d";
const AA_NORMAL_TEXT = 4.5;

function contrastRatio(
  fg: { r: number; g: number; b: number },
  bg: { r: number; g: number; b: number },
) {
  const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const ch = (v: number) => {
      const n = v / 255;
      return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
  };
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function effectiveBackground(locator: Locator) {
  const rgba = await locator.evaluate((el) => {
    let node: Element | null = el;
    let bg = "rgba(0, 0, 0, 0)";
    while (node && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
      bg = getComputedStyle(node).backgroundColor;
      node = node.parentElement;
    }
    return bg;
  });
  return rgbaStringToRgba(rgba);
}

async function expectDangerTextContrast(locator: Locator) {
  const color = await resolvedRgba(locator, "color");
  const background = await effectiveBackground(locator);
  expectColorClose(color, hexToRgba(DANGER_TEXT));
  expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
}

test.describe("semantic/text/danger consumers", () => {
  test("FormField required indicator resolves semantic-text-danger", async ({ page }) => {
    await page.goto("/components/form-field");
    const indicator = page
      .locator("label")
      .filter({ hasText: "Workspace name" })
      .locator('[aria-hidden="true"]');
    await expect(indicator).toHaveText("*");
    await expectDangerTextContrast(indicator);
  });

  test("RadioGroup required indicator resolves semantic-text-danger", async ({ page }) => {
    await page.goto("/components/radio-group");
    const indicator = page
      .locator("legend")
      .filter({ hasText: "Notification channel" })
      .locator('[aria-hidden="true"]');
    await expect(indicator).toHaveText("*");
    await expectDangerTextContrast(indicator);
    await expect(page.getByText("(required)")).toHaveCount(1);
  });

  test("File Upload rejection copy uses danger text while dropzone error chrome stays unchanged", async ({
    page,
  }) => {
    await page.goto("/components/file-upload");
    await page.locator('input[type="file"][name="profile-photo"]').setInputFiles({
      name: "bad.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("bad"),
    });

    const rejection = page.getByRole("list", { name: "Rejected files" });
    await expect(rejection).toContainText(/not an accepted file type/i);
    await expectDangerTextContrast(rejection);

    const serverErrorDropzone = page.locator('input[name="server-error-doc"]').locator("..");
    expectColorClose(await resolvedRgba(serverErrorDropzone, "borderColor"), hexToRgba(DROPZONE_ERROR));
    expectColorClose(
      await resolvedRgba(serverErrorDropzone.locator("p").first(), "color"),
      hexToRgba(DROPZONE_ERROR),
    );
    expectColorClose(
      await resolvedRgba(serverErrorDropzone.locator("svg"), "color"),
      hexToRgba(DROPZONE_ERROR),
    );
  });

  test("Link Danger Default/Hover/Active match Figma-locked text + icon roles", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await page.addStyleTag({
      content:
        "*,*::before,*::after{transition:none!important;animation:none!important}html,body{scroll-behavior:auto!important}",
    });
    const link = page.getByRole("link", { name: "Delete this resource" });
    const label = link.locator("span").filter({ hasText: "Delete this resource" });
    const icon = link.locator('[aria-hidden="true"]');

    await expectDangerTextContrast(label);
    // Default: icon semantic-icon-danger → #E5484D; label text-danger → #CC3B37
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ACTION_DANGER));
    await expect(link).not.toHaveAttribute("aria-disabled");
    expect((await link.evaluate((el) => getComputedStyle(el).opacity))).toBe("1");
    expect(
      await link.evaluate((el) => getComputedStyle(el).textDecorationLine.includes("underline")),
    ).toBe(true);

    await link.focus();
    await expect(link).toBeFocused();
    await expectDangerTextContrast(label);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(ACTION_DANGER));

    await link.hover();
    await expect
      .poll(async () => {
        const color = await resolvedRgba(label, "color");
        const expected = hexToRgba(DANGER_TEXT);
        return (
          Math.abs(color.r - expected.r) <= 4 &&
          Math.abs(color.g - expected.g) <= 4 &&
          Math.abs(color.b - expected.b) <= 4
        );
      })
      .toBe(true);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(DANGER_TEXT));

    // :active while hovered — pressed danger/700 for label + icon
    const press = await holdPointerPressed(page, link);
    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(DANGER_PRESSED));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(DANGER_PRESSED));
    await press.release();
  });
});
