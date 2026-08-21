import {
  expect,
  expectColorClose,
  hexToRgba,
  resolvedRgba,
  test,
} from "./fixtures";

/**
 * Link R2: Primary/default + Subtle pressed (:active) parity.
 * Danger R1 remains covered in semantic-text-danger / semantic-action-danger specs.
 *
 * Note: React --primitive-color-brand-700 resolves #42299C (tokens.css),
 * while live Figma brand/700 is #4229AD. R2 uses the React token without
 * changing token definitions.
 */

const PRIMARY_PRESSED = "#42299c";
const SUBTLE_PRESSED = "#17181b";
const DANGER_TEXT = "#cc3b37";
const DANGER_ICON = "#e5484d";
const DANGER_PRESSED = "#b3261e";

async function settle(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation:none!important}",
  });
}

test.describe("Link Primary/Subtle pressed parity (R2)", () => {
  test("Primary/default :active resolves brand-700 for label + icon while hovered", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await settle(page);
    const link = page.getByRole("link", { name: "External reference" });
    const label = link.locator("span").filter({ hasText: "External reference" });
    const icon = link.locator('[aria-hidden="true"]');

    await link.hover();
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

  test("Subtle :active resolves semantic-text-primary for label + icon while hovered", async ({
    page,
  }) => {
    await page.goto("/components/link");
    await settle(page);
    const link = page.getByRole("link", { name: "Subtle documentation link" });
    const label = link.locator("span").filter({ hasText: "Subtle documentation link" });
    const icon = link.locator('[aria-hidden="true"]');

    await link.hover();
    await page.mouse.down();
    await expect
      .poll(async () => {
        const color = await resolvedRgba(label, "color");
        const expected = hexToRgba(SUBTLE_PRESSED);
        return (
          Math.abs(color.r - expected.r) <= 4 &&
          Math.abs(color.g - expected.g) <= 4 &&
          Math.abs(color.b - expected.b) <= 4
        );
      })
      .toBe(true);
    expectColorClose(await resolvedRgba(icon, "color"), hexToRgba(SUBTLE_PRESSED));
    await page.mouse.up();
  });

  test("Danger R1 remains Default/Hover/Active after Primary/Subtle pressed shipping", async ({
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
