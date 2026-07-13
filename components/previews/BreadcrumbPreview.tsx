"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function BreadcrumbPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview title="Live preview" description="Hierarchical location trail with current-page semantics.">
        <PreviewGroup label="Standard hierarchy">
          <Breadcrumb
            items={[
              { label: "Home", href: "/", home: true },
              { label: "Components", href: "/components" },
              { label: "Navigation", href: "/components/category/navigation" },
              { label: "Breadcrumb" },
            ]}
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Long labels">
        <Breadcrumb
          items={[
            { label: "Home", href: "/", home: true },
            { label: "Enterprise customer settings workspace", href: "/components" },
            { label: "Billing and subscription management overview" },
          ]}
        />
        <p className="mt-4 text-sm text-ink-600">
          Separators are decorative and hidden from assistive technology. The current page is plain
          text with <code className="font-mono text-xs">aria-current=&quot;page&quot;</code>.
        </p>
      </ComponentPreview>
    </div>
  );
}
