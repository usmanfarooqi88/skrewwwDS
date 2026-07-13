"use client";

import { Select } from "@/components/ui/Select";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const roleOptions = [
  { value: "viewer", label: "Viewer" },
  { value: "editor", label: "Editor" },
  { value: "admin", label: "Admin" },
];

export function SelectPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Select uses a custom listbox popover positioned below the trigger, with a hidden native select for form submission. Use Combobox when the field must be searchable."
      >
        <PreviewGroup label="Default">
          <Select
            label="Role"
            placeholder="Choose a role"
            options={roleOptions}
            supportingText="Custom listbox popover positioned below the trigger, with a hidden native select for form submission."
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Sizes">
        <PreviewGroup label="Small / Medium / Large">
          <div className="grid w-full max-w-xs gap-4">
            <Select label="Small" size="sm" placeholder="Pick one" options={roleOptions} />
            <Select label="Medium" size="md" placeholder="Pick one" options={roleOptions} />
            <Select label="Large" size="lg" placeholder="Pick one" options={roleOptions} />
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Form submission">
        <PreviewGroup label="Required field validation">
          <form data-testid="required-role-form" className="max-w-sm space-y-3">
            <Select
              label="Required role"
              name="role"
              required
              placeholder="Choose role"
              options={roleOptions}
            />
            <button type="submit" className="rounded-md bg-brand-600 px-3 py-2 text-sm text-white">
              Submit role form
            </button>
          </form>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States">
        <PreviewGroup label="Required / Error / Disabled">
          <div className="grid w-full max-w-sm gap-4">
            <Select
              label="Country"
              required
              placeholder="Select country"
              options={[
                { value: "us", label: "United States" },
                { value: "ca", label: "Canada" },
                { value: "uk", label: "United Kingdom" },
              ]}
            />
            <Select
              label="Timezone"
              error="Choose a timezone."
              defaultValue=""
              placeholder="Select timezone"
              options={[
                { value: "utc", label: "UTC" },
                { value: "est", label: "Eastern Time" },
              ]}
            />
            <Select label="Legacy plan" disabled defaultValue="viewer" options={roleOptions} />
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
