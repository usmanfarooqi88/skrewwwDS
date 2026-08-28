import { useState } from "react";

export type ComboboxListStatusInput = {
  open: boolean;
  disabled?: boolean;
  resultCount: number;
};

/**
 * Polite list status announcements for Combobox filtering.
 *
 * Policy:
 * - Announce once when the listbox opens (count or no-results).
 * - Announce when results transition to empty while open.
 * - Announce when results return after being empty while open.
 * - Do not announce on every intermediate count change while typing.
 * - Stay silent when closed or disabled.
 */
export function useComboboxListStatus({
  open,
  disabled = false,
  resultCount,
}: ComboboxListStatusInput): string {
  const [announcement, setAnnouncement] = useState("");
  const [tracked, setTracked] = useState<{
    open: boolean;
    wasEmpty: boolean;
  }>({ open: false, wasEmpty: false });

  const silent = !open || disabled;
  const isEmpty = resultCount === 0;

  if (silent) {
    if (tracked.open) {
      setTracked({ open: false, wasEmpty: false });
    }
  } else {
    const justOpened = !tracked.open;
    const becameEmpty = isEmpty && !tracked.wasEmpty;
    const returned = !isEmpty && tracked.wasEmpty;
    if (justOpened || becameEmpty || returned) {
      const next = isEmpty ? "No results found." : `${resultCount} results available.`;
      if (announcement !== next) {
        setAnnouncement(next);
      }
    }
    if (tracked.open !== true || tracked.wasEmpty !== isEmpty) {
      setTracked({ open: true, wasEmpty: isEmpty });
    }
  }

  return silent ? "" : announcement;
}
