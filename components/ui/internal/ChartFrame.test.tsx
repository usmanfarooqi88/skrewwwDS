import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Bar, BarChart as RechartsBarChart, XAxis } from "recharts";
import { ChartFrame } from "@/components/ui/internal/ChartFrame";
import { singleSeriesChartTable, type ChartTable } from "@/components/ui/internal/chart-data";

const data = [
  { label: "Jan", value: 58 },
  { label: "Feb", value: 95 },
  { label: "Mar", value: 76 },
];

const tabbableSelector =
  '[tabindex]:not([tabindex="-1"]), [role="application"], a[href], button, input, select, textarea, [contenteditable]';

function renderFrame(
  overrides: { table?: ChartTable; height?: number; chartProps?: Record<string, unknown>; chartData?: typeof data } = {},
) {
  return render(
    <ChartFrame
      label="Monthly signups"
      height={overrides.height ?? 160}
      table={overrides.table ?? singleSeriesChartTable(data)}
      className="custom-root"
    >
      <RechartsBarChart data={overrides.chartData ?? data} {...overrides.chartProps}>
        <XAxis dataKey="label" interval={0} />
        <Bar dataKey="value" isAnimationActive={false} />
      </RechartsBarChart>
    </ChartFrame>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChartFrame", () => {
  it("exposes the chart as a named image described by the data table, and applies className to the root", () => {
    const { container } = renderFrame();
    const img = screen.getByRole("img", { name: "Monthly signups" });
    const table = screen.getByRole("table");
    expect(img.getAttribute("aria-describedby")).toBe(table.id);
    expect(container.firstElementChild).toHaveClass("custom-root");
  });

  it("keeps the data table exposed to assistive technology: not aria-hidden, captioned, one row per datum", () => {
    renderFrame();
    // No `hidden: true` — the table must be reachable by the accessibility tree.
    const table = screen.getByRole("table");
    expect(table).toHaveAccessibleName("Monthly signups");
    expect(table).toHaveClass("sr-only");
    expect(table.closest('[aria-hidden="true"]')).toBeNull();
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(data.length + 1); // header row + one per datum
  });

  it("hides the visual from assistive tech and leaves no tabbable stop inside it", () => {
    const { container } = renderFrame();
    const visual = container.querySelector('[aria-hidden="true"]');
    expect(visual?.querySelector("svg")).not.toBeNull();
    expect(visual?.querySelectorAll(tabbableSelector)).toHaveLength(0);
  });

  it("forces the Recharts accessibility layer off even when the chart element asks for it", () => {
    const { container } = renderFrame({ chartProps: { accessibilityLayer: true } });
    const svg = container.querySelector("svg");
    expect(svg).not.toHaveAttribute("tabindex");
    expect(svg).not.toHaveAttribute("role");
    expect(container.querySelectorAll(tabbableSelector)).toHaveLength(0);
  });

  it("keeps a fluid width and applies the fixed height API", () => {
    const { container } = renderFrame({ height: 200 });
    const responsive = container.querySelector(".recharts-responsive-container") as HTMLElement;
    expect(responsive.style.width).toBe("100%");
    expect(responsive.style.height).toBe("200px");
  });

  it("renders every value column of a multi-value table without a public series prop", () => {
    renderFrame({
      table: {
        categoryHeader: "Month",
        valueHeaders: ["Income", "Expenses"],
        rows: [
          { category: "Jan", values: [10, 4] },
          { category: "Feb", values: [12, 6] },
        ],
      },
    });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader").map((h) => h.textContent)).toEqual([
      "Month",
      "Income",
      "Expenses",
    ]);
    expect(within(screen.getByRole("row", { name: /Feb/ })).getAllByRole("cell").map((c) => c.textContent)).toEqual([
      "12",
      "6",
    ]);
  });

  it("tolerates duplicate labels: one table row per datum and no React duplicate-key warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const duplicated = [
      { label: "Q1", value: 10 },
      { label: "Q1", value: 20 },
      { label: "Q2", value: 30 },
    ];
    renderFrame({ table: singleSeriesChartTable(duplicated), chartData: duplicated });
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(duplicated.length + 1);
    const keyWarnings = error.mock.calls.filter((call) => String(call[0]).includes("same key"));
    expect(keyWarnings).toEqual([]);
  });

  it("renders without throwing for empty data: a named image and a header-only table (current behavior, not a designed empty state)", () => {
    renderFrame({ table: singleSeriesChartTable([]), chartData: [] as unknown as typeof data });
    expect(screen.getByRole("img", { name: "Monthly signups" })).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(1);
  });

  it("renders a non-interactive legend inside the aria-hidden visual: names and markers, no controls, wrapping list", () => {
    const { container } = render(
      <ChartFrame
        label="Revenue vs orders"
        height={160}
        table={singleSeriesChartTable(data)}
        legend={[
          { label: "Revenue", colorVar: "var(--chart-series-1)", marker: "square" },
          { label: "Orders", colorVar: "var(--chart-series-2)", marker: "line" },
        ]}
      >
        <RechartsBarChart data={data}>
          <Bar dataKey="value" isAnimationActive={false} />
        </RechartsBarChart>
      </ChartFrame>,
    );
    const visual = container.querySelector('[aria-hidden="true"]') as HTMLElement;
    const items = visual.querySelectorAll("ul > li");
    expect(Array.from(items).map((item) => item.textContent)).toEqual(["Revenue", "Orders"]);
    expect(visual.querySelectorAll("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])")).toHaveLength(0);
    expect(screen.queryByRole("list")).toBeNull(); // hidden from the accessibility tree; table headers carry series names
  });

  it("omits the legend when none is provided", () => {
    const { container } = renderFrame();
    expect(container.querySelector("ul")).toBeNull();
  });

  it("reads a null table cell as No data so a missing value is never an ambiguous empty cell", () => {
    renderFrame({
      table: {
        categoryHeader: "Month",
        valueHeaders: ["Income", "Expenses"],
        rows: [{ category: "Jan", values: [10, null] }],
      },
    });
    expect(within(screen.getByRole("row", { name: /Jan/ })).getAllByRole("cell").map((cell) => cell.textContent)).toEqual([
      "10",
      "No data",
    ]);
  });
});
