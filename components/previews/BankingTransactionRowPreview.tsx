"use client";

import {
  BankingTransactionRow,
  BankingTransactionDetailRow,
  type BankingTransactionRowProps,
} from "@/components/ui/BankingTransactionRow";
import { ComponentPreview, PreviewGroup } from "@/components/docs/ComponentPreview";

const transactions: BankingTransactionRowProps[] = [
  {
    merchant: "Coffee Collective",
    merchantInitials: "CC",
    date: "Jan 12",
    amount: "-$4.75",
    status: "success",
    statusLabel: "Completed",
    detail: (
      <>
        <BankingTransactionDetailRow label="Category" value="Dining" />
        <BankingTransactionDetailRow label="Transaction ID" value="TX-48213" />
        <BankingTransactionDetailRow label="Account" value="Everyday Checking •••• 4821" />
      </>
    ),
  },
  {
    merchant: "Metro Transit Authority",
    merchantInitials: "MT",
    date: "Jan 11",
    amount: "-$2.50",
    status: "warning",
    statusLabel: "Pending",
    detail: (
      <>
        <BankingTransactionDetailRow label="Category" value="Transportation" />
        <BankingTransactionDetailRow label="Transaction ID" value="TX-48190" />
        <BankingTransactionDetailRow label="Account" value="Everyday Checking •••• 4821" />
      </>
    ),
  },
  {
    merchant: "Skyline Electronics",
    merchantInitials: "SE",
    date: "Jan 10",
    amount: "-$289.00",
    status: "error",
    statusLabel: "Declined",
    detail: (
      <>
        <BankingTransactionDetailRow label="Category" value="Electronics" />
        <BankingTransactionDetailRow label="Transaction ID" value="TX-48102" />
        <BankingTransactionDetailRow label="Decline reason" value="Insufficient funds" />
      </>
    ),
  },
  {
    merchant: "Acme Payroll Inc.",
    merchantInitials: "AP",
    date: "Jan 9",
    amount: "+$2,450.00",
    status: "success",
    statusLabel: "Completed",
    detail: (
      <>
        <BankingTransactionDetailRow label="Category" value="Payroll deposit" />
        <BankingTransactionDetailRow label="Transaction ID" value="TX-47988" />
        <BankingTransactionDetailRow label="Account" value="Everyday Checking •••• 4821" />
      </>
    ),
  },
];

export function BankingTransactionRowPreview() {
  return (
    <div className="space-y-8">
      <ComponentPreview
        title="Recent activity"
        description="Click any row to open its detail Popover. Status drives both the Badge variant and the amount's color, using the existing semantic/feedback/success, semantic/feedback/warning, and semantic/action/danger tokens — no new colors."
      >
        <PreviewGroup label="Everyday Checking •••• 4821">
          <ul className="w-full max-w-lg rounded-lg border border-ink-200 p-1">
            {transactions.map((transaction) => (
              <BankingTransactionRow key={transaction.merchant + transaction.date} {...transaction} />
            ))}
          </ul>
        </PreviewGroup>
      </ComponentPreview>
    </div>
  );
}
