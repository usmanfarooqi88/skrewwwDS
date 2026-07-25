import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  BankingTransactionRow,
  BankingTransactionDetailRow,
} from "@/components/ui/BankingTransactionRow";

function renderRow(overrides: Partial<Parameters<typeof BankingTransactionRow>[0]> = {}) {
  return render(
    <ul>
      <BankingTransactionRow
        merchant="Coffee Collective"
        merchantInitials="CC"
        date="Jan 12"
        amount="-$4.75"
        status="success"
        statusLabel="Completed"
        detail={
          <>
            <BankingTransactionDetailRow label="Category" value="Dining" />
            <BankingTransactionDetailRow label="Transaction ID" value="TX-48213" />
          </>
        }
        {...overrides}
      />
    </ul>,
  );
}

describe("BankingTransactionRow", () => {
  it("renders merchant, date, amount, and status label", () => {
    renderRow();
    expect(screen.getByText("Coffee Collective")).toBeInTheDocument();
    expect(screen.getByText("Jan 12")).toBeInTheDocument();
    expect(screen.getByText("-$4.75")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("colors the amount using the semantic status token class, not a new color", () => {
    const { container, rerender } = render(
      <ul>
        <BankingTransactionRow
          merchant="Coffee Collective"
          date="Jan 12"
          amount="-$4.75"
          status="error"
          statusLabel="Declined"
          detail={<BankingTransactionDetailRow label="Category" value="Dining" />}
        />
      </ul>,
    );
    expect(container.querySelector('[class*="amount"][class*="error"]')).not.toBeNull();

    rerender(
      <ul>
        <BankingTransactionRow
          merchant="Coffee Collective"
          date="Jan 12"
          amount="+$4.75"
          status="warning"
          statusLabel="Pending"
          detail={<BankingTransactionDetailRow label="Category" value="Dining" />}
        />
      </ul>,
    );
    expect(container.querySelector('[class*="amount"][class*="warning"]')).not.toBeNull();
  });

  it("renders as a single interactive row (no nested duplicate buttons)", () => {
    renderRow();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("starts collapsed with aria-expanded=false and no accessible detail panel", () => {
    renderRow();
    const trigger = screen.getByRole("button", { name: /Coffee Collective/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(screen.queryByText("Transaction ID")).not.toBeInTheDocument();
  });

  it("opens the detail popover on click, exposing the composed detail rows", async () => {
    const user = userEvent.setup();
    renderRow();
    const trigger = screen.getByRole("button", { name: /Coffee Collective/ });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Coffee Collective transaction details" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Dining")).toBeInTheDocument();
    expect(screen.getByText("Transaction ID")).toBeInTheDocument();
    expect(screen.getByText("TX-48213")).toBeInTheDocument();
  });

  it("closes the detail popover on a second click", async () => {
    const user = userEvent.setup();
    renderRow();
    const trigger = screen.getByRole("button", { name: /Coffee Collective/ });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("falls back to initials when no logo image is provided", () => {
    renderRow({ merchantLogoSrc: undefined, merchantInitials: "CC" });
    expect(screen.getByText("CC")).toBeInTheDocument();
  });
});

describe("BankingTransactionDetailRow", () => {
  it("renders a label/value pair", () => {
    render(<BankingTransactionDetailRow label="Category" value="Dining" />);
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Dining")).toBeInTheDocument();
  });
});
