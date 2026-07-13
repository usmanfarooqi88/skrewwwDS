"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function CheckboxPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Native checkbox semantics with inline label. Checkbox affordance is preserved in every shape mode."
      >
        <PreviewGroup label="Unchecked / Checked / Indeterminate / Disabled">
          <Checkbox label="Unchecked" />
          <Checkbox label="Checked" defaultChecked />
          <Checkbox label="Indeterminate" indeterminate />
          <Checkbox label="Disabled" disabled />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Error composition">
        <PreviewGroup label="Invalid state with FormField">
          <FormField
            label="Permissions"
            error="Select at least one permission."
            className="max-w-sm"
          >
            {({ describedBy }) => (
              <Checkbox
                label="Manage billing"
                aria-describedby={describedBy}
                aria-invalid
              />
            )}
          </FormField>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
