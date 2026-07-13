"use client";

import { CalendarGrid } from "@/components/ui/CalendarGrid";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function CalendarGridPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Single-date month grid with roving tabindex and arrow-key navigation."
      >
        <PreviewGroup label="Current month">
          <CalendarGrid defaultValue="2026-07-14" />
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Arrow keys move focus; Enter or Space selects. Page Up/Page Down change months. Initial
          policy uses Monday week start and en-GB formatting — localization deferred.
        </p>
      </ComponentPreview>

      <ComponentPreview
        title="Range mode"
        description="Two-click range selection with a live hover/keyboard preview before the end is committed."
      >
        <PreviewGroup label="Pick a start, then an end date">
          <CalendarGrid mode="range" defaultVisibleMonth={{ year: 2026, month: 7 }} />
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          First click sets the start date. Hover or arrow-key to preview the range before
          committing an end with a second click or Enter. Clicking inside a completed range starts
          a new one.
        </p>
      </ComponentPreview>
    </div>
  );
}
