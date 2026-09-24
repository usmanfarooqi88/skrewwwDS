"use client";

import { LineChart } from "@/components/ui/LineChart";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const monthlySignups = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

const revenueTrend = [
  { label: "2026-01", revenue: 12000, orders: 80 },
  { label: "2026-02", revenue: 15000, orders: 95 },
  { label: "2026-03", revenue: 13500, orders: 110 },
  { label: "2026-04", revenue: 17000, orders: 120 },
  { label: "2026-05", revenue: 16200, orders: 130 },
];

const balanceHistory = [
  { label: "Week 1", value: 4200 },
  { label: "Week 2", value: 4650 },
  { label: "Week 3", value: 4400 },
  { label: "Week 4", value: 5100 },
];

export function LineChartPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Monthly signups trend"
        description="Single-series, static line chart — a single stroked path with hollow-ring point markers. With no extra props there are no axes, gridlines, legend or tooltip. The underlying data is also available to assistive tech via a visually-hidden table."
      >
        <PreviewGroup label="Signups trend by month">
          <LineChart data={monthlySignups} label="Monthly signups trend" />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Multiple series"
        description="Pass series and rows keyed by series. Axes, grid, legend and tooltip are opt-in; per-series and chart-level formats apply to the tooltip, the value axis and the hidden table, and date labels are formatted from normalized ISO strings."
      >
        <PreviewGroup label="Revenue and orders">
          <LineChart
            data={revenueTrend}
            label="Revenue and orders by month"
            series={[
              { key: "revenue", label: "Revenue", format: { kind: "currency", currency: "USD", maximumFractionDigits: 0 } },
              { key: "orders", label: "Orders" },
            ]}
            showCategoryAxis
            showValueAxis
            showGrid
            tooltip
            labelFormat={{ kind: "date", granularity: "month" }}
          />
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Sparkline"
        description="sparkline is a compact inline treatment: no markers, a thinner stroke, and no axes, grid, legend or tooltip. Size it with height."
      >
        <PreviewGroup label="Balance history">
          <div style={{ width: 200 }}>
            <LineChart data={balanceHistory} label="Balance history sparkline" sparkline height={48} />
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
