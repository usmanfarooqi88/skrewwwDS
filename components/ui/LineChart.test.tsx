import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
