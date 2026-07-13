import { type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function ComponentPreview({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card elevation="flat" className={cn("overflow-visible", className)}>
      <div className="border-b border-ink-200 px-5 py-4">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-500">{description}</p>
        ) : null}
      </div>
      <div className="px-5 py-6">{children}</div>
    </Card>
  );
}

export function PreviewGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-wide text-ink-400">
        {label}
      </h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
