import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TreeView, type TreeNode } from "@/components/ui/TreeView";

const sampleData: TreeNode[] = [
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

function labels() {
  return screen.getAllByRole("treeitem").map((el) => el.textContent);
}

describe("TreeView", () => {
  it("renders only root rows collapsed by default (uncontrolled)", () => {
    render(<TreeView data={sampleData} aria-label="Files" />);
    expect(labels()).toEqual(["src", "README.md"]);
  });

  it("expands a node on chevron click and reveals its children", async () => {
    const user = userEvent.setup();
    render(<TreeView data={sampleData} aria-label="Files" />);

    const srcRow = screen.getByRole("treeitem", { name: "src" });
    await user.click(srcRow);
    // Clicking the row itself selects — it should not expand.
    expect(labels()).toEqual(["src", "README.md"]);

    // The chevron is the first child span inside the row.
    const chevron = srcRow.querySelector("span");
    await user.click(chevron as Element);
    expect(labels()).toEqual(["src", "components", "index.tsx", "README.md"]);
    expect(srcRow).toHaveAttribute("aria-expanded", "true");
  });

  it("supports controlled expanded state — clicking the chevron does not change it without a prop update", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <TreeView
        data={sampleData}
        expanded={[]}
        onExpandedChange={onExpandedChange}
        aria-label="Files"
      />,
    );

    const srcRow = screen.getByRole("treeitem", { name: "src" });
    const chevron = srcRow.querySelector("span");
    await user.click(chevron as Element);

    expect(onExpandedChange).toHaveBeenCalledWith(["src"]);
    // Still collapsed — the parent never fed the new value back in.
    expect(labels()).toEqual(["src", "README.md"]);
  });

  it("supports uncontrolled selection with defaultSelected and reports changes via onSelectedChange", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <TreeView data={sampleData} onSelectedChange={onSelectedChange} aria-label="Files" />,
    );

    const readmeRow = screen.getByRole("treeitem", { name: "README.md" });
    await user.click(readmeRow);
    expect(onSelectedChange).toHaveBeenCalledWith("readme");
    expect(readmeRow).toHaveAttribute("aria-selected", "true");
  });

  it("supports controlled selection", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [selected, setSelected] = useState<string | null>(null);
      return (
        <TreeView
          data={sampleData}
          selected={selected}
          onSelectedChange={setSelected}
          aria-label="Files"
        />
      );
    }
    render(<Controlled />);

    const readmeRow = screen.getByRole("treeitem", { name: "README.md" });
    await user.click(readmeRow);
    expect(readmeRow).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("treeitem", { name: "src" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("exposes aria-level, aria-setsize, and aria-posinset correctly at each depth", () => {
    render(
      <TreeView data={sampleData} defaultExpanded={["src", "components"]} aria-label="Files" />,
    );

    const src = screen.getByRole("treeitem", { name: "src" });
    expect(src).toHaveAttribute("aria-level", "1");
    expect(src).toHaveAttribute("aria-setsize", "2");
    expect(src).toHaveAttribute("aria-posinset", "1");

    const components = screen.getByRole("treeitem", { name: "components" });
    expect(components).toHaveAttribute("aria-level", "2");
    expect(components).toHaveAttribute("aria-setsize", "2");
    expect(components).toHaveAttribute("aria-posinset", "1");

    const button = screen.getByRole("treeitem", { name: "Button.tsx" });
    expect(button).toHaveAttribute("aria-level", "3");
    expect(button).toHaveAttribute("aria-setsize", "2");
    expect(button).toHaveAttribute("aria-posinset", "1");

    const card = screen.getByRole("treeitem", { name: "Card.tsx" });
    expect(card).toHaveAttribute("aria-posinset", "2");

    // Leaf nodes don't carry aria-expanded at all.
    expect(button).not.toHaveAttribute("aria-expanded");
  });

  it("only one row is in the tab sequence at a time (roving tabindex)", () => {
    render(<TreeView data={sampleData} aria-label="Files" />);
    const rows = screen.getAllByRole("treeitem");
    const tabbable = rows.filter((row) => row.getAttribute("tabindex") === "0");
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveTextContent("src");
  });

  it("ArrowDown/ArrowUp move roving focus between visible rows", async () => {
    const user = userEvent.setup();
    render(<TreeView data={sampleData} aria-label="Files" />);

    const src = screen.getByRole("treeitem", { name: "src" });
    const readme = screen.getByRole("treeitem", { name: "README.md" });
    src.focus();
    expect(src).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(readme).toHaveFocus();
    expect(readme).toHaveAttribute("tabindex", "0");
    expect(src).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowUp}");
    expect(src).toHaveFocus();
  });

  it("ArrowRight expands a collapsed node and moves focus onto its first child", async () => {
    const user = userEvent.setup();
    render(<TreeView data={sampleData} aria-label="Files" />);

    const src = screen.getByRole("treeitem", { name: "src" });
    src.focus();
    await user.keyboard("{ArrowRight}");

    const components = screen.getByRole("treeitem", { name: "components" });
    expect(components).toHaveFocus();
    expect(src).toHaveAttribute("aria-expanded", "true");
  });

  it("ArrowRight on an already-expanded node moves focus to its first child directly", async () => {
    const user = userEvent.setup();
    render(<TreeView data={sampleData} defaultExpanded={["src"]} aria-label="Files" />);

    const src = screen.getByRole("treeitem", { name: "src" });
    src.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("treeitem", { name: "components" })).toHaveFocus();
  });

  it("ArrowRight on a leaf node is a no-op", async () => {
    const user = userEvent.setup();
    render(<TreeView data={sampleData} aria-label="Files" />);

    const readme = screen.getByRole("treeitem", { name: "README.md" });
    readme.focus();
    await user.keyboard("{ArrowRight}");
    expect(readme).toHaveFocus();
  });

  it("ArrowLeft collapses an expanded node in place, then moves to parent on a second ArrowLeft", async () => {
    const user = userEvent.setup();
    render(<TreeView data={sampleData} defaultExpanded={["src"]} aria-label="Files" />);

    const src = screen.getByRole("treeitem", { name: "src" });
    src.focus();
    await user.keyboard("{ArrowLeft}");
    expect(src).toHaveFocus();
    expect(src).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("treeitem", { name: "components" })).not.toBeInTheDocument();
  });

  it("ArrowLeft on a leaf moves focus to its parent", async () => {
    const user = userEvent.setup();
    render(
      <TreeView data={sampleData} defaultExpanded={["src", "components"]} aria-label="Files" />,
    );

    const button = screen.getByRole("treeitem", { name: "Button.tsx" });
    button.focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("treeitem", { name: "components" })).toHaveFocus();
  });

  it("Enter and Space select the focused row", async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <TreeView data={sampleData} onSelectedChange={onSelectedChange} aria-label="Files" />,
    );

    const readme = screen.getByRole("treeitem", { name: "README.md" });
    readme.focus();
    await user.keyboard("{Enter}");
    expect(onSelectedChange).toHaveBeenCalledWith("readme");

    onSelectedChange.mockClear();
    await user.keyboard(" ");
    expect(onSelectedChange).toHaveBeenCalledWith("readme");
  });

  it("renders an empty tree without crashing", () => {
    render(<TreeView data={[]} aria-label="Files" />);
    expect(screen.getByRole("tree", { name: "Files" })).toBeInTheDocument();
    expect(screen.queryAllByRole("treeitem")).toHaveLength(0);
  });
});
