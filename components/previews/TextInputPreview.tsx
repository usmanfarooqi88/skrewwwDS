"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SearchIcon } from "@/components/ui/icons";
import { TextInput } from "@/components/ui/TextInput";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function TextInputPreview() {
  const [value, setValue] = useState("");

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Single-line text entry with label, helper, and error relationships wired for assistive technology."
      >
        <PreviewGroup label="Default">
          <TextInput
            label="Email address"
            placeholder="you@example.com"
            supportingText="We will never share your email."
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Sizes">
        <PreviewGroup label="Small / Medium / Large">
          <TextInput label="Small" size="sm" placeholder="Small field" className="max-w-xs" />
          <TextInput label="Medium" size="md" placeholder="Medium field" className="max-w-xs" />
          <TextInput label="Large" size="lg" placeholder="Large field" className="max-w-xs" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States">
        <PreviewGroup label="Required / Error / Disabled">
          <TextInput
            label="Username"
            required
            placeholder="Required field"
            className="max-w-xs"
          />
          <TextInput
            label="Password"
            type="password"
            error="Password must be at least 8 characters."
            defaultValue="short"
            className="max-w-xs"
          />
          <TextInput
            label="Invite code"
            disabled
            defaultValue="DISABLED"
            className="max-w-xs"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Icons & actions">
        <PreviewGroup label="Leading icon / Trailing action">
          <TextInput
            label="Search"
            placeholder="Search components…"
            leadingIcon={<SearchIcon />}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="max-w-sm"
          />
          <TextInput
            label="Promo code"
            placeholder="Enter code"
            trailingAction={
              <Button variant="secondary" size="sm">
                Apply
              </Button>
            }
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
