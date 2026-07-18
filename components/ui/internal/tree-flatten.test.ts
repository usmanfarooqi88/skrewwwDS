import { describe, expect, it } from "vitest";
import {
  flattenVisibleTree,
  resolveTreeKeyAction,
  type TreeNode,
} from "@/components/ui/internal/tree-flatten";

const tree: TreeNode[] = [
  {
    id: "src",
    label: "src",
    children: [
      {
        id: "components",
        label: "components",
        children: [
          { id: "button", label: "Button.tsx" },
          { id: "card", label: "Card.tsx" },
        ],
      },
      { id: "index", label: "index.tsx" },
    ],
  },
  { id: "readme", label: "README.md" },
];

describe("flattenVisibleTree", () => {
  it("returns only root rows when nothing is expanded", () => {
    const rows = flattenVisibleTree(tree, new Set());
    expect(rows.map((row) => row.node.id)).toEqual(["src", "readme"]);
  });

  it("computes depth, setSize, and posInSet correctly across nested levels", () => {
    const rows = flattenVisibleTree(tree, new Set(["src", "components"]));
    expect(rows.map((row) => row.node.id)).toEqual([
      "src",
      "components",
      "button",
      "card",
      "index",
      "readme",
    ]);

    const src = rows.find((r) => r.node.id === "src")!;
    expect(src.depth).toBe(0);
    expect(src.parentId).toBeNull();
    expect(src.posInSet).toBe(1);
    expect(src.setSize).toBe(2);
    expect(src.hasChildren).toBe(true);

    const components = rows.find((r) => r.node.id === "components")!;
    expect(components.depth).toBe(1);
    expect(components.parentId).toBe("src");
    expect(components.posInSet).toBe(1);
    expect(components.setSize).toBe(2);

    const button = rows.find((r) => r.node.id === "button")!;
    expect(button.depth).toBe(2);
    expect(button.parentId).toBe("components");
    expect(button.posInSet).toBe(1);
    expect(button.setSize).toBe(2);
    expect(button.hasChildren).toBe(false);

    const card = rows.find((r) => r.node.id === "card")!;
    expect(card.depth).toBe(2);
    expect(card.posInSet).toBe(2);

    const readme = rows.find((r) => r.node.id === "readme")!;
    expect(readme.depth).toBe(0);
    expect(readme.posInSet).toBe(2);
    expect(readme.hasChildren).toBe(false);
  });

  it("does not descend into a node's children when only a deeper node is expanded", () => {
    // "components" expanded but its parent "src" is not — src's children
    // (including "components") must stay hidden entirely.
    const rows = flattenVisibleTree(tree, new Set(["components"]));
    expect(rows.map((row) => row.node.id)).toEqual(["src", "readme"]);
  });

  it("returns an empty list for empty data", () => {
    expect(flattenVisibleTree([], new Set())).toEqual([]);
  });
});

describe("resolveTreeKeyAction", () => {
  const collapsedRows = flattenVisibleTree(tree, new Set());
  const expandedRows = flattenVisibleTree(tree, new Set(["src", "components"]));

  it("ArrowDown moves to the next visible row, and is a no-op at the end", () => {
    expect(resolveTreeKeyAction("ArrowDown", collapsedRows, "src", new Set())).toEqual({
      type: "move",
      id: "readme",
    });
    expect(resolveTreeKeyAction("ArrowDown", collapsedRows, "readme", new Set())).toEqual({
      type: "none",
    });
  });

  it("ArrowUp moves to the previous visible row, and is a no-op at the start", () => {
    expect(resolveTreeKeyAction("ArrowUp", collapsedRows, "readme", new Set())).toEqual({
      type: "move",
      id: "src",
    });
    expect(resolveTreeKeyAction("ArrowUp", collapsedRows, "src", new Set())).toEqual({
      type: "none",
    });
  });

  it("ArrowRight on a leaf node is a no-op", () => {
    expect(resolveTreeKeyAction("ArrowRight", collapsedRows, "readme", new Set())).toEqual({
      type: "none",
    });
  });

  it("ArrowRight on a collapsed expandable node reads the first child id from raw node data (not the flattened rows, since a collapsed node's children are never rendered)", () => {
    expect(resolveTreeKeyAction("ArrowRight", collapsedRows, "src", new Set())).toEqual({
      type: "expand-and-focus-child",
      id: "src",
      childId: "components",
    });
  });

  it("ArrowRight on an already-expanded node with its first child visible moves focus directly", () => {
    expect(resolveTreeKeyAction("ArrowRight", expandedRows, "src", new Set(["src", "components"]))).toEqual(
      { type: "move", id: "components" },
    );
  });

  it("ArrowLeft on an expanded node collapses it in place", () => {
    expect(
      resolveTreeKeyAction("ArrowLeft", expandedRows, "src", new Set(["src", "components"])),
    ).toEqual({ type: "collapse", id: "src" });
  });

  it("ArrowLeft on a collapsed node or leaf moves focus to its parent", () => {
    expect(
      resolveTreeKeyAction("ArrowLeft", expandedRows, "button", new Set(["src", "components"])),
    ).toEqual({ type: "move", id: "components" });
  });

  it("ArrowLeft on a root-level node with no parent is a no-op", () => {
    expect(resolveTreeKeyAction("ArrowLeft", collapsedRows, "src", new Set())).toEqual({
      type: "none",
    });
  });

  it("Enter and Space both resolve to select", () => {
    expect(resolveTreeKeyAction("Enter", collapsedRows, "readme", new Set())).toEqual({
      type: "select",
      id: "readme",
    });
    expect(resolveTreeKeyAction(" ", collapsedRows, "readme", new Set())).toEqual({
      type: "select",
      id: "readme",
    });
  });

  it("returns none for an unrecognized key or an unknown focused id", () => {
    expect(resolveTreeKeyAction("a", collapsedRows, "readme", new Set())).toEqual({
      type: "none",
    });
    expect(resolveTreeKeyAction("ArrowDown", collapsedRows, "missing", new Set())).toEqual({
      type: "none",
    });
  });
});
