import type { IntentionalDifferenceRecord, NotApplicableRecord } from "@/lib/audit/audit-types";

/**
 * AG-1D — structured records the comparator may use to classify a finding as
 * `intentional-difference` or `not-applicable`. These are the ONLY such
 * inputs: the comparator never scrapes prose, never reads a `[TEMPORARY]` /
 * `[EXPERIMENTAL]` label as intent, and never infers intent from tone.
 */

/**
 * Exact-match records: one record converts exactly one deterministic
 * difference (same slug, same claimKey) from `fail` to
 * `intentional-difference`. Shipped EMPTY — no structured source currently
 * records an intended Figma ↔ React difference for any pilot, and none is
 * invented to improve results. The mechanism is covered by fixture tests.
 */
export const INTENTIONAL_DIFFERENCE_RECORDS: readonly IntentionalDifferenceRecord[] = [];

/**
 * Dimensions that do not exist on one side by design, each tied to a recorded
 * architecture source. A record only yields `not-applicable` when the
 * comparator's own observation agrees (see `compareDarkMode`).
 */
export const NOT_APPLICABLE_RECORDS: readonly NotApplicableRecord[] = [
  {
    componentSlug: "*",
    claimKey: "dark-mode",
    sourceRef: "docs:docs/architecture/agent-readiness.md#14 P2-3",
    statement: "React has no Dark theme; Figma Dark-mode values are not-applicable in React (product decision).",
  },
];
