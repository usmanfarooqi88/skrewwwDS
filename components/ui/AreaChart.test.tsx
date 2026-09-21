import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AreaChart } from "@/components/ui/AreaChart";

const sampleData = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
];
const multiData = [
  { label: "Jan", revenue: 60, orders: 40 },
  { label: "Feb", revenue: 90, orders: 30 },
  { label: "Mar", revenue: 75, orders: 55 },
];
const multiSeries = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
];
const noTabStop = '[tabindex]:not([tabindex="-1"]), [role="application"], a[href], button, input, select, textarea';

/** The y coordinate of the top edge of an area's stroke (smallest y in its "M/L" path). */
function topY(curve: Element): number {
  const numbers = (curve.getAttribute("d") ?? "").match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const ys = numbers.filter((_, index) => index % 2 === 1);
  return Math.min(...ys);
}

describe("AreaChart", () => {
  it("draws a single series as one translucent fill under a 2px linear stroke in the first color slot", () => {
    const { container } = render(<AreaChart data={sampleData} label="Monthly signups" height={200} />);
    const fill = container.querySelectorAll(".recharts-area-area");
    const stroke = container.querySelectorAll(".recharts-area-curve");
    expect(fill).toHaveLength(1);
    expect(stroke).toHaveLength(1);
    expect(stroke[0].getAttribute("stroke")).toBe("var(--chart-series-1)");
    expect(stroke[0].getAttribute("stroke-width")).toBe("2");
    expect(fill[0].getAttribute("fill")).toBe("var(--chart-series-1)");
    expect(Number(fill[0].getAttribute("fill-opacity"))).toBeLessThan(0.5);
    expect(stroke[0].getAttribute("d")).not.toMatch(/[CQST]/);
  });

  it("names the chart and exposes its data as a hidden table, like every Cartesian chart", () => {
    render(<AreaChart data={sampleData} label="Monthly signups" />);
    const img = screen.getByRole("img", { name: "Monthly signups" });
    const table = screen.getByRole("table");
    expect(img.getAttribute("aria-describedby")).toBe(table.id);
    expect(table).toHaveAccessibleName("Monthly signups");
    expect(within(table).getAllByRole("row")).toHaveLength(sampleData.length + 1);
  });

  it("shows the category axis by default and no value axis, grid, legend or tooltip", () => {
    const { container } = render(<AreaChart data={sampleData} label="x" />);
    expect(Array.from(container.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((t) => t.textContent)).toEqual(
      sampleData.map((datum) => datum.label),
    );
    expect(container.querySelectorAll(".recharts-yAxis, .recharts-cartesian-grid, .recharts-tooltip-wrapper")).toHaveLength(0);
    expect(container.querySelector("ul")).toBeNull();
  });

  it("overlaps several series by default, each from its own color slot, with a legend and a column per series in the table", () => {
    const { container } = render(<AreaChart data={multiData} series={multiSeries} label="Revenue and orders" />);
    const strokes = Array.from(container.querySelectorAll(".recharts-area-curve"));
    expect(strokes.map((stroke) => stroke.getAttribute("stroke"))).toEqual(["var(--chart-series-1)", "var(--chart-series-2)"]);
    expect(Array.from(container.querySelectorAll("ul > li")).map((item) => item.textContent)).toEqual(["Revenue", "Orders"]);
    expect(within(screen.getByRole("table")).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Label", "Revenue", "Orders"]);
  });

  it("stacks series when stacking is stacked: the second series sits on top of the first", () => {
    const overlapped = render(<AreaChart data={multiData} series={multiSeries} label="x" height={200} />);
    const [overlapFirst, overlapSecond] = Array.from(overlapped.container.querySelectorAll(".recharts-area-curve"));
    const overlappedGap = topY(overlapFirst) - topY(overlapSecond);
    overlapped.unmount();
    const stacked = render(<AreaChart data={multiData} series={multiSeries} stacking="stacked" label="x" height={200} />);
    const [first, second] = Array.from(stacked.container.querySelectorAll(".recharts-area-curve"));
    // Stacked, the second series' top edge rides above the first's; overlapped, it is below or level.
    expect(topY(second)).toBeLessThan(topY(first));
    expect(topY(first) - topY(second)).toBeGreaterThan(overlappedGap);
  });

  it("scales stacks to 100% when stacking is percent and labels the value axis in percentages", () => {
    const { container } = render(<AreaChart data={multiData} series={multiSeries} stacking="percent" showValueAxis label="Share" height={200} />);
    const ticks = Array.from(container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((tick) => tick.textContent);
    expect(ticks.length).toBeGreaterThan(1);
    ticks.forEach((tick) => expect(tick).toMatch(/%$/));
    expect(ticks).toContain("100%");
  });

  it("leaves a gap where a value is missing and reads it as No data", () => {
    const gaps = [
      { label: "Jan", value: 5 },
      { label: "Feb", value: null },
      { label: "Mar", value: 8 },
    ];
    const { container } = render(<AreaChart data={gaps} label="Gaps" />);
    expect((container.querySelector(".recharts-area-curve")?.getAttribute("d") ?? "").match(/M/g)?.length ?? 0).toBeGreaterThan(1);
    expect(within(screen.getByRole("row", { name: /Feb/ })).getByRole("cell")).toHaveTextContent("No data");
  });

  it("mounts axes, grid and tooltip only when enabled, and formats ticks with valueFormat", () => {
    const { container } = render(
      <AreaChart data={sampleData} label="x" showValueAxis showGrid tooltip valueFormat={{ kind: "compact" }} />,
    );
    expect(container.querySelectorAll(".recharts-cartesian-grid")).toHaveLength(1);
    expect(container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(1);
    expect(container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value").length).toBeGreaterThan(1);
  });

  it("keeps the visual out of the keyboard tab order in every mode", () => {
    for (const props of [{}, { stacking: "stacked" as const }, { stacking: "percent" as const, tooltip: true, showGrid: true, showValueAxis: true }]) {
      const { container, unmount } = render(<AreaChart data={multiData} series={multiSeries} label="x" {...props} />);
      expect(container.querySelectorAll(noTabStop)).toHaveLength(0);
      unmount();
    }
  });

  it("is safe for empty data and duplicate categories", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const empty = render(<AreaChart data={[]} label="Empty" />);
    expect(screen.getByRole("img", { name: "Empty" })).toBeInTheDocument();
    empty.unmount();
    const repeated = render(<AreaChart data={[{ label: "Q1", value: 1 }, { label: "Q1", value: 2 }]} label="Repeat" />);
    expect(repeated.container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(error.mock.calls.filter((call) => String(call[0]).includes("same key"))).toEqual([]);
    error.mockRestore();
  });
});
