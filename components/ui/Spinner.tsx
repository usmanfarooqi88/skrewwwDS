import { cn } from "@/lib/cn";
import styles from "@/components/ui/spinner.module.css";

export type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
  decorative?: boolean;
  className?: string;
};

const sizeClass: Record<SpinnerSize, string> = {
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
};

export function Spinner({
  size = "md",
  label = "Loading",
  decorative = false,
  className,
}: SpinnerProps) {
  const indicator = (
    <span
      className={cn(styles.spinner, sizeClass[size])}
      aria-hidden={decorative ? true : undefined}
    />
  );

  if (decorative) {
    return <span className={cn(styles.wrapper, className)}>{indicator}</span>;
  }

  return (
    <span className={cn(styles.wrapper, className)} role="status">
      {indicator}
      <span className="sr-only">{label}</span>
    </span>
  );
}
