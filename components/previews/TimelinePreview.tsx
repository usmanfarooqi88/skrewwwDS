"use client";

import { Timeline, type TimelineEntry } from "@/components/ui";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const events: TimelineEntry[] = [
  { title: "Order placed", timestamp: "Jan 3, 9:14 AM", description: "Order #48213 received." },
  {
    title: "Payment confirmed",
    timestamp: "Jan 3, 9:16 AM",
    description:
      "The customer's original order was flagged for manual review after the automated fraud detection system detected an unusual shipping address mismatch. A support representative confirmed the details directly with the customer before the charge was captured.",
    state: "highlighted",
  },
  { title: "Shipped", timestamp: "Jan 4, 11:02 AM", description: "Left the fulfillment center." },
  { title: "Delivered", timestamp: "Jan 6, 2:41 PM", description: "Left at front door." },
];

export function TimelinePreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Order status history"
        description="Default items use an outlined ring; Highlighted items use a larger solid dot. The connector line is suppressed purely by list position (only the last event), independent of state — and its length adapts to the longer, wrapping description in the second event."
      >
        <PreviewGroup label="Order #48213">
          <Timeline data={events} />
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
