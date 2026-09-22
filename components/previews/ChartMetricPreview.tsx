"use client";

import { ChartMetric } from "@/components/ui";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function ChartMetricPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Value only"
        description="A label above a pre-formatted value. No delta, no chart required."
        testId="chart-metric-preview-value-only"
      >
        <PreviewGroup label="No delta">
          <ChartMetric label="Total balance" value="$4,231.09" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        testId="chart-metric-preview-delta"
        title="With a delta"
        description='direction selects only the icon (up/down/flat) — never a color. An increase is not always announced as "good."'
      >
        <div className="flex flex-wrap gap-8">
          <PreviewGroup label="Up">
            <ChartMetric label="Revenue" value="$12,000" delta={{ direction: "up", value: "+4.2%", label: "vs last 30 days" }} />
          </PreviewGroup>
          <PreviewGroup label="Down">
            <ChartMetric label="Error rate" value="0.8%" delta={{ direction: "down", value: "-0.3pp", label: "vs last 30 days" }} />
          </PreviewGroup>
          <PreviewGroup label="Flat">
            <ChartMetric label="Active users" value="1,204" delta={{ direction: "flat", value: "0%", label: "vs last 30 days" }} />
          </PreviewGroup>
        </div>
      </ComponentPreview>
    </div>
  );
}
