"use client";

import { LineChart } from "@/components/ui";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

export function LineChartPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Monthly signups trend"
        description="Single-series, static line chart — a single stroked path with hollow-ring point markers, no axes/gridlines/legend/tooltip. The underlying data is also available to assistive tech via a visually-hidden table."
      >
        <PreviewGroup label="Signups trend by month">
          <LineChart data={monthlySignups} label="Monthly signups trend" />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
