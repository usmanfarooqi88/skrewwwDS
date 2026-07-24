import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Timeline, type TimelineEntry } from "@/components/ui/Timeline";

function getConnectors(container: HTMLElement) {
  return container.querySelectorAll('[class*="connector"]');
}

function getMarkers(container: HTMLElement) {
  return container.querySelectorAll('[class*="markerColumn"] > [class*="marker"]');
}

describe("Timeline", () => {
  it("renders nothing for an empty data array (no established empty-state convention exists elsewhere in this codebase)", () => {
    const { container } = render(<Timeline data={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders a single default item with no connector, regardless of it being the only item", () => {
    const data: TimelineEntry[] = [
      { title: "Order placed", timestamp: "Jan 1", description: "The order was placed." },
    ];
    const { container } = render(<Timeline data={data} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(getConnectors(container)).toHaveLength(0);
  });

  it("renders a single highlighted item with no connector — being first-and-last overrides state", () => {
    const data: TimelineEntry[] = [
      { title: "Delivered", timestamp: "Jan 5", description: "Package delivered.", state: "highlighted" },
    ];
    const { container } = render(<Timeline data={data} />);
    expect(getConnectors(container)).toHaveLength(0);
    expect(getMarkers(container)[0]).toHaveClass(/markerHighlighted/);
  });

  it("with multiple default items, only the last (positionally) lacks a connector", () => {
    const data: TimelineEntry[] = [
      { title: "Order placed", timestamp: "Jan 1", description: "Step one." },
      { title: "Processing", timestamp: "Jan 2", description: "Step two." },
      { title: "Shipped", timestamp: "Jan 3", description: "Step three." },
    ];
    const { container } = render(<Timeline data={data} />);
    // 3 items, 2 connectors (every item except the last one).
    expect(getConnectors(container)).toHaveLength(2);
  });

  it("suppresses the connector on a default (non-highlighted) last item purely by position, not by state", () => {
    // Critical case: the last item here is explicitly "default", not
    // "highlighted" — an implementation that couples connector visibility
    // to state === "highlighted" instead of actual list position would
    // incorrectly render a connector after this item (there is none, since
    // it's the last), or fail to suppress a connector on an earlier
    // highlighted item (checked separately below).
    const data: TimelineEntry[] = [
      { title: "Order placed", timestamp: "Jan 1", description: "Step one.", state: "highlighted" },
      { title: "Delivered", timestamp: "Jan 3", description: "Final step.", state: "default" },
    ];
    const { container } = render(<Timeline data={data} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    // Exactly one connector: after the first (highlighted, not last) item.
    expect(getConnectors(container)).toHaveLength(1);
    // The connector lives inside the first item, not the second (last).
    expect(items[0].querySelector('[class*="connector"]')).not.toBeNull();
    expect(items[1].querySelector('[class*="connector"]')).toBeNull();
  });

  it("renders a highlighted item in the middle with its connector intact — state and isLast are independent", () => {
    const data: TimelineEntry[] = [
      { title: "Order placed", timestamp: "Jan 1", description: "Step one." },
      { title: "Payment confirmed", timestamp: "Jan 2", description: "Step two.", state: "highlighted" },
      { title: "Delivered", timestamp: "Jan 3", description: "Step three." },
    ];
    const { container } = render(<Timeline data={data} />);
    const items = screen.getAllByRole("listitem");
    const markers = getMarkers(container);

    expect(markers[1]).toHaveClass(/markerHighlighted/);
    // The middle item is not last, so it still has a connector.
    expect(items[1].querySelector('[class*="connector"]')).not.toBeNull();
    // Only the actual last item (index 2) lacks one.
    expect(items[2].querySelector('[class*="connector"]')).toBeNull();
    expect(getConnectors(container)).toHaveLength(2);
  });

  it("does not truncate a long title or timestamp — full text renders, matching Alert/Card (which don't truncate), not List Item's denser row precedent", () => {
    const longTitle =
      "Order escalated to tier-two support after the third automated retry attempt failed validation";
    const longTimestamp = "January 3rd, 2026 at 4:32:07 PM Pacific Standard Time";
    const data: TimelineEntry[] = [
      { title: longTitle, timestamp: longTimestamp, description: "Details." },
    ];
    render(<Timeline data={data} />);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
    expect(screen.getByText(longTimestamp)).toBeInTheDocument();
  });

  it("renders a long, multi-paragraph description in full (natural wrapping, no truncation) with the connector still present", () => {
    const longDescription =
      "The customer's original order was flagged for manual review after the automated fraud " +
      "detection system detected an unusual shipping address mismatch. A support representative " +
      "contacted the customer directly to confirm the details, and after verification, the order " +
      "was released for fulfillment. This entire process took considerably longer than a typical " +
      "single-line event description, which is the point of this test case.";
    const data: TimelineEntry[] = [
      { title: "Order flagged", timestamp: "Jan 2", description: longDescription },
      { title: "Order released", timestamp: "Jan 4", description: "Released for fulfillment." },
    ];
    const { container } = render(<Timeline data={data} />);
    expect(screen.getByText(longDescription)).toBeInTheDocument();
    // The connector after the long-description item must still exist —
    // its length is computed via CSS (flex: 1 filling the grid row's
    // stretched height), not a fixed pixel value, so a taller row must
    // not cause the connector to be omitted or miscomputed.
    const items = screen.getAllByRole("listitem");
    expect(items[0].querySelector('[class*="connector"]')).not.toBeNull();
    expect(items[1].querySelector('[class*="connector"]')).toBeNull();
  });
});
