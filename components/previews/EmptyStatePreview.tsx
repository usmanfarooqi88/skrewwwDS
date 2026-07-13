"use client";

import { MagnifyingGlass, PlusCircle } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function EmptyStatePreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Confirmed zero-content states — not loading placeholders or error alerts."
      >
        <PreviewGroup label="First-use">
          <EmptyState
            icon={<PlusCircle size={40} weight="duotone" />}
            title="Create your first project"
            description="Projects organize components, tokens, and documentation previews."
            primaryAction={{ label: "Create project", onClick: () => undefined }}
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="No results and recovery">
        <PreviewGroup label="Search / clear filters / informational">
          <EmptyState
            icon={<MagnifyingGlass size={40} />}
            title="No components match your search"
            description="Try a different term or clear active filters to see the full registry."
            primaryAction={{ label: "Clear filters", onClick: () => undefined }}
            secondaryAction={{ label: "Browse components", href: "/components" }}
          />
          <EmptyState
            title="No related documentation yet"
            description="Related links appear when registry metadata defines cross-references."
          />
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Announce dynamic no-results updates from the surrounding results region — not from every
          child inside Empty State. Illustrations and icons are decorative unless they add
          information not already present in the title or description.
        </p>
      </ComponentPreview>
    </div>
  );
}
