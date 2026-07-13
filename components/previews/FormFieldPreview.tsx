"use client";

import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import { TextInput } from "@/components/ui/TextInput";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function FormFieldPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="FormField owns label, description, required indicator, and validation placement. Prefer complete field components (TextInput, Select) for most forms; use FormField directly for grouped controls."
      >
        <PreviewGroup label="Label + description + required">
          <TextInput
            label="Workspace name"
            required
            supportingText="Visible to everyone in your workspace."
            placeholder="Acme Design"
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Advanced composition">
        <PreviewGroup label="Checkbox list under one field label">
          <FormField
            label="Notifications"
            supportingText="Choose what we should send you."
            className="max-w-sm space-y-2"
          >
            {() => (
              <div className="space-y-2">
                <Checkbox label="Product updates" defaultChecked />
                <Checkbox label="Security alerts" />
              </div>
            )}
          </FormField>
        </PreviewGroup>
        <PreviewGroup label="Error via complete field component">
          <TextInput
            label="API key"
            error="Enter a valid API key."
            defaultValue="invalid"
            className="max-w-sm"
          />
        </PreviewGroup>
        <PreviewGroup label="RadioGroup and Switch">
          <RadioGroup
            label="Default role"
            defaultValue="editor"
            options={[
              { value: "viewer", label: "Viewer" },
              { value: "editor", label: "Editor" },
            ]}
            className="max-w-sm"
          />
          <Switch label="Enable beta features" className="max-w-sm" />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
