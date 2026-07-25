import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BankingAccountCard } from "@/components/ui/BankingAccountCard";

const balanceHistory = [
  { label: "Week 1", value: 4100 },
  { label: "Week 2", value: 4180 },
  { label: "Week 3", value: 4050 },
  { label: "Week 4", value: 4231 },
];

function renderCard(onAction = vi.fn()) {
  return {
    onAction,
    ...render(
      <BankingAccountCard
        accountName="Everyday Checking"
        accountType="Checking"
        balance="$4,231.09"
        balanceHistory={balanceHistory}
        balanceHistoryLabel="30-day balance history for Everyday Checking"
        actionLabel="View transactions"
        onAction={onAction}
      />,
    ),
  };
}

describe("BankingAccountCard", () => {
  it("renders the account name as a heading, account type as a Tag, and the formatted balance", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "Everyday Checking" })).toBeInTheDocument();
    expect(screen.getByText("Checking")).toBeInTheDocument();
    expect(screen.getByText("$4,231.09")).toBeInTheDocument();
  });

  it("invokes onAction when the action button is activated", async () => {
    const user = userEvent.setup();
    const { onAction } = renderCard();
    await user.click(screen.getByRole("button", { name: "View transactions" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders the balance history as a sparkline LineChart with an accessible name", () => {
    renderCard();
    expect(
      screen.getByRole("img", { name: "30-day balance history for Everyday Checking" }),
    ).toBeInTheDocument();
  });

  it("renders the sparkline without point-marker dots", () => {
    const { container } = renderCard();
    expect(container.querySelectorAll(".recharts-line-dots circle")).toHaveLength(0);
  });

  it("applies the balance class carrying tabular-nums numeric alignment (see banking-account-card.module.css)", () => {
    renderCard();
    expect(screen.getByText("$4,231.09").className).toMatch(/balance/);
  });
});
