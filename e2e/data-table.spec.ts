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
});
