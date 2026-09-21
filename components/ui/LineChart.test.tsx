import { render, screen, within } from "@testing-library/react";
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
    expect(paths[0]).toHaveAttribute("stroke", "var(--chart-series-1)");
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

// ---- CH-2: multi-series, markers, axes, grid, tooltip, formatting ----

const multiData = [
  { label: "Jan", revenue: 60, orders: 40 },
  { label: "Feb", revenue: 90, orders: 30 },
  { label: "Mar", revenue: 75, orders: 55 },
  { label: "Apr", revenue: 110, orders: 45 },
];
const multiSeries = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
];
const noTabStop = '[tabindex]:not([tabindex="-1"]), [role="application"], a[href], button, input, select, textarea';

describe("LineChart — multiple series", () => {
  it("draws one linear line per series, each from its own color slot", () => {
    const { container } = render(<LineChart data={multiData} series={multiSeries} label="Revenue and orders" />);
    const curves = Array.from(container.querySelectorAll(".recharts-line-curve"));
    expect(curves).toHaveLength(2);
    expect(curves.map((curve) => curve.getAttribute("stroke"))).toEqual(["var(--chart-series-1)", "var(--chart-series-2)"]);
    curves.forEach((curve) => expect(curve.getAttribute("d")).not.toMatch(/[CQST]/));
  });

  it("draws hollow-ring markers per point per series, ringed in the series color, and can hide them", () => {
    const { container, rerender } = render(<LineChart data={multiData} series={multiSeries} label="x" />);
    const dots = Array.from(container.querySelectorAll(".recharts-line-dots circle"));
    expect(dots).toHaveLength(8);
    expect(dots[0].getAttribute("stroke")).toBe("var(--chart-series-1)");
    expect(dots[4].getAttribute("stroke")).toBe("var(--chart-series-2)");
    expect(dots[0].getAttribute("fill")).toBe("var(--chart-marker-fill)");
    rerender(<LineChart data={multiData} series={multiSeries} markers={false} label="x" />);
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(0);
  });

  it("exposes one hidden-table column per series in deterministic order", () => {
    render(<LineChart data={multiData} series={multiSeries} label="Revenue and orders" />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Label", "Revenue", "Orders"]);
    expect(within(table).getAllByRole("row").slice(1).map((row) => row.textContent)).toEqual(["Jan6040", "Feb9030", "Mar7555", "Apr11045"]);
  });

  it("shows a legend by default only for several series", () => {
    const multi = render(<LineChart data={multiData} series={multiSeries} label="x" />);
    expect(Array.from(multi.container.querySelectorAll("ul > li")).map((item) => item.textContent)).toEqual(["Revenue", "Orders"]);
    multi.unmount();
    const single = render(<LineChart data={multiData} series={[multiSeries[0]]} label="x" />);
    expect(single.container.querySelector("ul")).toBeNull();
  });

  it("leaves a gap in the line where a value is missing and reads it as No data in the table", () => {
    const gaps = [
      { label: "Jan", value: 5 },
      { label: "Feb", value: null },
      { label: "Mar", value: 8 },
    ];
    const { container } = render(<LineChart data={gaps} label="Gaps" />);
    const d = container.querySelector(".recharts-line-curve")?.getAttribute("d") ?? "";
    expect(d.match(/M/g)?.length ?? 0).toBeGreaterThan(1); // two separate segments, not one connected line
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(2);
    expect(within(screen.getByRole("row", { name: /Feb/ })).getByRole("cell")).toHaveTextContent("No data");
  });
});

describe("LineChart — axes, grid, tooltip and formatting", () => {
  it("adds axes and grid only when asked, keeping the Figma-example look by default", () => {
    const plain = render(<LineChart data={multiData} series={multiSeries} label="x" />);
    expect(plain.container.querySelectorAll(".recharts-cartesian-axis, .recharts-cartesian-grid")).toHaveLength(0);
    plain.unmount();
    const rich = render(<LineChart data={multiData} series={multiSeries} label="x" showCategoryAxis showValueAxis showGrid />);
    expect(rich.container.querySelectorAll(".recharts-cartesian-grid")).toHaveLength(1);
    expect(Array.from(rich.container.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((t) => t.textContent)).toEqual([
      "Jan",
      "Feb",
      "Mar",
      "Apr",
    ]);
    expect(rich.container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value").length).toBeGreaterThan(1);
  });

  it("formats value ticks and table cells with valueFormat, and date labels with labelFormat", () => {
    const dated = [
      { label: "2026-01-05", value: 0.25 },
      { label: "2026-01-12", value: 0.5 },
    ];
    const { container } = render(
      <LineChart
        data={dated}
        label="Rate"
        showCategoryAxis
        showValueAxis
        valueFormat={{ kind: "percent" }}
        labelFormat={{ kind: "date", granularity: "day" }}
      />,
    );
    const yTicks = Array.from(container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((t) => t.textContent);
    expect(yTicks.length).toBeGreaterThan(1);
    yTicks.forEach((tick) => expect(tick).toMatch(/%$/));
    expect(Array.from(container.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((t) => t.textContent)).toEqual(["Jan 5", "Jan 12"]);
    expect(within(screen.getByRole("row", { name: /Jan 12/ })).getByRole("cell")).toHaveTextContent("50%");
  });

  it("mounts the tooltip only when enabled", () => {
    const off = render(<LineChart data={multiData} series={multiSeries} label="x" />);
    expect(off.container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(0);
    off.unmount();
    const on = render(<LineChart data={multiData} series={multiSeries} label="x" tooltip />);
    expect(on.container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(1);
  });

  it("sparkline is a strictly compact mode: no markers, axes, grid, legend or tooltip even when requested", () => {
    const { container } = render(
      <LineChart
        data={multiData}
        series={multiSeries}
        label="Compact"
        sparkline
        legend
        tooltip
        showGrid
        showCategoryAxis
        showValueAxis
        height={48}
      />,
    );
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-cartesian-axis, .recharts-cartesian-grid, .recharts-tooltip-wrapper")).toHaveLength(0);
    expect(container.querySelector("ul")).toBeNull();
    container.querySelectorAll(".recharts-line-curve").forEach((curve) => expect(curve.getAttribute("stroke-width")).toBe("1.5"));
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("keeps the visual out of the keyboard tab order with every option on", () => {
    const { container } = render(
      <LineChart data={multiData} series={multiSeries} label="x" tooltip showGrid showCategoryAxis showValueAxis />,
    );
    expect(container.querySelectorAll(noTabStop)).toHaveLength(0);
  });
});
