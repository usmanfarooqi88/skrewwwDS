import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BankingBalanceSummary, type BankingSpendingRange } from "@/components/ui/BankingBalanceSummary";

const ranges: BankingSpendingRange[] = [
  {
    value: "7d",
    label: "7D",
    data: [
      { label: "Mon", value: 42 },
      { label: "Tue", value: 88 },
    ],
  },
  {
    value: "30d",
    label: "30D",
    data: [
      { label: "Week 1", value: 320 },
      { label: "Week 2", value: 410 },
    ],
  },
];

function renderSummary(overrides: Partial<Parameters<typeof BankingBalanceSummary>[0]> = {}) {
  return render(
    <BankingBalanceSummary
      title="Spending overview"
      totalLabel="Total spent"
      total="$1,284.32"
      ranges={ranges}
      {...overrides}
    />,
  );
}

describe("BankingBalanceSummary", () => {
  it("renders the title, total label, and total figure", () => {
    renderSummary();
    expect(screen.getByRole("heading", { name: "Spending overview" })).toBeInTheDocument();
    expect(screen.getByText("Total spent")).toBeInTheDocument();
    expect(screen.getByText("$1,284.32")).toBeInTheDocument();
  });

  it("renders a tab per range and shows the first range's chart by default", () => {
    renderSummary();
    expect(screen.getByRole("tab", { name: "7D" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "30D" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("img", { name: "Spending overview — 7D" })).toBeInTheDocument();
  });

  it("honors an explicit defaultRange over the first range", () => {
    renderSummary({ defaultRange: "30d" });
    expect(screen.getByRole("tab", { name: "30D" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "Spending overview — 30D" })).toBeInTheDocument();
  });

  it("switches the visible chart when a different range tab is activated", async () => {
    const user = userEvent.setup();
    renderSummary();
    await user.click(screen.getByRole("tab", { name: "30D" }));

    expect(screen.getByRole("tab", { name: "30D" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "Spending overview — 30D" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Spending overview — 7D" })).not.toBeInTheDocument();
  });

  it("shows a skeleton placeholder instead of real content while loading", () => {
    const { container } = renderSummary({ loading: true });
    expect(screen.queryByText("$1,284.32")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(container.querySelectorAll('[class*="skeleton"]').length).toBeGreaterThan(0);
    expect(screen.getByText("Loading spending summary")).toBeInTheDocument();
  });

  it("renders real content (not the skeleton) once loading is false", () => {
    renderSummary({ loading: false });
    expect(screen.getByText("$1,284.32")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });
});
