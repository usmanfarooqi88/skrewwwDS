import { Card } from "@/components/ui/Card";
import { BarChart, type BarChartDatum } from "@/components/ui/BarChart";
import { Tabs, TabsList, TabsTrigger, TabsPanel } from "@/components/ui/Tabs";
import { Skeleton, SkeletonLoading } from "@/components/ui/Skeleton";
import styles from "@/components/ui/banking-balance-summary.module.css";

export type BankingSpendingRange = {
  /** Tabs value — e.g. "7d", "30d", "90d". */
  value: string;
  /** Visible tab label — e.g. "7D", "30D", "90D". */
  label: string;
  data: BarChartDatum[];
};

export type BankingBalanceSummaryProps = {
  /** Card title, e.g. "Spending overview". */
  title: string;
  totalLabel: string;
  /** Pre-formatted total figure (e.g. "$1,284.32") — currency formatting is the consumer's responsibility. */
  total: string;
  ranges: BankingSpendingRange[];
  /** Defaults to the first range's value when omitted. */
  defaultRange?: string;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
};

/**
 * Composes Card (layout wrapper), Bar Chart (spending/income
 * visualization), Tabs (time-range filter), and Skeleton (loading state)
 * — the third Layer 4 Banking pilot component. React-first; no Figma
 * reference exists for Industry Systems yet.
 *
 * Each time range owns its own Bar Chart instance inside its own
 * TabsPanel (matching how real spending data differs by range, not just
 * a re-scaled view of one dataset) — no custom canvas or raw wrapper
 * divs, every visual piece is an existing Layer 2 primitive.
 */
export function BankingBalanceSummary({
  title,
  totalLabel,
  total,
  ranges,
  defaultRange,
  loading = false,
  loadingLabel = "Loading spending summary",
  className,
}: BankingBalanceSummaryProps) {
  const firstRangeValue = ranges[0]?.value ?? "";

  return (
    <Card title={title} className={className}>
      <SkeletonLoading
        loading={loading}
        loadingLabel={loadingLabel}
        skeleton={
          <div className={styles.skeletonGroup}>
            <Skeleton shape="text" width="40%" height={28} />
            <Skeleton shape="rectangle" width="100%" height={160} />
          </div>
        }
      >
        <p className={styles.total}>
          <span className={styles.totalLabel}>{totalLabel}</span>
          <span className={styles.totalValue}>{total}</span>
        </p>
        <Tabs defaultValue={defaultRange ?? firstRangeValue}>
          <TabsList aria-label={`${title} time range`}>
            {ranges.map((range) => (
              <TabsTrigger key={range.value} value={range.value}>
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {ranges.map((range) => (
            <TabsPanel key={range.value} value={range.value}>
              <BarChart data={range.data} label={`${title} — ${range.label}`} height={200} />
            </TabsPanel>
          ))}
        </Tabs>
      </SkeletonLoading>
    </Card>
  );
}
