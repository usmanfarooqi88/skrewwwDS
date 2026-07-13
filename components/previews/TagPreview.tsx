"use client";

import { FolderSimple } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Tag } from "@/components/ui/Tag";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function TagPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Classification labels — distinct from read-only Badge status metadata."
      >
        <PreviewGroup label="Standard / leading icon / removable">
          <Tag>Documentation</Tag>
          <Tag leadingIcon={<FolderSimple size={14} aria-hidden="true" />}>Design Systems</Tag>
          <Tag removable onRemove={() => undefined}>
            Filters
          </Tag>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Tag vs Badge">
        <PreviewGroup label="Category Tag vs status Badge">
          <Tag>Category: Beta</Tag>
          <Badge variant="success">Beta</Badge>
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Tag represents an assigned category or filter value. Badge communicates compact read-only
          status — it is not removable.
        </p>
      </ComponentPreview>
    </div>
  );
}
