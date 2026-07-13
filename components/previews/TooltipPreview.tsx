"use client";

import { Copy } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function TooltipPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Concise supplementary labels for triggers with keyboard and pointer support."
      >
        <PreviewGroup label="Hover / Focus / Placements">
          <Tooltip content="Save changes">
            <Button aria-label="Save">Save</Button>
          </Tooltip>
          <Tooltip content="Copy documentation example" placement="bottom">
            <Button variant="secondary" aria-label="Copy example">
              <Copy size={16} aria-hidden="true" />
            </Button>
          </Tooltip>
          <Tooltip content="Long wrapping labels stay within the tooltip maximum width for readability." placement="right">
            <Button variant="secondary">Long label</Button>
          </Tooltip>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Keyboard and dismissal">
        <p className="text-sm text-ink-600">
          Tab to a trigger to open its tooltip on focus. Press Escape to dismiss. Tooltips do not
          move focus and must not contain essential instructions unavailable elsewhere.
        </p>
      </ComponentPreview>
    </div>
  );
}
