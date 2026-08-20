"use client";

import { Radio } from "@/components/ui/Radio";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function RadioPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Native radio inputs stay circular in every shape personality."
      >
        <PreviewGroup label="Standalone radios sharing a name">
          <Radio name="preview-plan" value="starter" label="Starter" defaultChecked />
          <Radio name="preview-plan" value="pro" label="Pro" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="How should Radio buttons be grouped?">
        <PreviewGroup label="RadioGroup with disabled option">
          <RadioGroup
            label="Billing cycle"
            defaultValue="monthly"
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
              { value: "custom", label: "Custom", disabled: true },
            ]}
            className="max-w-sm"
          />
        </PreviewGroup>
        <PreviewGroup label="Required group">
          <RadioGroup
            label="Notification channel"
            required
            options={[
              { value: "email", label: "Email" },
              { value: "sms", label: "SMS" },
            ]}
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Group error">
        <PreviewGroup label="Validation at group level">
          <RadioGroup
            label="Shipping method"
            error="Select a shipping method."
            options={[
              { value: "standard", label: "Standard" },
              { value: "express", label: "Express" },
            ]}
            className="max-w-sm"
          />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
