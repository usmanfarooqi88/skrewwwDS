import { expect, test } from "./fixtures";

async function collectConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  return errors;
}

function unexpectedErrors(errors: string[]) {
  return errors.filter(
    (message) =>
      !message.includes("webcrx") &&
      !message.includes("WebSocket connection") &&
      !message.includes("/_next/hmr"),
  );
}

async function assertNoPageHorizontalOverflow(page: import("@playwright/test").Page) {
  const metrics = await page.evaluate(() => {
    const before = window.scrollX;
    window.scrollTo(document.documentElement.scrollWidth, 0);
    const after = window.scrollX;
    window.scrollTo(before, window.scrollY);
    return {
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      viewport: window.innerWidth,
      canScrollX: after > 0,
    };
  });
  // Body must not widen; page must not scroll horizontally.
  // Chromium may still report an inflated documentElement.scrollWidth for
  // wide tables inside overflow:auto — that is not user-scrollable overflow.
  expect(metrics.canScrollX).toBe(false);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport + 1);
}

const ROUTES = [
  "/reference",
  "/reference/data",
  "/reference/new",
  "/reference/edit/req_001",
  "/reference/settings",
] as const;

test.describe("Reference App responsive + accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      ["skrewww.analyticsConsent.v1", "denied"],
    );
  });

  test("desktop 1280: landmarks, skip link, aria-current, no overflow", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference");

    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();

    await expect(page.getByRole("complementary", { name: "Reference app sidebar" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Reference app" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    await assertNoPageHorizontalOverflow(page);

    await page.goto("/reference/data");
    await expect(page.getByRole("searchbox", { name: "Search requests" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Request" })).toBeVisible();
    await assertNoPageHorizontalOverflow(page);

    await page.goto("/reference/new");
    await expect(page.getByLabel("Title")).toBeVisible();
    await assertNoPageHorizontalOverflow(page);

    expect(unexpectedErrors(errors)).toEqual([]);
  });

  test("narrow 900: shell, data table containment, form readable", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 900, height: 800 });

    await page.goto("/reference/settings");
    await expect(page.getByRole("complementary", { name: "Reference app sidebar" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
    await assertNoPageHorizontalOverflow(page);

    await page.goto("/reference/data");
    const scroll = page.getByTestId("requests-table-scroll");
    await expect(scroll).toBeVisible();
    const tableMetrics = await scroll.evaluate((el) => ({
      overflowX: getComputedStyle(el).overflowX,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(["auto", "scroll"]).toContain(tableMetrics.overflowX);
    expect(tableMetrics.scrollWidth).toBeGreaterThan(tableMetrics.clientWidth);
    await assertNoPageHorizontalOverflow(page);

    await page.goto("/reference/edit/req_001");
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible();
    await assertNoPageHorizontalOverflow(page);

    expect(unexpectedErrors(errors)).toEqual([]);
  });

  test("mobile 390: overflow gate on all routes + shell drawer a11y", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await assertNoPageHorizontalOverflow(page);
    }

    await page.goto("/reference");
    const menuButton = page.getByRole("button", { name: "Open navigation" });
    await menuButton.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("navigation", { name: "Reference app" })).toBeVisible();
    await drawer.getByRole("link", { name: "Requests" }).click();
    await expect(page).toHaveURL(/\/reference\/data$/);
    await expect(page.getByRole("heading", { name: "Requests", level: 1 })).toBeVisible();

    await page.goto("/reference/data");
    const scroll = page.getByTestId("requests-table-scroll");
    const canScroll = await scroll.evaluate((el) => {
      if (el.scrollWidth <= el.clientWidth) return false;
      el.scrollLeft = el.scrollWidth;
      return el.scrollLeft > 0;
    });
    expect(canScroll).toBe(true);
    await assertNoPageHorizontalOverflow(page);

    expect(unexpectedErrors(errors)).toEqual([]);
  });

  test("constrained height 390×640: drawers and discard dialog stay reachable", async ({
    page,
  }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 640 });

    await page.goto("/reference/data");
    await page.getByRole("button", { name: "Open filters" }).click();
    const filterDialog = page.getByRole("dialog");
    await expect(filterDialog).toBeVisible();
    const apply = filterDialog.getByRole("button", { name: "Apply" });
    await expect(apply).toBeVisible();
    const applyBox = await apply.boundingBox();
    expect(applyBox).not.toBeNull();
    expect(applyBox!.y).toBeGreaterThanOrEqual(0);
    expect(applyBox!.y + applyBox!.height).toBeLessThanOrEqual(640 + 1);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: "Open navigation" }).click();
    const navDialog = page.getByRole("dialog");
    await expect(navDialog.getByRole("link", { name: "New request" })).toBeVisible();
    const linkBox = await navDialog.getByRole("link", { name: "New request" }).boundingBox();
    expect(linkBox).not.toBeNull();
    expect(linkBox!.y + linkBox!.height).toBeLessThanOrEqual(640 + 1);
    await page.keyboard.press("Escape");

    await page.goto("/reference/edit/req_001");
    await page.getByLabel("Title").fill("RA-4 discard height check");
    await page.getByRole("button", { name: "Cancel" }).click();
    const discard = page.getByRole("dialog");
    await expect(discard.getByRole("heading", { name: "Discard unsaved changes?" })).toBeVisible();
    const discardBtn = discard.getByRole("button", { name: "Discard changes" });
    const discardBox = await discardBtn.boundingBox();
    expect(discardBox).not.toBeNull();
    expect(discardBox!.y).toBeGreaterThanOrEqual(0);
    expect(discardBox!.y + discardBox!.height).toBeLessThanOrEqual(640 + 1);
    await discard.getByRole("button", { name: "Continue editing" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();

    expect(unexpectedErrors(errors)).toEqual([]);
  });

  test("keyboard: form errors, combobox, and dialog focus restore", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/new");

    await page.getByRole("button", { name: "Create request" }).click();
    await expect(page.getByText("Enter a request title.")).toBeVisible();
    await expect(page.getByText("Choose an owner.")).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("combobox", { name: "Owner" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await page.getByLabel("Title").fill("RA-4 keyboard proof");
    await expect(page.getByLabel("Title")).not.toHaveAttribute("aria-invalid", "true");

    await page.getByRole("combobox", { name: "Owner" }).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("combobox", { name: "Owner" })).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );

    await page.getByLabel("Title").fill("RA-4 dirty for discard");
    await page.getByRole("button", { name: "Cancel" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();

    expect(unexpectedErrors(errors)).toEqual([]);
  });

  test("data page: aria-sort and pagination labels", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/data");

    const ownerHeader = page.getByRole("columnheader", { name: "Owner" });
    await ownerHeader.getByRole("button").click();
    await expect(ownerHeader).toHaveAttribute("aria-sort", "ascending");
    await ownerHeader.getByRole("button").click();
    await expect(ownerHeader).toHaveAttribute("aria-sort", "descending");

    await expect(page.getByRole("navigation", { name: "Requests pagination" })).toBeVisible();
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible();
  });
});
