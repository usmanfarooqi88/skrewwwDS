"use client";

import { CalendarDay } from "@/components/ui/CalendarDay";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function CalendarDayPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Single day cell — intended for use inside Calendar Grid."
      >
        <PreviewGroup label="Default / today / selected / disabled / outside month">
          <CalendarDay date="2026-07-08" />
          <CalendarDay date="2026-07-11" today />
          <CalendarDay date="2026-07-14" selected />
          <CalendarDay date="2026-07-20" disabled />
          <CalendarDay date="2026-08-02" outsideMonth />
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Visible day numbers use full-date accessible names such as “14 July 2026”. Today uses
          the verified inside stroke rather than a separate dot.
        </p>
      </ComponentPreview>
    </div>
  );
}
