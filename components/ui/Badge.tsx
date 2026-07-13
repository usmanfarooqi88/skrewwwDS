import { cn } from "@/lib/cn";
import {
  CheckCircle,
  Info,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { FeedbackStatus } from "@/components/ui/internal/feedback-types";
import styles from "@/components/ui/badge.module.css";

export type BadgeVariant = "neutral" | "info" | "success" | "warning" | "error";
export type BadgeSize = "sm" | "md" | "lg";

export type BadgeProps = {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
  count?: number;
  countMax?: number;
  showStatusIcon?: boolean;
  leadingIcon?: React.ReactNode;
  className?: string;
};

const sizeClass: Record<BadgeSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

const variantClass: Record<BadgeVariant, string> = {
  neutral: styles.neutral,
  info: styles.info,
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
};

function formatCount(count: number, max: number): string {
  return count > max ? `${max}+` : String(count);
}

function getAccessibleCount(count: number, max: number): string {
  return count > max ? `More than ${max}` : String(count);
}

function statusFromVariant(variant: BadgeVariant): FeedbackStatus | null {
  if (variant === "neutral") return null;
  return variant;
}

function BadgeStatusIcon({
  status,
  className,
}: {
  status: FeedbackStatus;
  className?: string;
}) {
  const props = {
    className,
    weight: "fill" as const,
    "aria-hidden": true as const,
  };

  if (status === "error") return <WarningCircle {...props} />;
  if (status === "warning") return <Warning {...props} />;
  if (status === "success") return <CheckCircle {...props} />;
  return <Info {...props} />;
}

export function Badge({
  variant = "neutral",
  size = "md",
  children,
  count,
  countMax = 99,
  showStatusIcon = false,
  leadingIcon,
  className,
}: BadgeProps) {
  const status = statusFromVariant(variant);
  const isCountOnly = typeof count === "number" && !children;
  const visibleLabel = isCountOnly ? formatCount(count, countMax) : children;
  const accessibleCount =
    typeof count === "number" ? getAccessibleCount(count, countMax) : undefined;

  return (
    <span
      className={cn(styles.badge, sizeClass[size], variantClass[variant], className)}
    >
      {leadingIcon ? (
        <span className={styles.iconSlot} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : showStatusIcon && status ? (
        <BadgeStatusIcon status={status} className={cn(styles.iconSlot, styles.statusIcon)} />
      ) : null}
      {visibleLabel ? (
        <span className={cn(isCountOnly && styles.count)}>{visibleLabel}</span>
      ) : null}
      {accessibleCount && isCountOnly ? (
        <span className="sr-only">{accessibleCount}</span>
      ) : null}
    </span>
  );
}
