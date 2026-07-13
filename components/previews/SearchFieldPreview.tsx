"use client";

import { useState } from "react";
import { SearchField } from "@/components/ui/SearchField";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function SearchFieldPreview() {
  const [query, setQuery] = useState("components");

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Search Field is the canonical search-specific single-line field with a leading icon and optional clear action."
      >
        <PreviewGroup label="Default">
          <SearchField
            label="Search components"
            placeholder="Search the design system…"
            value={query}
            onValueChange={setQuery}
            className="max-w-md"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Sizes">
        <PreviewGroup label="Small / Medium / Large">
          <SearchField label="Small search" size="sm" defaultValue="Button" className="max-w-xs" />
          <SearchField label="Medium search" size="md" defaultValue="Card" className="max-w-xs" />
          <SearchField label="Large search" size="lg" defaultValue="Forms" className="max-w-xs" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States">
        <PreviewGroup label="Without clear / Disabled">
          <SearchField
            label="Filter (no clear)"
            showClear={false}
            defaultValue="Pinned query"
            className="max-w-md"
          />
          <SearchField
            label="Disabled search"
            disabled
            defaultValue="Unavailable"
            className="max-w-md"
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
