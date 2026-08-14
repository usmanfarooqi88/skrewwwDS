import { expect, test } from "@playwright/test";

test.describe("Data Table browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/data-table");
  });

  test("exposes sortable column headers with a real button and aria-sort=none initially", async ({
    page,
  }) => {
    const projectHeader = page.getByRole("columnheader", { name: "Project" });
    await expect(projectHeader).toHaveAttribute("aria-sort", "none");
    await expect(page.getByRole("button", { name: "Project" })).toBeVisible();
    await expect(page.getByRole("grid")).toHaveCount(0);
  });

  test("sorts rendered rows end-to-end on click and cycles ascending -> descending -> none", async ({
    page,
  }) => {
    const firstDataCell = () =>
      page.locator('[data-testid="data-table-preview"] tbody tr').first().locator("td").first();

    const sortButton = page.getByRole("button", { name: "Project" });

    await sortButton.click();
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(firstDataCell()).toHaveText("Anchor");

    await sortButton.click();
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await expect(firstDataCell()).toHaveText("Voyager");

    await sortButton.click();
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "none",
    );
    await expect(firstDataCell()).toHaveText("Atlas");
  });

  test("activating a different column resets it to ascending and clears the previous column", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Project" }).click();
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await page.getByRole("button", { name: "Budget" }).click();
    await expect(page.getByRole("columnheader", { name: "Budget" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  test("sort header is keyboard operable via Tab + Enter and Tab + Space", async ({ page }) => {
    const sortButton = page.getByRole("button", { name: "Project" });
    await sortButton.focus();
    await expect(sortButton).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    await expect(sortButton).toBeFocused();
    await page.keyboard.press(" ");
    await expect(page.getByRole("columnheader", { name: "Project" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  test("composes external Pagination alongside the table", async ({ page }) => {
    const table = page.locator('[data-testid="data-table-preview"]');
    await expect(table.locator("tbody tr")).toHaveCount(4);

    const firstDataCell = () => table.locator("tbody tr").first().locator("td").first();
    await expect(firstDataCell()).toHaveText("Atlas");

    await page.getByRole("navigation", { name: "Projects pagination" }).getByRole("button", { name: "Page 2" }).click();
    await expect(table.locator("tbody tr")).toHaveCount(4);
    await expect(firstDataCell()).not.toHaveText("Atlas");
  });

  test("resets to page 1 when a sort is applied", async ({ page }) => {
    const pagination = page.getByRole("navigation", { name: "Projects pagination" });
    const currentPage = pagination.locator('[aria-current="page"]');

    await pagination.getByRole("button", { name: "Page 2" }).click();
    await expect(currentPage).toHaveText("2");

    await page.getByRole("button", { name: "Project" }).click();
    await expect(currentPage).toHaveText("1");
  });

  test("spaces and aligns external Pagination responsively without page overflow", async ({ page }) => {
    const pagination = page.getByRole("navigation", { name: "Projects pagination" });

    for (const expected of [
      { viewport: { width: 1280, height: 1000 }, justifyContent: "flex-end", mobile: false },
      { viewport: { width: 768, height: 812 }, justifyContent: "flex-end", mobile: false },
      { viewport: { width: 375, height: 812 }, justifyContent: "center", mobile: true },
    ]) {
      await page.setViewportSize(expected.viewport);
      const layout = await pagination.evaluate((nav) => {
        const sizingWrapper = nav.parentElement as HTMLElement;
        const alignmentWrapper = sizingWrapper.parentElement as HTMLElement;
        const tableScrollArea = alignmentWrapper.previousElementSibling as HTMLElement;
        const navRect = nav.getBoundingClientRect();
        const alignmentRect = alignmentWrapper.getBoundingClientRect();
        const tableRect = tableScrollArea.getBoundingClientRect();
        return {
          gap: alignmentRect.top - tableRect.bottom,
          justifyContent: getComputedStyle(alignmentWrapper).justifyContent,
          navLeft: navRect.left,
          navRight: navRect.right,
          alignmentLeft: alignmentRect.left,
          alignmentRight: alignmentRect.right,
          tableScrollable: tableScrollArea.scrollWidth > tableScrollArea.clientWidth,
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
        };
      });

      expect(layout.gap).toBe(24);
      expect(layout.justifyContent).toBe(expected.justifyContent);
      expect(layout.navLeft).toBeGreaterThanOrEqual(layout.alignmentLeft - 0.5);
      expect(layout.navRight).toBeLessThanOrEqual(layout.alignmentRight + 0.5);
      expect(layout.documentWidth).toBe(layout.viewportWidth);
      if (!expected.mobile) {
        expect(layout.navRight).toBeCloseTo(layout.alignmentRight, 0);
      } else {
        expect(layout.tableScrollable).toBe(true);
        expect(layout.navLeft - layout.alignmentLeft).toBeCloseTo(
          layout.alignmentRight - layout.navRight,
          0,
        );
      }
    }
  });
});
