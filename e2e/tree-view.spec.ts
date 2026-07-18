import { expect, test } from "@playwright/test";

test.describe("Tree View browser behavior", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/components/tree-view");
  });

  test("renders the preview's default state — src pre-expanded, deeper nodes collapsed, index.tsx pre-selected", async ({
    page,
  }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const src = tree.getByRole("treeitem", { name: "src" });

    await expect(src).toBeVisible();
    await expect(src).toHaveAttribute("aria-expanded", "true");
    await expect(tree.getByRole("treeitem", { name: "components" })).toBeVisible();
    await expect(tree.getByRole("treeitem", { name: "index.tsx" })).toBeVisible();
    await expect(tree.getByRole("treeitem", { name: "README.md" })).toBeVisible();

    // "components" itself is collapsed by default — its files stay hidden.
    await expect(tree.getByRole("treeitem", { name: "Button.tsx" })).toHaveCount(0);

    await expect(tree.getByRole("treeitem", { name: "index.tsx" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  test("expands 'components' via chevron click and reveals its files", async ({ page }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const components = tree.getByRole("treeitem", { name: "components" });
    await components.locator("span").first().click();

    await expect(components).toHaveAttribute("aria-expanded", "true");
    await expect(tree.getByRole("treeitem", { name: "Button.tsx" })).toBeVisible();
    await expect(tree.getByRole("treeitem", { name: "Card.tsx" })).toBeVisible();
  });

  test("keyboard: ArrowDown moves focus to the next visible row", async ({ page }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const src = tree.getByRole("treeitem", { name: "src" });
    const components = tree.getByRole("treeitem", { name: "components" });

    await src.focus();
    await expect(src).toBeFocused();

    // src is already expanded, so the very next visible row is "components".
    await page.keyboard.press("ArrowDown");
    await expect(components).toBeFocused();
  });

  test("keyboard: ArrowRight expands a collapsed node and moves focus onto its first child", async ({
    page,
  }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const components = tree.getByRole("treeitem", { name: "components" });

    await components.focus();
    await page.keyboard.press("ArrowRight");

    await expect(components).toHaveAttribute("aria-expanded", "true");
    await expect(tree.getByRole("treeitem", { name: "Button.tsx" })).toBeFocused();
  });

  test("keyboard: ArrowLeft collapses an expanded node, then a leaf's ArrowLeft moves to its parent", async ({
    page,
  }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const components = tree.getByRole("treeitem", { name: "components" });

    await components.focus();
    await page.keyboard.press("ArrowRight"); // expand "components" + focus its first child
    const buttonFile = tree.getByRole("treeitem", { name: "Button.tsx" });
    await expect(buttonFile).toBeFocused();

    await page.keyboard.press("ArrowLeft"); // leaf -> move to parent
    await expect(components).toBeFocused();

    await page.keyboard.press("ArrowLeft"); // expanded -> collapse in place
    await expect(components).toBeFocused();
    await expect(components).toHaveAttribute("aria-expanded", "false");
    await expect(buttonFile).toHaveCount(0);
  });

  test("keyboard: Enter selects the focused row", async ({ page }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const readme = tree.getByRole("treeitem", { name: "README.md" });

    await readme.focus();
    await page.keyboard.press("Enter");
    await expect(readme).toHaveAttribute("aria-selected", "true");
    // Selecting README.md deselects the previously-selected index.tsx.
    await expect(tree.getByRole("treeitem", { name: "index.tsx" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  test("only one row is focusable via Tab at a time (roving tabindex)", async ({ page }) => {
    const tree = page.getByRole("tree", { name: "Project files" });
    const src = tree.getByRole("treeitem", { name: "src" });
    const readme = tree.getByRole("treeitem", { name: "README.md" });

    await expect(src).toHaveAttribute("tabindex", "0");
    await expect(readme).toHaveAttribute("tabindex", "-1");
  });
});
