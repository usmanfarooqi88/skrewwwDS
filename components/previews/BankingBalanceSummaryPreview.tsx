"use client";

import { useState } from "react";
import { BankingBalanceSummary, type BankingSpendingRange } from "@/components/ui/BankingBalanceSummary";
import { Button } from "@/components/ui/Button";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const ranges: BankingSpendingRange[] = [
  {
    value: "7d",
    label: "7D",
    data: [
      { label: "Mon", value: 42 },
      { label: "Tue", value: 88 },
      { label: "Wed", value: 61 },
      { label: "Thu", value: 120 },
      { label: "Fri", value: 96 },
      { label: "Sat", value: 210 },
      { label: "Sun", value: 54 },
    ],
  },
  {
    value: "30d",
    label: "30D",
    data: [
      { label: "Week 1", value: 320 },
      { label: "Week 2", value: 410 },
      { label: "Week 3", value: 298 },
      { label: "Week 4", value: 256 },
    ],
  },
  {
    value: "90d",
    label: "90D",
    data: [
      { label: "Month 1", value: 1284 },
      { label: "Month 2", value: 1490 },
      { label: "Month 3", value: 1102 },
    ],
  },
];

export function BankingBalanceSummaryPreview() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Spending overview"
        description="Each time-range tab owns its own Bar Chart data — switching tabs swaps the visualization, not just the axis scale."
      >
        <PreviewGroup label="7D / 30D / 90D">
          <div className="max-w-lg">
            <BankingBalanceSummary
              title="Spending overview"
              totalLabel="Total spent"
              total="$1,284.32"
              ranges={ranges}
            />
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview
        title="Loading state"
        description="Composes the existing Skeleton/SkeletonLoading primitives — no new loading-state pattern."
      >
        <PreviewGroup label="Toggle loading">
          <div className="max-w-lg space-y-3">
            <Button type="button" size="sm" variant="secondary" onClick={() => setLoading((v) => !v)}>
              {loading ? "Show content" : "Show loading state"}
            </Button>
            <BankingBalanceSummary
              title="Spending overview"
              totalLabel="Total spent"
              total="$1,284.32"
              ranges={ranges}
              loading={loading}
            />
          </div>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
