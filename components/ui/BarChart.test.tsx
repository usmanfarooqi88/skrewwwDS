import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BarChart } from "@/components/ui/BarChart";

const sampleData = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
  { label: "Apr", value: 128 },
  { label: "May", value: 108 },
  { label: "Jun", value: 140 },
];

describe("BarChart", () => {
  it("renders one bar per datum with heights proportional to value", () => {
    const { container } = render(
      <BarChart data={sampleData} label="Monthly signups" height={160} />,
    );
    const bars = container.querySelectorAll(".recharts-bar-rectangle path");
    expect(bars).toHaveLength(sampleData.length);

    // recharts renders each bar as "M x,y h w v h h -w Z" — the value after
    // "v" is the rectangle's pixel height.
    const heights = Array.from(bars).map((path) => {
      const d = path.getAttribute("d") ?? "";
      const match = d.match(/v (-?[\d.]+)/);
      return match ? Math.abs(Number(match[1])) : 0;
    });

    // Heights must scale linearly with the input values, not just be
    // ordered correctly — check each bar's height/value ratio matches the
    // tallest bar's (June, the largest value) within floating-point tolerance.
    const maxIndex = sampleData.findIndex((d) => d.value === Math.max(...sampleData.map((x) => x.value)));
    const unitHeight = heights[maxIndex] / sampleData[maxIndex].value;
    heights.forEach((h, i) => {
      expect(h / sampleData[i].value).toBeCloseTo(unitHeight, 1);
    });
    expect(heights.indexOf(Math.max(...heights))).toBe(5);
    expect(heights.indexOf(Math.min(...heights))).toBe(0);
  });

  it("provides an accessible data table alternative with the correct label/value pairs", () => {
    render(<BarChart data={sampleData} label="Monthly signups" />);
    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveAccessibleName("Monthly signups");

    for (const datum of sampleData) {
      const row = screen.getByRole("row", { name: new RegExp(datum.label), hidden: true });
      expect(row).toHaveTextContent(String(datum.value));
    }
  });

  it("exposes the chart via role=img with an accessible name and describedby link to the table", () => {
    render(<BarChart data={sampleData} label="Monthly signups" />);
    const img = screen.getByRole("img", { name: "Monthly signups" });
    const table = screen.getByRole("table", { hidden: true });
    expect(img.getAttribute("aria-describedby")).toBe(table.id);
  });

  it("renders every supplied category label on the x-axis", () => {
    const { container } = render(<BarChart data={sampleData} label="Monthly signups" />);
    const tickText = container.querySelectorAll(".recharts-xAxis .recharts-cartesian-axis-tick");
    expect(tickText).toHaveLength(sampleData.length);
    for (const datum of sampleData) {
      expect(container.textContent).toContain(datum.label);
    }
  });

  it("renders no y-axis, gridlines, legend, or tooltip", () => {
    const { container } = render(<BarChart data={sampleData} label="Monthly signups" />);
    expect(container.querySelectorAll(".recharts-yAxis")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-cartesian-grid")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-legend-wrapper")).toHaveLength(0);
    expect(container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(0);
  });

  it("has no tabbable stop or role=application inside the aria-hidden visual (tabindex=-1 Recharts layer groups are not tab stops)", () => {
    const { container } = render(<BarChart data={sampleData} label="Monthly signups" />);
    const hiddenVisual = container.querySelector('[aria-hidden="true"]');
    expect(hiddenVisual).not.toBeNull();
    expect(hiddenVisual?.querySelector("svg")).not.toBeNull();
    expect(
      hiddenVisual?.querySelectorAll(
        '[tabindex]:not([tabindex="-1"]), [role="application"], a[href], button, input, select, textarea, [contenteditable]',
      ),
    ).toHaveLength(0);
  });

  it("keeps one bar and one table row per datum when labels repeat, without a React duplicate-key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const repeated = [
      { label: "Q1", value: 10 },
      { label: "Q1", value: 20 },
      { label: "Q2", value: 30 },
    ];
    const { container } = render(<BarChart data={repeated} label="Quarterly" />);
    expect(container.querySelectorAll(".recharts-bar-rectangle path")).toHaveLength(3);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(error.mock.calls.filter((call) => String(call[0]).includes("same key"))).toEqual([]);
    error.mockRestore();
  });
});

// ---- CH-2: multi-series, orientation, stacking, axes, grid, tooltip, formatting ----

const seriesData = [
  { label: "Jan", revenue: 60, orders: 40 },
  { label: "Feb", revenue: 90, orders: 30 },
  { label: "Mar", revenue: 75, orders: 55 },
];
const twoSeries = [
  { key: "revenue", label: "Revenue" },
  { key: "orders", label: "Orders" },
];

type Rect = { x: number; y: number; w: number; h: number };

function rects(container: HTMLElement): Rect[] {
  return Array.from(container.querySelectorAll(".recharts-bar-rectangle path")).map((path) => {
    const d = path.getAttribute("d") ?? "";
    const match = d.match(/M\s*(-?[\d.]+),\s*(-?[\d.]+)\s*h\s*(-?[\d.]+)\s*v\s*(-?[\d.]+)/);
    if (!match) throw new Error(`Unparseable bar path: ${d}`);
    return { x: Number(match[1]), y: Number(match[2]), w: Number(match[3]), h: Number(match[4]) };
  });
}

const noTabStop = '[tabindex]:not([tabindex="-1"]), [role="application"], a[href], button, input, select, textarea';

describe("BarChart — multi-series and stacking", () => {
  it("groups series side by side by default: one bar per category per series, distinct x positions", () => {
    const { container } = render(<BarChart data={seriesData} series={twoSeries} label="Revenue and orders" height={200} />);
    const bars = rects(container);
    expect(bars).toHaveLength(6);
    expect(new Set(bars.map((bar) => bar.x)).size).toBe(6);
  });

  it("colors each series from its own token slot", () => {
    const { container } = render(<BarChart data={seriesData} series={twoSeries} label="Revenue and orders" />);
    const fills = Array.from(container.querySelectorAll(".recharts-bar")).map((group) =>
      group.querySelector(".recharts-bar-rectangle path")?.getAttribute("fill"),
    );
    expect(fills).toEqual(["var(--chart-series-1)", "var(--chart-series-2)"]);
  });

  it("stacks series into one column per category when stacking is stacked", () => {
    const { container } = render(<BarChart data={seriesData} series={twoSeries} stacking="stacked" label="Stacked" height={200} />);
    const bars = rects(container);
    expect(bars).toHaveLength(6);
    expect(new Set(bars.map((bar) => bar.x)).size).toBe(3);
    // Jan: revenue (60) and orders (40) stack to 100, so the two bars' heights sum to the tallest stack scale.
    const [jan] = [bars[0], bars[3]];
    expect(jan.h + bars[3].h).toBeGreaterThan(Math.max(bars[1].h, bars[0].h));
  });

  it("scales every category to the same full height when stacking is percent, and labels the value axis in percentages", () => {
    const { container } = render(
      <BarChart data={seriesData} series={twoSeries} stacking="percent" showValueAxis label="Share" height={200} />,
    );
    const bars = rects(container);
    const totals = [0, 1, 2].map((index) => Math.abs(bars[index].h) + Math.abs(bars[index + 3].h));
    totals.forEach((total) => expect(total).toBeCloseTo(totals[0], 1));
    const ticks = Array.from(container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((tick) => tick.textContent);
    expect(ticks.length).toBeGreaterThan(1);
    ticks.forEach((tick) => expect(tick).toMatch(/%$/));
    expect(ticks).toContain("100%");
  });

  it("draws horizontal bars that grow along x, with the category labels on the y axis", () => {
    const { container } = render(<BarChart data={sampleData} orientation="horizontal" label="Signups" height={240} />);
    const bars = rects(container);
    expect(bars).toHaveLength(sampleData.length);
    const widths = bars.map((bar) => Math.abs(bar.w));
    expect(widths.indexOf(Math.max(...widths))).toBe(5); // June is the largest value
    expect(widths.indexOf(Math.min(...widths))).toBe(0);
    const labels = Array.from(container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((tick) => tick.textContent);
    expect(labels).toEqual(sampleData.map((datum) => datum.label));
    expect(container.querySelectorAll(".recharts-xAxis")).toHaveLength(0);
  });

  it("exposes one hidden-table column per series with deterministic headers and row order", () => {
    render(<BarChart data={seriesData} series={twoSeries} label="Revenue and orders" />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Label", "Revenue", "Orders"]);
    expect(within(table).getAllByRole("row").slice(1).map((row) => row.textContent)).toEqual(["Jan6040", "Feb9030", "Mar7555"]);
  });

  it("shows a legend for several series by default and can be turned off, or on for a single series", () => {
    const { container, rerender } = render(<BarChart data={seriesData} series={twoSeries} label="x" />);
    expect(Array.from(container.querySelectorAll("ul > li")).map((item) => item.textContent)).toEqual(["Revenue", "Orders"]);
    rerender(<BarChart data={seriesData} series={twoSeries} legend={false} label="x" />);
    expect(container.querySelector("ul")).toBeNull();
    rerender(<BarChart data={sampleData} legend label="x" />);
    expect(Array.from(container.querySelectorAll("ul > li")).map((item) => item.textContent)).toEqual(["Value"]);
  });

  it("keeps the visual out of the keyboard tab order in every mode", () => {
    for (const props of [
      { orientation: "horizontal" as const },
      { stacking: "stacked" as const, tooltip: true, showGrid: true, showValueAxis: true },
      { stacking: "percent" as const },
    ]) {
      const { container, unmount } = render(<BarChart data={seriesData} series={twoSeries} label="x" {...props} />);
      expect(container.querySelectorAll(noTabStop)).toHaveLength(0);
      unmount();
    }
  });
});

describe("BarChart — axes, grid, tooltip and formatting", () => {
  it("adds grid lines and a value axis only when asked, keeping the default static look otherwise", () => {
    const plain = render(<BarChart data={sampleData} label="x" />);
    expect(plain.container.querySelectorAll(".recharts-cartesian-grid, .recharts-yAxis")).toHaveLength(0);
    plain.unmount();
    const rich = render(<BarChart data={sampleData} label="x" showGrid showValueAxis />);
    expect(rich.container.querySelectorAll(".recharts-cartesian-grid")).toHaveLength(1);
    expect(rich.container.querySelectorAll(".recharts-yAxis")).toHaveLength(1);
  });

  it("mounts the tooltip only when enabled", () => {
    const off = render(<BarChart data={sampleData} label="x" />);
    expect(off.container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(0);
    off.unmount();
    const on = render(<BarChart data={sampleData} label="x" tooltip />);
    expect(on.container.querySelectorAll(".recharts-tooltip-wrapper")).toHaveLength(1);
  });

  it("formats value-axis ticks and hidden-table cells with valueFormat", () => {
    const { container } = render(
      <BarChart data={sampleData} label="Revenue" showValueAxis valueFormat={{ kind: "currency", currency: "USD", maximumFractionDigits: 0 }} />,
    );
    const ticks = Array.from(container.querySelectorAll(".recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((tick) => tick.textContent);
    expect(ticks.length).toBeGreaterThan(1);
    ticks.forEach((tick) => expect(tick).toMatch(/^\$/));
    expect(within(screen.getByRole("row", { name: /Jan/ })).getByRole("cell")).toHaveTextContent("$58");
  });

  it("formats normalized date labels on the axis and in the table with labelFormat", () => {
    const dated = [
      { label: "2026-01", value: 5 },
      { label: "2026-02", value: 8 },
    ];
    const { container } = render(<BarChart data={dated} label="Monthly" labelFormat={{ kind: "date", granularity: "month" }} />);
    expect(Array.from(container.querySelectorAll(".recharts-xAxis-tick-labels .recharts-cartesian-axis-tick-value")).map((tick) => tick.textContent)).toEqual([
      "Jan 2026",
      "Feb 2026",
    ]);
    expect(screen.getByRole("row", { name: /Jan 2026/ })).toBeInTheDocument();
  });

  it("draws no bar for a missing value and reads it as No data in the table", () => {
    const gaps = [
      { label: "Jan", revenue: 10, orders: null },
      { label: "Feb", revenue: 20, orders: 5 },
    ];
    const { container } = render(<BarChart data={gaps} series={twoSeries} label="x" />);
    expect(rects(container)).toHaveLength(3);
    expect(within(screen.getByRole("row", { name: /Jan/ })).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["10", "No data"]);
  });

  it("draws a baseline only when a value is negative", () => {
    const positive = render(<BarChart data={sampleData} label="x" />);
    expect(positive.container.querySelectorAll(".recharts-reference-line")).toHaveLength(0);
    positive.unmount();
    const negative = render(<BarChart data={[{ label: "Gain", value: 5 }, { label: "Loss", value: -4 }]} label="x" />);
    expect(negative.container.querySelectorAll(".recharts-reference-line")).toHaveLength(1);
  });

  it("is safe for empty data and duplicate categories", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const empty = render(<BarChart data={[]} label="Empty" />);
    expect(screen.getByRole("img", { name: "Empty" })).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(1);
    empty.unmount();
    const repeated = render(<BarChart data={[{ label: "Q1", value: 1 }, { label: "Q1", value: 2 }]} label="Repeat" />);
    expect(repeated.container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(error.mock.calls.filter((call) => String(call[0]).includes("same key"))).toEqual([]);
    error.mockRestore();
  });
});
