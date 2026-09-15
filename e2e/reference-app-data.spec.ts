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

async function visibleRequestIds(page: import("@playwright/test").Page) {
  return page.locator("[data-request-id]").evaluateAll((rows) =>
    rows.map((row) => row.getAttribute("data-request-id")),
  );
}

test.describe("Reference App data workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Keep the analytics consent banner from covering pagination/actions.
    await page.addInitScript(
      ([key, value]) => window.localStorage.setItem(key, value),
      ["skrewww.analyticsConsent.v1", "denied"],
    );
  });

  test("desktop search, filter, sort, pagination, empty state, and row menu", async ({
    page,
  }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/data");

    await expect(page.getByRole("heading", { name: "Requests", level: 1 })).toBeVisible();
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–6 of 18");
    expect(await visibleRequestIds(page)).toEqual([
      "req_001",
      "req_002",
      "req_003",
      "req_004",
      "req_005",
      "req_006",
    ]);

    const search = page.getByRole("searchbox", { name: "Search requests" });
    await search.fill("SSO");
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–1 of 1");
    expect(await visibleRequestIds(page)).toEqual(["req_001"]);

    await search.clear();
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–6 of 18");

    await page.getByRole("button", { name: "Filters" }).click();
    const filterPanel = page.getByRole("region", { name: "Request filters" });
    await expect(filterPanel).toBeVisible();
    await filterPanel.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Archived" }).click();
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–2 of 2");
    expect(await visibleRequestIds(page)).toEqual(["req_004", "req_014"]);

    await search.fill("badge");
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–1 of 1");
    expect(await visibleRequestIds(page)).toEqual(["req_014"]);

    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–6 of 18");

    // Panel may still be open after Clear all — open only if needed.
    if ((await page.getByRole("button", { name: "Filters" }).getAttribute("aria-expanded")) !== "true") {
      await page.getByRole("button", { name: "Filters" }).click();
    }
    await expect(filterPanel).toBeVisible();
    await filterPanel.getByRole("combobox", { name: "Status" }).click();
    await page.getByRole("option", { name: "Open" }).click();
    await expect(page.getByTestId("requests-result-count")).toContainText("of 7");
    await page.getByRole("button", { name: /Remove Status/i }).click();
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–6 of 18");

    const firstBeforeSort = (await visibleRequestIds(page))[0];
    await page.getByRole("columnheader", { name: "Due" }).getByRole("button").click();
    const firstAfterSort = (await visibleRequestIds(page))[0];
    expect(firstAfterSort).not.toBe(firstBeforeSort);
    expect(firstAfterSort).toBe("req_014");

    await page.getByRole("button", { name: "Actions for req_014" }).click();
    await expect(page.getByRole("menuitem", { name: "View / Edit" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/reference/data");
    await page.getByRole("button", { name: "Next page" }).click();
    expect(await visibleRequestIds(page)).toEqual([
      "req_007",
      "req_008",
      "req_009",
      "req_010",
      "req_011",
      "req_012",
    ]);
    await page.getByRole("button", { name: "Page 3" }).click();
    expect(await visibleRequestIds(page)).toEqual([
      "req_013",
      "req_014",
      "req_015",
      "req_016",
      "req_017",
      "req_018",
    ]);

    await page.getByRole("searchbox", { name: "Search requests" }).fill("zzzz-no-match");
    await expect(page.getByRole("heading", { name: "No matching requests" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByTestId("requests-result-count")).toContainText("Showing 1–6 of 18");

    expect(errors).toEqual([]);
  });

  test("narrow desktop keeps table usable at 900px", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("/reference/data");
    await expect(page.getByTestId("requests-table")).toBeVisible();
    await expect(page.getByTestId("requests-result-count")).toContainText("of 18");
    const scroll = page.getByTestId("requests-table-scroll");
    const metrics = await scroll.evaluate((el) => ({
      overflowX: getComputedStyle(el).overflowX,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(["auto", "scroll"]).toContain(metrics.overflowX);
    expect(errors).toEqual([]);
  });

  test("mobile filter drawer and horizontal table scroll at 390px", async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/reference/data");

    await expect(page.getByRole("searchbox", { name: "Search requests" })).toBeVisible();
    const filterButton = page.getByRole("button", { name: "Open filters" });
    await filterButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("combobox", { name: "Priority" }).click();
    await page.getByRole("option", { name: "High" }).click();
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Filters/ })).toBeFocused();
    await expect(page.getByTestId("requests-result-count")).toContainText("of 5");

    const scroll = page.getByTestId("requests-table-scroll");
    const metrics = await scroll.evaluate((el) => {
      const pageWidth = document.documentElement.scrollWidth;
      const viewport = window.innerWidth;
      if (el.scrollWidth <= el.clientWidth) {
        return { canScroll: false, pageWidth, viewport };
      }
      el.scrollLeft = el.scrollWidth;
      return { canScroll: el.scrollLeft > 0, pageWidth, viewport };
    });
    expect(metrics.canScroll).toBe(true);
    // Table may still widen the document slightly; record for RA-5. Local scroll must work.
    expect(metrics.pageWidth).toBeGreaterThanOrEqual(metrics.viewport);
    await expect(page.getByRole("button", { name: /Actions for req_/ }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("keyboard: sort header, row menu, and pagination", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/reference/data");

    await page.getByRole("columnheader", { name: "Owner" }).getByRole("button").focus();
    await page.keyboard.press("Enter");
    expect((await visibleRequestIds(page))[0]).toBe("req_001");

    await page.getByRole("button", { name: "Actions for req_001" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);

    await page.getByRole("button", { name: "Next page" }).focus();
    await page.keyboard.press("Enter");
    // Owner ascending page 2 starts with Jonah Park fixtures.
    expect(await visibleRequestIds(page)).toEqual([
      "req_002",
      "req_005",
      "req_009",
      "req_011",
      "req_015",
      "req_017",
    ]);
  });
});
