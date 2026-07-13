import { useEffect, useRef, useState } from "react";

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
  const previousRef = useRef<{ open: boolean; wasEmpty: boolean }>({
    open: false,
    wasEmpty: false,
  });

  useEffect(() => {
    if (!open || disabled) {
      setAnnouncement("");
      previousRef.current = { open: false, wasEmpty: false };
      return;
    }

    const isEmpty = resultCount === 0;
    const previous = previousRef.current;

    if (!previous.open) {
      setAnnouncement(
        isEmpty ? "No results found." : `${resultCount} results available.`,
      );
    } else if (isEmpty && !previous.wasEmpty) {
      setAnnouncement("No results found.");
    } else if (!isEmpty && previous.wasEmpty) {
      setAnnouncement(`${resultCount} results available.`);
    }

    previousRef.current = { open: true, wasEmpty: isEmpty };
  }, [disabled, open, resultCount]);

  return announcement;
}
