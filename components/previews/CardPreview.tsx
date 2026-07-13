"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function CardPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Card uses component/radius/container and container-level elevation tokens — not the control radius used by Button or Text Input."
      >
        <PreviewGroup label="Flat elevation">
          <Card
            as="article"
            title="Project overview"
            headingLevel="h4"
            className="max-w-sm"
            footer={
              <>
                <Button variant="secondary" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save changes</Button>
              </>
            }
          >
            Group related content, metadata, and actions in a bounded surface. The footer
            composes real Button instances, matching the Figma component structure.
          </Card>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Elevation">
        <PreviewGroup label="Flat / Raised">
          <Card title="Flat card" elevation="flat" className="max-w-xs">
            No shadow — border defines the boundary using semantic/border/default.
          </Card>
          <Card title="Raised card" elevation="raised" className="max-w-xs">
            Uses shadow-blur/3 and shadow-color/3 for subtle elevation.
          </Card>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
