"use client";

import { useState } from "react";
import { Folder, FileTs, FileCss } from "@phosphor-icons/react";
import { TreeView, type TreeNode } from "@/components/ui";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const fileTree: TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: <Folder size={16} weight="fill" aria-hidden="true" />,
    children: [
      {
        id: "components",
        label: "components",
        icon: <Folder size={16} weight="fill" aria-hidden="true" />,
        children: [
          {
            id: "button-tsx",
            label: "Button.tsx",
            icon: <FileTs size={16} aria-hidden="true" />,
          },
          {
            id: "card-tsx",
            label: "Card.tsx",
            icon: <FileTs size={16} aria-hidden="true" />,
          },
          {
            id: "button-css",
            label: "button.module.css",
            icon: <FileCss size={16} aria-hidden="true" />,
          },
        ],
      },
      {
        id: "index-tsx",
        label: "index.tsx",
        icon: <FileTs size={16} aria-hidden="true" />,
      },
    ],
  },
  {
    id: "readme",
    label: "README.md",
    icon: <FileTs size={16} aria-hidden="true" />,
  },
];

export function TreeViewPreview() {
  const [expanded, setExpanded] = useState<string[]>(["src"]);
  const [selected, setSelected] = useState<string | null>("index-tsx");

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="File explorer"
        description="Depth-based indentation (20px per level, not a fixed variant) with roving-tabindex keyboard navigation — arrow keys move, expand, and collapse; Enter/Space selects."
      >
        <PreviewGroup label="Project files">
          <TreeView
            data={fileTree}
            expanded={expanded}
            onExpandedChange={setExpanded}
            selected={selected}
            onSelectedChange={setSelected}
            aria-label="Project files"
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
