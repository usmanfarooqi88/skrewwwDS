"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function AlertPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Persistent inline feedback tied to page content.">
        <PreviewGroup label="Information / Success / Warning / Error">
          <Alert type="info" title="Heads up" description="Documentation previews are Beta." />
          <Alert type="success" title="Saved" description="Your preferences were updated." />
          <Alert type="warning" title="Review required" description="Some tokens remain temporary." />
          <Alert type="error" title="Upload failed" description="Try again or contact support." />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Actions and dismissal">
        <PreviewGroup label="Dismissible / With action">
          <Alert
            type="info"
            title="Beta component"
            description="APIs may change while Figma parity gaps remain open."
            dismissible
          />
          <Alert
            type="warning"
            title="Temporary tokens in use"
            description="Progress and feedback spacing values are marked temporary."
            action={<Button size="sm" variant="secondary">Review tokens</Button>}
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
