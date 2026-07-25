"use client";

import { BankingAccountCard } from "@/components/ui/BankingAccountCard";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const balanceHistory = [
  { label: "Week 1", value: 4100 },
  { label: "Week 2", value: 4180 },
  { label: "Week 3", value: 4050 },
  { label: "Week 4", value: 4231 },
];

export function BankingAccountCardPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Account summary"
        description="Composes Card, Tag, Button, and Line Chart in sparkline mode for the balance-history trend."
      >
        <PreviewGroup label="Checking and savings">
          <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <BankingAccountCard
              accountName="Everyday Checking"
              accountType="Checking"
              balance="$4,231.09"
              balanceHistory={balanceHistory}
              balanceHistoryLabel="30-day balance history for Everyday Checking"
              actionLabel="View transactions"
              onAction={() => undefined}
            />
            <BankingAccountCard
              accountName="Rainy Day Fund"
              accountType="Savings"
              balance="$12,940.55"
              balanceHistory={[
                { label: "Week 1", value: 12500 },
                { label: "Week 2", value: 12680 },
                { label: "Week 3", value: 12820 },
                { label: "Week 4", value: 12940 },
              ]}
              balanceHistoryLabel="30-day balance history for Rainy Day Fund"
              actionLabel="View transactions"
              onAction={() => undefined}
            />
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Shape and surface inheritance">
        <PreviewGroup label="Pill shape + Flat surface">
          <div className="max-w-sm" data-skrewww-shape="pill" data-skrewww-surface="flat">
            <BankingAccountCard
              accountName="Everyday Checking"
              accountType="Checking"
              balance="$4,231.09"
              balanceHistory={balanceHistory}
              balanceHistoryLabel="30-day balance history for Everyday Checking"
              actionLabel="View transactions"
              onAction={() => undefined}
            />
          </div>
        </PreviewGroup>
        <PreviewGroup label="Glass surface">
          <div className="max-w-sm" data-skrewww-surface="glass">
            <BankingAccountCard
              accountName="Everyday Checking"
              accountType="Checking"
              balance="$4,231.09"
              balanceHistory={balanceHistory}
              balanceHistoryLabel="30-day balance history for Everyday Checking"
              actionLabel="View transactions"
              onAction={() => undefined}
            />
          </div>
        </PreviewGroup>
        <p className="mt-4 text-sm text-ink-600">
          Account Card sets no background-color or border-radius of its own — both modes above
          come entirely from Card&rsquo;s own <code>--surface-fill-default</code> and{" "}
          <code>--shape-radius-container</code> custom properties through the CSS cascade.
        </p>
      </ComponentPreview>
    </div>
  );
}
