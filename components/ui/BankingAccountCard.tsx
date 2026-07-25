import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { LineChart, type LineChartDatum } from "@/components/ui/LineChart";
import styles from "@/components/ui/banking-account-card.module.css";

export type BankingAccountCardProps = {
  accountName: string;
  /** e.g. "Checking", "Savings", "Credit" — shown as a Tag, not a new badge/label primitive. */
  accountType: string;
  /** Pre-formatted balance string (e.g. "$4,231.09") — currency formatting is the consumer's responsibility. */
  balance: string;
  /** Recent balance history for the sparkline — same shape as LineChart's own data prop. */
  balanceHistory: LineChartDatum[];
  /** Accessible name for the sparkline chart (e.g. "30-day balance history for Everyday Checking"). */
  balanceHistoryLabel: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
};

/**
 * Composes Card (surface shell), Tag (account type), Button (action
 * trigger), and Line Chart in sparkline mode (balance history) — the
 * second Layer 4 Banking pilot component. React-first; no Figma reference
 * exists for Industry Systems yet.
 *
 * Surface/Shape inheritance: this component owns no background-color or
 * border-radius of its own anywhere in its stylesheet — every visual
 * surface property comes from Card's own `--surface-fill-default` /
 * `--shape-radius-container` custom properties, so switching the global
 * (or a locally scoped) `data-skrewww-surface`/`data-skrewww-shape`
 * attribute repaints Account Card automatically through the CSS cascade,
 * with no JS involved. Verified live in Glass surface + Pill shape mode
 * (see the "Shape and surface" demo in BankingAccountCardPreview and the
 * Playwright coverage) rather than assumed from Card's own behavior.
 */
export function BankingAccountCard({
  accountName,
  accountType,
  balance,
  balanceHistory,
  balanceHistoryLabel,
  actionLabel,
  onAction,
  className,
}: BankingAccountCardProps) {
  return (
    <Card
      title={accountName}
      className={className}
      footer={
        <Button size="sm" variant="secondary" onClick={onAction} className={styles.action}>
          {actionLabel}
        </Button>
      }
    >
      <div className={styles.typeRow}>
        <Tag>{accountType}</Tag>
      </div>
      <p className={styles.balance}>{balance}</p>
      <div className={styles.sparkline}>
        <LineChart data={balanceHistory} label={balanceHistoryLabel} sparkline height={48} />
      </div>
    </Card>
  );
}
