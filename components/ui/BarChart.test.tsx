import { render, screen } from "@testing-library/react";
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
