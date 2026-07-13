"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function ProgressBarPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview">
        <PreviewGroup label="Determinate / Indeterminate">
          <ProgressBar label="Uploading files" value={42} max={100} showValue />
          <ProgressBar label="Processing request" indeterminate />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
