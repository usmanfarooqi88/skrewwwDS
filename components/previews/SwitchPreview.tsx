"use client";

import { Switch } from "@/components/ui/Switch";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function SwitchPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Switch is for immediate settings changes — not form agreement or multi-select."
      >
        <PreviewGroup label="Off / On / Disabled">
          <Switch label="Off by default" />
          <Switch label="On by default" defaultChecked />
          <Switch label="Disabled" disabled />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="When should a Switch be used?">
        <PreviewGroup label="Settings-oriented example">
          <div className="max-w-sm space-y-3 rounded-lg border border-ink-200 p-4">
            <Switch label="Email notifications" defaultChecked />
            <Switch label="Weekly digest" />
            <Switch label="Product announcements" />
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
