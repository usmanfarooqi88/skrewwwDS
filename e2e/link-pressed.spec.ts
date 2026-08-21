import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  test,
} from "./fixtures";

/**
 * Link Primary interaction after foundation brand/600 + /700 Figma sync.
 * Hover/Pressed inherit corrected primitives (no Link CSS change).
 */

const PRIMARY_DEFAULT = "#6c4cf2";
const PRIMARY_HOVER = "#5638d6";
const PRIMARY_PRESSED = "#4229ad";
const SUBTLE_DEFAULT = "#5b5f68";
const SUBTLE_INTERACT = "#17181b";
const DANGER_TEXT = "#cc3b37";
const DANGER_ICON = "#e5484d";
const DANGER_PRESSED = "#b3261e";

async function settle(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation:none!important}",
  });
}

test.describe("Link Primary/Subtle interaction (R2/R3 + brand sync)", () => {
  test("Primary/default Default/Hover/Active resolve live Figma brand ramp for label + icon", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await settle(page);
    const link = page.getByRole("link", { name: "External reference" });
    const label = link.locator("span").filter({ hasText: "External reference" });
    const icon = link.locator('[aria-hidden="true"]');

    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(PRIMARY_DEFAULT));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(PRIMARY_DEFAULT));

    await link.hover();
    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(PRIMARY_HOVER));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(PRIMARY_HOVER));

    await page.mouse.down();
    await expect
      .poll(async () => {
        const color = await resolvedRgba(label, "color");
        const expected = hexToRgba(PRIMARY_PRESSED);
        return (
          Math.abs(color.r - expected.r) <= 4 &&
          Math.abs(color.g - expected.g) <= 4 &&
          Math.abs(color.b - expected.b) <= 4
        );
      })
      .toBe(true);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(PRIMARY_PRESSED));
    await page.mouse.up();
  });

  test("Subtle Default stays text-secondary; Hover/Active resolve text-primary for label + icon", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await settle(page);
    const link = page.getByRole("link", { name: "Subtle documentation link" });
    const label = link.locator("span").filter({ hasText: "Subtle documentation link" });
    const icon = link.locator('[aria-hidden="true"]');

    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(SUBTLE_DEFAULT));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(SUBTLE_DEFAULT));

    await link.hover();
    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(SUBTLE_INTERACT));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(SUBTLE_INTERACT));

    await page.mouse.down();
    await expect
      .poll(async () => {
        const color = await resolvedRgba(label, "color");
        const expected = hexToRgba(SUBTLE_INTERACT);
        return (
          Math.abs(color.r - expected.r) <= 4 &&
          Math.abs(color.g - expected.g) <= 4 &&
          Math.abs(color.b - expected.b) <= 4
        );
      })
      .toBe(true);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(SUBTLE_INTERACT));
    await page.mouse.up();
  });

  test("Danger R1 remains Default/Hover/Active after brand/600–700 foundation sync", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await settle(page);
    const link = page.getByRole("link", { name: "Delete this resource" });
    const label = link.locator("span").filter({ hasText: "Delete this resource" });
    const icon = link.locator('[aria-hidden="true"]');

    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(DANGER_TEXT));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(DANGER_ICON));
    expect(
      await link.evaluate((el) => {
        const style = getComputedStyle(el);
        return (
          style.textDecorationLine.includes("underline") ||
          style.textDecoration.includes("underline")
        );
      }),
    ).toBe(true);
    await expect(link).not.toHaveAttribute("aria-disabled");

    await link.hover();
    expectColorClose(await resolvedRgba(label, "color"), hexToRgba(DANGER_TEXT));
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(DANGER_TEXT));

    await page.mouse.down();
    await expect
      .poll(async () => {
        const color = await resolvedRgba(label, "color");
        const expected = hexToRgba(DANGER_PRESSED);
        return (
          Math.abs(color.r - expected.r) <= 4 &&
          Math.abs(color.g - expected.g) <= 4 &&
          Math.abs(color.b - expected.b) <= 4
        );
      })
      .toBe(true);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(DANGER_PRESSED));
    await page.mouse.up();
  });
});
