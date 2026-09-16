/**
 * Structured claim inputs for `maturity/false-stable-claim` and
 * `distribution/false-installable-claim` — docs/architecture/
 * guard-readiness-audit.md §3.3/§3.4, both explicitly "structured input
 * only." Neither rule ever scans freeform prose ("Button is stable") out
 * of Markdown, README, or generated text — the G-1 brief is explicit
 * that this would require natural-language parsing, which is out of
 * scope (no LLM, no regex-over-prose). A caller (a future G-2 CLI, an
 * Agent-output validator, a test) is responsible for producing these
 * structured claims from whatever real, already-structured source it
 * has — e.g. exactly the shape `lib/agent-kit/evaluation-schema.ts`'s
 * `EvalAgentDeclaration` already uses for the AK-5 eval harness.
 */

export type MaturityClaim = {
  componentSlug: string;
  /** The claimed status, verbatim — e.g. "stable". Compared case-sensitively against the real canonical status; never normalized/guessed. */
  claimedStatus: string;
  /** Caller-supplied logical location description (never a machine-specific absolute path) — optional, since a structured claim need not originate from a specific file/line. */
  location?: string;
};

export type InstallabilityClaim = {
  componentSlug: string;
  claimedInstallable: boolean;
  location?: string;
};
