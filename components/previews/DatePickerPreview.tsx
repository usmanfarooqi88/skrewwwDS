"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function DatePickerPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Editable text field (D MMM YYYY, en-GB) with calendar popover. Type a date or pick from the grid."
      >
        <PreviewGroup label="Empty / selected / required / disabled / error">
          <DatePicker label="Release date" placeholder="e.g. 11 Jul 2026" />
          <DatePicker label="Documentation updated" defaultValue="2026-07-11" name="doc-updated" />
          <DatePicker label="Required milestone" required supportingText="ISO YYYY-MM-DD is submitted." />
          <DatePicker label="Locked date" defaultValue="2026-06-01" disabled />
          <DatePicker label="Due date" error="Choose a valid date." defaultValue="2026-07-01" />
          <DatePicker
            label="July 2026 only"
            minDate="2026-07-01"
            maxDate="2026-07-31"
            supportingText="Typed and picked dates must fall in range."
          />
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Hidden input submits canonical <code className="font-mono text-xs">YYYY-MM-DD</code> values.
          The visible field accepts and displays <code className="font-mono text-xs">D MMM YYYY</code> text
          (en-GB only, e.g. <code className="font-mono text-xs">11 Jul 2026</code>).
        </p>
      </ComponentPreview>
    </div>
  );
}
