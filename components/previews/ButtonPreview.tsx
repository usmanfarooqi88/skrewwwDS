"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronRightIcon, PlusIcon } from "@/components/ui/icons";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function ButtonPreview() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Interactive Button instances using Skrewww tokens. Shape and surface are controlled globally through CSS custom properties — not separate component files."
      >
        <PreviewGroup label="Visual variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Sizes">
        <PreviewGroup label="Small / Medium / Large">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="States">
        <PreviewGroup label="Default / Disabled / Loading">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1500);
            }}
          >
            {loading ? "Saving…" : "Simulate loading"}
          </Button>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Icons & layout">
        <PreviewGroup label="Leading icon / Trailing icon / Full width">
          <Button leadingIcon={<PlusIcon />}>With icon</Button>
          <Button trailingIcon={<ChevronRightIcon />}>Continue</Button>
          <Button fullWidth className="max-w-xs">
            Full width
          </Button>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
