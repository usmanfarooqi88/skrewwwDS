"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Skeleton, SkeletonLoading } from "@/components/ui/Skeleton";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

export function SkeletonPreview() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Live preview"
        description="Placeholder shapes that preserve layout while content loads."
      >
        <PreviewGroup label="Text / Circle / Rectangle">
          <div className="grid max-w-md gap-3">
            <Skeleton shape="rectangle" />
            <div className="flex items-center gap-3">
              <Skeleton shape="circle" />
              <div className="grid flex-1 gap-2">
                <Skeleton shape="text" width="70%" />
                <Skeleton shape="text" width="45%" />
              </div>
            </div>
          </div>
        </PreviewGroup>
      </ComponentPreview>

      <ComponentPreview title="Loading container">
        <SkeletonLoading
          loading={loading}
          loadingLabel="Loading card content"
          skeleton={
            <div className="rounded-lg border border-ink-200 p-4">
              <Skeleton shape="text" width="40%" />
              <Skeleton shape="text" width="100%" className="mt-3" />
              <Skeleton shape="text" width="85%" className="mt-2" />
            </div>
          }
        >
          <div className="rounded-lg border border-ink-200 p-4">
            <h3 className="font-medium text-ink-900">Loaded card title</h3>
            <p className="mt-2 text-sm text-ink-600">
              Real content replaces the skeleton once loading completes.
            </p>
          </div>
        </SkeletonLoading>
        <Button className="mt-4" size="sm" variant="secondary" onClick={() => setLoading((v) => !v)}>
          Toggle loading
        </Button>
        <p className="mt-4 text-sm text-ink-600">
          Skeleton shapes are aria-hidden. The loading region uses aria-busy and screen-reader loading
          text. Shimmer animation respects prefers-reduced-motion.
        </p>
      </ComponentPreview>
    </div>
  );
}
