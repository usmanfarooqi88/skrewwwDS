import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

async function bringTableControlIntoView(control: Locator) {
  await control.evaluate((el) => {
    const scrollParent = el.closest("[data-table-scroll]") as HTMLElement | null;
    if (scrollParent) {
      const buttonRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      if (buttonRect.right > parentRect.right) {
        scrollParent.scrollLeft += buttonRect.right - parentRect.right + 12;
      }
      if (buttonRect.left < parentRect.left) {
        scrollParent.scrollLeft -= parentRect.left - buttonRect.left + 12;
      }
    }
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

async function openMenuFromControl(page: Page, control: Locator, menuName: string) {
  await bringTableControlIntoView(control);
  await control.focus();
  await expect(control).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu", { name: menuName })).toBeVisible();
}

test.describe("Table browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/table");
  });

  test("exposes a native table with caption and headers", async ({ page }) => {
    const table = page.getByRole("table", { name: "Active projects" });
    await expect(table).toBeVisible();
    await expect(table).toHaveJSProperty("tagName", "TABLE");
    await expect(page.getByRole("columnheader", { name: "Project" }).first()).toBeVisible();
    await expect(page.getByRole("rowheader", { name: "Atlas" }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" }).first()).toBeAttached();
    await expect(page.getByRole("grid")).toHaveCount(0);
  });

  test("keeps project links and action menus keyboard operable", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Atlas" }).first()).toBeVisible();
    await openMenuFromControl(
      page,
      page.getByRole("button", { name: "Actions for Atlas" }).first(),
      "Actions for Atlas",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu", { name: "Actions for Atlas" })).toHaveCount(0);
  });

  test("tabs only to interactive descendants", async ({ page }) => {
    await page.getByRole("link", { name: "Atlas" }).first().focus();
    await expect(page.getByRole("link", { name: "Atlas" }).first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Actions for Atlas" }).first()).toBeFocused();
  });

  test("does not intercept arrow keys on the table", async ({ page }) => {
    const link = page.getByRole("link", { name: "Atlas" }).first();
    await link.focus();
    await page.keyboard.press("ArrowDown");
    await expect(link).toBeFocused();
  });

  test("owns horizontal overflow on narrow viewports and reaches the final column", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(page.getByRole("heading", { level: 1, name: "Table" })).toBeVisible();
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    await expect(region).toBeVisible();
    const metrics = await region.evaluate((node) => {
      const el = node as HTMLElement;
      const before = window.scrollX;
      window.scrollTo(2000, window.scrollY);
      const scrolled = window.scrollX > before + 1;
      window.scrollTo(before, window.scrollY);
      return {
        scrollable: el.scrollWidth > el.clientWidth,
        regionFitsViewport: el.clientWidth <= document.documentElement.clientWidth + 1,
        pageCanScrollHorizontally: scrolled,
        bodyScrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth,
      };
    });
    expect(metrics.scrollable).toBe(true);
    expect(metrics.regionFitsViewport).toBe(true);
    expect(metrics.pageCanScrollHorizontally).toBe(false);
    expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);

    const action = page.getByRole("button", { name: "Actions for Atlas" }).first();
    await region.evaluate((node) => {
      const el = node as HTMLElement;
      el.scrollLeft = el.scrollWidth;
    });
    await bringTableControlIntoView(action);
    const reachable = await action.evaluate((el) => {
      const scrollParent = el.closest("[data-table-scroll]") as HTMLElement | null;
      if (!scrollParent) return false;
      const buttonRect = el.getBoundingClientRect();
      const parentRect = scrollParent.getBoundingClientRect();
      return buttonRect.left >= parentRect.left - 1 && buttonRect.right <= parentRect.right + 1;
    });
    expect(reachable).toBe(true);
    await openMenuFromControl(page, action, "Actions for Atlas");
    await page.keyboard.press("Escape");
  });

  test("owns horizontal overflow at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    const scrollable = await region.evaluate(
      (node) => (node as HTMLElement).scrollWidth > (node as HTMLElement).clientWidth,
    );
    expect(scrollable).toBe(true);
  });

  test("keeps scroll-area focus policy consumer-controlled", async ({ page }) => {
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    await expect(region).toHaveAttribute("tabindex", "0");
    await region.focus();
    await expect(region).toBeFocused();

    const plain = page
      .getByTestId("table-sr-caption")
      .locator("xpath=ancestor::div[@data-table-scroll][1]");
    await expect(plain).not.toHaveAttribute("tabindex");
  });

  test("keeps screen-reader captions accessible", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Quarterly budget summary" })).toBeVisible();
  });

  test("exposes multi-level headers and composition examples", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Project spend versus budget" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Financials" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Archived projects" })).toBeVisible();
    await expect(page.getByText("No archived projects")).toBeVisible();
    await expect(page.getByRole("table", { name: "Loading project inventory" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    await expect(page.getByRole("table", { name: "Last known projects" })).toBeVisible();
  });

  test("supports RTL horizontal behavior", async ({ page }) => {
    const host = page.getByTestId("table-rtl-host");
    await expect(host).toHaveAttribute("dir", "rtl");
    const region = page.getByRole("region", { name: "Scrollable RTL sample table" });
    await expect(region).toBeVisible();
    await expect(page.getByRole("table", { name: "مشاريع نشطة" })).toBeVisible();
    const endAligned = page.getByTestId("table-rtl").getByRole("cell", { name: "$24,000" });
    await expect(endAligned).toHaveAttribute("data-align", "end");
    await openMenuFromControl(
      page,
      page.getByRole("button", { name: "Actions for Atlas RTL" }),
      "Actions for Atlas RTL",
    );
    await page.keyboard.press("Escape");
  });

  test("short viewport still exposes the projects table", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 400 });
    await expect(page.getByRole("table", { name: "Active projects" })).toBeVisible();
  });

  test("print media does not clip the scroll area", async ({ page }) => {
    await page.emulateMedia({ media: "print" });
    const region = page.getByRole("region", { name: "Scrollable projects table" });
    const overflow = await region.evaluate((node) => getComputedStyle(node as HTMLElement).overflowX);
    expect(overflow).toBe("visible");
  });

  test("shape and surface samples remain readable", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Pill container sample" })).toBeVisible();
    await expect(page.getByRole("table", { name: "Glass surface sample" })).toBeVisible();
  });

  test("loads without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto("/components/table");
    await expect(page.getByRole("heading", { level: 1, name: "Table" })).toBeVisible();
    expect(
      errors.filter(
        (entry) =>
          !entry.includes("favicon") && !entry.includes("Failed to fetch RSC payload"),
      ),
    ).toEqual([]);
  });
});
