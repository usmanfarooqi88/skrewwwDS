"use client";

import { AreaChart } from "@/components/ui/AreaChart";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const monthlyUsers = [
  { label: "Jan", value: 120 },
  { label: "Feb", value: 180 },
  { label: "Mar", value: 150 },
  { label: "Apr", value: 240 },
  { label: "May", value: 210 },
  { label: "Jun", value: 300 },
];

const traffic = [
  { label: "Mon", web: 320, mobile: 210 },
  { label: "Tue", web: 360, mobile: 240 },
  { label: "Wed", web: 300, mobile: 280 },
  { label: "Thu", web: 410, mobile: 260 },
  { label: "Fri", web: 380, mobile: 300 },
];

const platforms = [
  { key: "web", label: "Web" },
  { key: "mobile", label: "Mobile" },
];

export function AreaChartPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Monthly active users"
        description="Single-series area chart — a 2px stroke over a translucent fill. There is no Figma reference for this component. The underlying data is also available to assistive tech via a visually-hidden table."
      >
        <PreviewGroup label="Active users by month">
          <AreaChart data={monthlyUsers} label="Monthly active users" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Multiple series"
        description="Series overlap by default; stacked stacks them and percent stacks each category to 100%. Axes, grid, legend and tooltip are opt-in."
      >
        <PreviewGroup label="Overlapped">
          <AreaChart data={traffic} series={platforms} label="Traffic by platform, overlapped" showValueAxis showGrid tooltip />
        </PreviewGroup>
        <PreviewGroup label="Stacked">
          <AreaChart data={traffic} series={platforms} stacking="stacked" label="Traffic by platform, stacked" showValueAxis showGrid tooltip />
        </PreviewGroup>
        <PreviewGroup label="100% stacked">
          <AreaChart data={traffic} series={platforms} stacking="percent" label="Traffic by platform, share" showValueAxis showGrid />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
