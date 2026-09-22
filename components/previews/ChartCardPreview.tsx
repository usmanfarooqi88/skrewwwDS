"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChartCard, ChartMetric, LineChart } from "@/components/ui";
import { Tabs, TabsList, TabsPanel, TabsTrigger } from "@/components/ui/Tabs";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const trend = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
];

const ranges = [
  { value: "7d", label: "7D", data: [{ label: "Mon", value: 20 }, { label: "Tue", value: 32 }, { label: "Wed", value: 28 }, { label: "Thu", value: 40 }] },
  { value: "30d", label: "30D", data: trend },
  { value: "90d", label: "90D", data: [{ label: "Q1", value: 220 }, { label: "Q2", value: 260 }, { label: "Q3", value: 240 }] },
];

function StatesDemo() {
  const [state, setState] = useState<"ready" | "loading" | "empty" | "error">("ready");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["ready", "loading", "empty", "error"] as const).map((option) => (
          <Button key={option} size="sm" variant={state === option ? "primary" : "secondary"} onClick={() => setState(option)}>
            {option}
          </Button>
        ))}
      </div>
      <ChartCard
        title="Monthly signups"
        description="Last 4 months"
        state={state}
        emptyDescription="No signups recorded for this period."
        errorDescription="Something went wrong loading this chart."
        errorAction={
          <Button size="sm" variant="secondary" onClick={() => setState("ready")}>
            Retry
          </Button>
        }
      >
        <LineChart data={trend} label="Monthly signups" showCategoryAxis tooltip />
      </ChartCard>
    </div>
  );
}

export function ChartCardPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Simple chart card"
        description="Title, description, and a chart — no metric, no actions."
      >
        <PreviewGroup label="Default">
          <ChartCard title="Monthly signups" description="Last 4 months">
            <LineChart data={trend} label="Monthly signups" />
          </ChartCard>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Metric + chart"
        description="A Chart Metric composed into children, above the chart. There is no dedicated metric prop — placement is composition."
      >
        <PreviewGroup label="With a headline value and delta">
          <ChartCard title="Monthly signups">
            <ChartMetric label="Total" value="357" delta={{ direction: "up", value: "+12%", label: "vs prior period" }} />
            <LineChart data={trend} label="Monthly signups" />
          </ChartCard>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        testId="chart-card-preview-states"
        title="States"
        description='state="loading" | "empty" | "error" replaces children entirely — only one region renders at a time, and the card keeps the same minimum height (contentHeight) across every state.'
      >
        <StatesDemo />
      </ComponentPreview>

      <ComponentPreview
        testId="chart-card-preview-time-range"
        title="Time-range control (composition, not a canonical control)"
        description="Tabs in the actions slot, one TabsPanel per range, each with its own chart instance — the same composition Banking Balance Summary already uses. Chart Card does not ship a dedicated range-control component."
      >
        <PreviewGroup label="7D / 30D / 90D">
          <Tabs defaultValue="30d">
            <ChartCard
              title="Spending overview"
              actions={
                <TabsList aria-label="Spending overview time range">
                  {ranges.map((range) => (
                    <TabsTrigger key={range.value} value={range.value}>
                      {range.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              }
            >
              {ranges.map((range) => (
                <TabsPanel key={range.value} value={range.value}>
                  <LineChart data={range.data} label={`Spending overview — ${range.label}`} />
                </TabsPanel>
              ))}
            </ChartCard>
          </Tabs>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
