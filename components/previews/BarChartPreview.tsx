"use client";

import { BarChart } from "@/components/ui/BarChart";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

const quarterly = [
  { label: "Q1", revenue: 120000, orders: 80 },
  { label: "Q2", revenue: 150000, orders: 95 },
  { label: "Q3", revenue: 135000, orders: 110 },
  { label: "Q4", revenue: 180000, orders: 125 },
];

const channels = [
  { label: "Search", value: 420 },
  { label: "Direct", value: 310 },
  { label: "Referral", value: 190 },
  { label: "Social", value: 120 },
];

const quarterlySeries = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
];

export function BarChartPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Monthly signups"
        description="Single-series, static bar chart — real proportional bar heights and month labels below. With no extra props there is no Y-axis, gridlines, legend or tooltip. The underlying data is also available to assistive tech via a visually-hidden table."
      >
        <PreviewGroup label="Signups by month">
          <BarChart data={monthlySignups} label="Monthly signups" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Multiple series"
        description="Pass series and rows keyed by series. Grouped is the default; stacked stacks the series and percent stacks each category to 100%. The legend is a non-interactive key, and the hidden table has a column per series."
      >
        <PreviewGroup label="Grouped">
          <BarChart data={quarterly} series={quarterlySeries} label="Revenue and orders by quarter, grouped" showValueAxis showGrid tooltip valueFormat={{ kind: "compact" }} />
        </PreviewGroup>
        <PreviewGroup label="Stacked">
          <BarChart data={quarterly} series={quarterlySeries} stacking="stacked" label="Revenue and orders by quarter, stacked" showValueAxis showGrid valueFormat={{ kind: "compact" }} />
        </PreviewGroup>
        <PreviewGroup label="100% stacked">
          <BarChart data={quarterly} series={quarterlySeries} stacking="percent" label="Revenue and orders by quarter, share" showValueAxis showGrid />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Horizontal"
        description="orientation=&quot;horizontal&quot; runs the category axis vertically. The category axis has a fixed width, so long labels are not truncated or wrapped."
      >
        <PreviewGroup label="Sessions by channel">
          <BarChart data={channels} orientation="horizontal" label="Sessions by channel" showValueAxis showGrid tooltip height={220} />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
