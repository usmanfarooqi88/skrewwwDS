"use client";

import { useState, type ReactNode } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ListItem } from "@/components/ui/ListItem";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverBody,
} from "@/components/ui/Popover";
import { cn } from "@/lib/cn";
import styles from "@/components/ui/banking-transaction-row.module.css";

export type BankingTransactionStatus = "success" | "warning" | "error";

export type BankingTransactionRowProps = {
  /** Merchant or counterparty name — also the row's title and the Avatar's accessible label. */
  merchant: string;
  merchantLogoSrc?: string;
  /** Fallback initials shown when merchantLogoSrc is absent or fails to load. */
  merchantInitials?: string;
  /** Display date/time string — formatting is the consumer's responsibility. */
  date: string;
  /** Pre-formatted amount string (e.g. "-$42.50", "+$1,200.00") — currency formatting is the consumer's responsibility. */
  amount: string;
  /** Drives Badge variant and amount color — semantic status tokens only, not a new color. */
  status: BankingTransactionStatus;
  /** Visible status text (e.g. "Completed", "Pending", "Declined") — status drives color/meaning, statusLabel drives the word shown, same split as Badge's own variant/children. */
  statusLabel: string;
  /** Content shown in the anchored Popover when the row is clicked — typically BankingTransactionDetailRow items. */
  detail: ReactNode;
  className?: string;
};

/**
 * Composes List Item (row shell), Avatar (merchant logo/initials), Badge
 * (status), and Popover (detail-view trigger) — the first Layer 4 Banking
 * pilot component. React-first; no Figma reference exists for Industry
 * Systems yet, confirmed via a full Figma file search before building.
 *
 * Popover was chosen over Drawer for the detail trigger: Popover's own
 * documented purpose ("non-modal floating panel for supplementary or
 * lightly interactive content anchored to a trigger") is a precise match
 * for viewing read-only detail fields for one row without leaving the
 * transaction list's context. Drawer's placement is currently
 * left-edge-only (`DrawerPlacement = "left"`), which is an unconventional
 * position for a per-row detail panel, and Drawer's own description
 * ("supplementary settings, filters, or secondary forms") targets a
 * heavier, more form-like use case than a handful of read-only fields.
 *
 * Uses PopoverAnchor (not PopoverTrigger) because List Item does not
 * forward a ref to its underlying interactive element — PopoverTrigger's
 * clone-based ref assignment would silently fail to attach to a real DOM
 * node. PopoverAnchor wrapping a plain div is the same established pattern
 * Combobox already uses for its own non-button trigger (its text input).
 *
 * List Item's disclosure ARIA attributes (aria-expanded/aria-haspopup/
 * aria-controls) were added to List Item itself for this — a genuine
 * Layer 2 gap, not a one-off aria hack layered on top of it (see
 * ListItem.tsx).
 */
export function BankingTransactionRow({
  merchant,
  merchantLogoSrc,
  merchantInitials,
  date,
  amount,
  status,
  statusLabel,
  detail,
  className,
}: BankingTransactionRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} placement="bottom" align="start">
      <PopoverAnchor>
        <div className={styles.anchor}>
          <ListItem
            leading={
              <Avatar
                size="sm"
                src={merchantLogoSrc}
                initials={merchantInitials}
                label={merchant}
                decorative
              />
            }
            title={merchant}
            description={date}
            metadata={
              <span className={styles.meta}>
                <span className={cn(styles.amount, styles[status])}>{amount}</span>
                <Badge variant={status} size="sm">
                  {statusLabel}
                </Badge>
              </span>
            }
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={className}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent aria-label={`${merchant} transaction details`}>
        <PopoverBody>{detail}</PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export type BankingTransactionDetailRowProps = {
  label: string;
  value: ReactNode;
};

/** A single label/value row for composing BankingTransactionRow's detail Popover content. */
export function BankingTransactionDetailRow({ label, value }: BankingTransactionDetailRowProps) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  );
}
