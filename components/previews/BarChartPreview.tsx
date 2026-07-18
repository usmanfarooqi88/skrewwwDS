"use client";

import { BarChart } from "@/components/ui";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

export function BarChartPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Monthly signups"
        description="Single-series, static bar chart — real proportional bar heights, month labels below, no Y-axis/gridlines/legend/tooltip. The underlying data is also available to assistive tech via a visually-hidden table."
      >
        <PreviewGroup label="Signups by month">
          <BarChart data={monthlySignups} label="Monthly signups" />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
