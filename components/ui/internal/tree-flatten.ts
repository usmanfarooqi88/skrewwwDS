import type { ReactNode } from "react";

export type TreeNode = {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: TreeNode[];
};

export type FlatTreeRow = {
  node: TreeNode;
  depth: number;
  parentId: string | null;
  posInSet: number;
  setSize: number;
  hasChildren: boolean;
};

/**
 * Flattens a tree into its currently-visible rows in document order
 * (depth-first, pre-order). A node's children are only included when the
 * node's own id is in `expandedIds` — matching the real Figma anatomy,
 * where indentation is a per-instance depth spacer, not a fixed variant.
 */
export function flattenVisibleTree(
  nodes: TreeNode[],
  expandedIds: ReadonlySet<string>,
): FlatTreeRow[] {
  const rows: FlatTreeRow[] = [];

  function visit(siblings: TreeNode[], depth: number, parentId: string | null) {
    siblings.forEach((node, index) => {
      const hasChildren = Boolean(node.children && node.children.length > 0);
      rows.push({
        node,
        depth,
        parentId,
        posInSet: index + 1,
        setSize: siblings.length,
        hasChildren,
      });
      if (hasChildren && expandedIds.has(node.id)) {
        visit(node.children as TreeNode[], depth + 1, node.id);
      }
    });
  }

  visit(nodes, 0, null);
  return rows;
}

export type TreeKeyAction =
  | { type: "move"; id: string }
  | { type: "expand"; id: string }
  | { type: "expand-and-focus-child"; id: string; childId: string }
  | { type: "collapse"; id: string }
  | { type: "select"; id: string }
  | { type: "none" };

/**
 * Pure resolution of a keydown into a tree action — no DOM or state access,
 * so branches are unit-testable without rendering. `rows` must already be
 * ordered by `flattenVisibleTree` (depth-first, pre-order): an expanded
 * node's first child is always the very next row, which lets ArrowRight
 * resolve without a second tree walk.
 */
export function resolveTreeKeyAction(
  key: string,
  rows: FlatTreeRow[],
  focusedId: string,
  expandedIds: ReadonlySet<string>,
): TreeKeyAction {
  const index = rows.findIndex((row) => row.node.id === focusedId);
  if (index === -1) return { type: "none" };
  const row = rows[index];

  switch (key) {
    case "ArrowDown": {
      const next = rows[index + 1];
      return next ? { type: "move", id: next.node.id } : { type: "none" };
    }
    case "ArrowUp": {
      const previous = rows[index - 1];
      return previous ? { type: "move", id: previous.node.id } : { type: "none" };
    }
    case "ArrowRight": {
      if (!row.hasChildren) return { type: "none" };
      if (!expandedIds.has(row.node.id)) {
        // A collapsed node's children are never in `rows` (flattenVisibleTree
        // only recurses into already-expanded nodes), so the first child's id
        // must come from the raw node data, not from the flattened list.
        const firstChild = row.node.children?.[0];
        return firstChild
          ? { type: "expand-and-focus-child", id: row.node.id, childId: firstChild.id }
          : { type: "expand", id: row.node.id };
      }
      const child = rows[index + 1];
      return child && child.parentId === row.node.id
        ? { type: "move", id: child.node.id }
        : { type: "none" };
    }
    case "ArrowLeft": {
      if (row.hasChildren && expandedIds.has(row.node.id)) {
        return { type: "collapse", id: row.node.id };
      }
      if (row.parentId) return { type: "move", id: row.parentId };
      return { type: "none" };
    }
    case "Enter":
    case " ":
      return { type: "select", id: row.node.id };
    default:
      return { type: "none" };
  }
}
