import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartTooltip } from "@/components/ui/internal/ChartTooltip";
import { resolveChartSeries } from "@/components/ui/internal/chart-data";

const series = resolveChartSeries([
  { key: "revenue", label: "Revenue", format: { kind: "currency", currency: "USD", maximumFractionDigits: 0 } },
  { key: "orders", label: "Orders" },
]);

describe("ChartTooltip", () => {
  it("renders nothing when inactive or without payload", () => {
    const { container, rerender } = render(<ChartTooltip series={series} active={false} label="Jan" payload={[{ dataKey: "revenue", value: 1 }]} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ChartTooltip series={series} active label="Jan" payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the label and one named, formatted row per series in declared order (not payload order)", () => {
    render(
      <ChartTooltip
        series={series}
        active
        label="Jan"
        payload={[
          { dataKey: "orders", value: 30 },
          { dataKey: "revenue", value: 1200 },
        ]}
      />,
    );
    expect(screen.getByText("Jan")).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual(["Revenue$1,200", "Orders30"]);
  });

  it("names every series in text so identity never depends on color alone, and hides the decorative marker", () => {
    const { container } = render(<ChartTooltip series={series} active label="Jan" payload={[{ dataKey: "revenue", value: 5 }]} />);
    const markers = container.querySelectorAll('[aria-hidden="true"]');
    expect(markers).toHaveLength(series.length);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("reads missing values as No data and formats the label with labelFormat", () => {
    render(
      <ChartTooltip
        series={series}
        active
        label="2026-03"
        labelFormat={{ kind: "date", granularity: "month" }}
        payload={[{ dataKey: "revenue", value: null }]}
      />,
    );
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
    expect(within(screen.getAllByRole("listitem")[0]).getByText("No data")).toBeInTheDocument();
  });

  it("uses the chart-level valueFormat for series without their own and renders no focusable content", () => {
    const plain = resolveChartSeries([{ key: "value", label: "Share" }]);
    const { container } = render(
      <ChartTooltip series={plain} valueFormat={{ kind: "percent" }} active label="A" payload={[{ dataKey: "value", value: 0.25 }]} />,
    );
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(container.querySelectorAll('[tabindex], a, button, input, select, textarea')).toHaveLength(0);
  });
});
