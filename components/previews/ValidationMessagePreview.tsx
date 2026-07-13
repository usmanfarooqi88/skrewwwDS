"use client";

import { useState } from "react";
import { ValidationMessage } from "@/components/ui/ValidationMessage";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function ValidationMessagePreview() {
  const [liveError, setLiveError] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="ValidationMessage pairs icon and text. Meaning must never rely on color alone."
      >
        <PreviewGroup label="Static messages (announce=off)">
          <ValidationMessage type="error" announce="off">
            Enter a valid email address.
          </ValidationMessage>
          <ValidationMessage type="warning" announce="off">
            This action cannot be undone.
          </ValidationMessage>
          <ValidationMessage type="success" announce="off">
            Profile saved successfully.
          </ValidationMessage>
          <ValidationMessage type="info" announce="off">
            We will never share your email.
          </ValidationMessage>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="How are validation errors announced?">
        <PreviewGroup label="Dynamic error with assertive announcement">
          <div className="max-w-sm space-y-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                setLiveError("Workspace name is required.")
              }
            >
              Trigger live validation error
            </Button>
            {liveError ? (
              <ValidationMessage type="error" announce="assertive">
                {liveError}
              </ValidationMessage>
            ) : (
              <p className="text-sm text-ink-500">
                Static documentation messages use <code>announce=&quot;off&quot;</code> so they
                do not speak on initial page load.
              </p>
            )}
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
