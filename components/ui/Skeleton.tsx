import { cn } from "@/lib/cn";
import styles from "@/components/ui/skeleton.module.css";

export type SkeletonShape = "text" | "circle" | "rectangle";

export type SkeletonProps = {
  shape?: SkeletonShape;
  width?: string | number;
  height?: string | number;
  className?: string;
};

function toCssSize(value?: string | number): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

export function Skeleton({
  shape = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  const style = {
    width: toCssSize(width),
    height: toCssSize(height),
  };

  return (
    <span
      aria-hidden="true"
      className={cn(styles.skeleton, styles[shape], className)}
      style={style}
    />
  );
}

export type SkeletonLoadingProps = {
  loading: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
  skeleton: React.ReactNode;
  className?: string;
};

export function SkeletonLoading({
  loading,
  loadingLabel = "Loading content",
  children,
  skeleton,
  className,
}: SkeletonLoadingProps) {
  return (
    <div className={className} aria-busy={loading || undefined}>
      {loading ? (
        <>
          <span className="sr-only">{loadingLabel}</span>
          {skeleton}
        </>
      ) : (
        children
      )}
    </div>
  );
}
