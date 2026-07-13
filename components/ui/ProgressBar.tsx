import { cn } from "@/lib/cn";
import styles from "@/components/ui/progress-bar.module.css";

export type ProgressBarVariant = "default" | "success" | "warning" | "danger";

export type ProgressBarProps = {
  value?: number;
  max?: number;
  label: string;
  showValue?: boolean;
  indeterminate?: boolean;
  variant?: ProgressBarVariant;
  className?: string;
};

export function ProgressBar({
  value = 0,
  max = 100,
  label,
  showValue = false,
  indeterminate = false,
  variant = "default",
  className,
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);

  return (
    <div className={cn(styles[variant], className)}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {showValue && !indeterminate ? (
          <span className={styles.valueText} aria-hidden="true">
            {percentage}%
          </span>
        ) : null}
      </div>

      {indeterminate ? (
        <div
          className={styles.indeterminate}
          role="progressbar"
          aria-label={label}
          aria-busy="true"
        >
          <span className={styles.indeterminateBar} aria-hidden="true" />
        </div>
      ) : (
        <progress
          className={styles.track}
          value={safeValue}
          max={safeMax}
          aria-label={label}
        />
      )}
    </div>
  );
}
