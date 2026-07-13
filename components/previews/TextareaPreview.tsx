"use client";

import { Textarea } from "@/components/ui/Textarea";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function TextareaPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Multi-line native textarea composed with FormField for label, helper, and validation relationships."
      >
        <PreviewGroup label="Default">
          <Textarea
            label="Description"
            placeholder="Tell us about your project…"
            supportingText="Markdown is not supported."
            className="max-w-md"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Sizes">
        <PreviewGroup label="Small / Medium / Large">
          <Textarea label="Small" size="sm" rows={3} className="max-w-md" />
          <Textarea label="Medium" size="md" rows={4} className="max-w-md" />
          <Textarea label="Large" size="lg" rows={5} className="max-w-md" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States">
        <PreviewGroup label="Error / Disabled / Read-only">
          <Textarea
            label="Bio"
            error="Bio must be at least 20 characters."
            defaultValue="Too short."
            className="max-w-md"
          />
          <Textarea
            label="Internal notes"
            disabled
            defaultValue="Locked field"
            className="max-w-md"
          />
          <Textarea
            label="Published copy"
            readOnly
            defaultValue="This content is read-only but remains focusable."
            className="max-w-md"
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
