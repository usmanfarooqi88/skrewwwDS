import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LineChart } from "@/components/ui/LineChart";

const sampleData = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

describe("LineChart", () => {
  it("renders one point marker per datum, positioned proportional to value (higher value = lower cy)", () => {
    const { container } = render(
      <LineChart data={sampleData} label="Monthly signups" height={160} />,
    );
    const dots = container.querySelectorAll(".recharts-line-dots circle");
    expect(dots).toHaveLength(sampleData.length);

    const cys = Array.from(dots).map((dot) => Number(dot.getAttribute("cy")));
    // SVG y grows downward, so the largest value (June, index 5) must have
    // the smallest cy, and the smallest value (Jan, index 0) the largest.
    expect(cys.indexOf(Math.min(...cys))).toBe(5);
    expect(cys.indexOf(Math.max(...cys))).toBe(0);

    // Feb (95) is higher-valued than Mar (76), so its point sits higher (smaller cy).
    expect(cys[1]).toBeLessThan(cys[2]);
  });

  it("renders a single continuous stroked path connecting all points", () => {
    const { container } = render(<LineChart data={sampleData} label="Monthly signups" />);
    const paths = container.querySelectorAll(".recharts-line-curve");
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveAttribute("stroke", "var(--line-chart-stroke)");
  });

  it("uses straight (linear) segments between points, matching the real Figma vector path — not a smoothed curve", () => {
    const { container } = render(<LineChart data={sampleData} label="Monthly signups" />);
    const d = container.querySelector(".recharts-line-curve")?.getAttribute("d") ?? "";
    // A linear polyline is only ever "M"/"L" commands. Any cubic/quadratic
    // curve command ("C"/"Q"/"S"/"T") would mean the curve type regressed
    // back to a smoothed spline, which the real Figma vector data (node
    // 2058:2560, confirmed via the Figma Plugin API) does not have.
    expect(d).toMatch(/^M/);
    expect(d).not.toMatch(/[CQST]/);
  });

  it("provides an accessible data table alternative with the correct label/value pairs", () => {
    render(<LineChart data={sampleData} label="Monthly signups" />);
    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveAccessibleName("Monthly signups");

    for (const datum of sampleData) {
      const row = screen.getByRole("row", { name: new RegExp(datum.label), hidden: true });
      expect(row).toHaveTextContent(String(datum.value));
    }
  });

  it("exposes the chart via role=img with an accessible name and describedby link to the table", () => {
    render(<LineChart data={sampleData} label="Monthly signups" />);
    const img = screen.getByRole("img", { name: "Monthly signups" });
    const table = screen.getByRole("table", { hidden: true });
    expect(img.getAttribute("aria-describedby")).toBe(table.id);
  });

  it("renders no axes, gridlines, or legend", () => {
    const { container } = render(<LineChart data={sampleData} label="Monthly signups" />);
    expect(container.querySelectorAll(".recharts-cartesian-axis")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-cartesian-grid")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-legend-wrapper")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(0);
  });

  it("defaults to rendering point-marker dots when sparkline is not set", () => {
    const { container } = render(<LineChart data={sampleData} label="Monthly signups" />);
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(sampleData.length);
  });

  it("sparkline=true suppresses point-marker dots and uses a thinner stroke", () => {
    const { container } = render(
      <LineChart data={sampleData} label="Monthly signups" sparkline height={40} />,
    );
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(0);
    const path = container.querySelector(".recharts-line-curve");
    expect(path).toHaveAttribute("stroke-width", "1.5");
  });

  it("sparkline mode still exposes the accessible data table and role=img name", () => {
    render(<LineChart data={sampleData} label="Monthly signups" sparkline />);
    expect(screen.getByRole("img", { name: "Monthly signups" })).toBeInTheDocument();
    expect(screen.getByRole("table", { hidden: true })).toHaveAccessibleName("Monthly signups");
  });

  it("has no tabbable stop or role=application inside the aria-hidden visual (tabindex=-1 Recharts layer groups are not tab stops)", () => {
    const { container } = render(<LineChart data={sampleData} label="Monthly signups" />);
    const hiddenVisual = container.querySelector('[aria-hidden="true"]');
    expect(hiddenVisual).not.toBeNull();
    expect(hiddenVisual?.querySelector("svg")).not.toBeNull();
    expect(
      hiddenVisual?.querySelectorAll(
        '[tabindex]:not([tabindex="-1"]), [role="application"], a[href], button, input, select, textarea, [contenteditable]',
      ),
    ).toHaveLength(0);
  });

  it("keeps one point and one table row per datum when labels repeat, without a React duplicate-key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const repeated = [
      { label: "Q1", value: 10 },
      { label: "Q1", value: 20 },
      { label: "Q2", value: 30 },
    ];
    const { container } = render(<LineChart data={repeated} label="Quarterly" />);
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(3);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(error.mock.calls.filter((call) => String(call[0]).includes("same key"))).toEqual([]);
    error.mockRestore();
  });

  it("sparkline mode has no tabbable stop inside the aria-hidden visual", () => {
    const { container } = render(<LineChart data={sampleData} label="Balance history" sparkline height={48} />);
    const hiddenVisual = container.querySelector('[aria-hidden="true"]');
    expect(hiddenVisual?.querySelector("svg")).not.toBeNull();
    expect(
      hiddenVisual?.querySelectorAll('[tabindex]:not([tabindex="-1"]), [role="application"]'),
    ).toHaveLength(0);
  });
});
