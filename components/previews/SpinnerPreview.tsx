"use client";

import { Spinner } from "@/components/ui/Spinner";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function SpinnerPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview">
        <PreviewGroup label="Decorative / Standalone / Sizes">
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <Spinner decorative size="sm" />
            Loading results…
          </div>
          <Spinner label="Loading dashboard" />
          <div className="flex items-center gap-4">
            <Spinner size="sm" label="Loading small" />
            <Spinner size="md" label="Loading medium" />
            <Spinner size="lg" label="Loading large" />
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
