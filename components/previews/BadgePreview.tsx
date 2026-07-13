"use client";

import { Badge } from "@/components/ui/Badge";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function BadgePreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Compact read-only status and count labels."
      >
        <PreviewGroup label="Neutral / Info / Success / Warning / Error">
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="info" showStatusIcon>
            Info
          </Badge>
          <Badge variant="success" showStatusIcon>
            Beta
          </Badge>
          <Badge variant="warning" showStatusIcon>
            Review
          </Badge>
          <Badge variant="error" showStatusIcon>
            Failed
          </Badge>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Counts and compact usage">
        <PreviewGroup label="Numeric / Sizes">
          <Badge variant="info" count={4} />
          <Badge variant="error" count={128} />
          <Badge variant="neutral" size="sm">
            Small
          </Badge>
          <Badge variant="success" size="lg">
            Large
          </Badge>
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Badges sit inline beside headings or metadata — they are not buttons or notifications.
        </p>
      </ComponentPreview>
    </div>
  );
}
