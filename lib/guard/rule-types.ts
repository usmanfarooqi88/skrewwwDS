import type { GuardSourceRange } from "@/lib/guard/types";

/**
 * G-1 rule evaluation types — EVALUATE RULES only (see
 * docs/architecture/guard-foundation.md's PARSE → EXTRACT FACTS →
 * EVALUATE RULES → DIAGNOSTICS pipeline). No pretty-printing, no CLI
 * concerns, no exit codes — those belong to G-2
 * (docs/architecture/guard-readiness-audit.md §36's own boundary).
 *
 * The seven locked rule IDs, exactly as spelled in
 * docs/architecture/guard-readiness-audit.md §3 / §5 — including
 * `distribution/hosthost-schema-consistency`, which this document
 * deliberately preserves verbatim (see that file's own §37 for the
 * reasoning: the doubled "host" has been used with perfect consistency
 * across two independently-authored canonical documents — PH-0 and the
 * readiness audit, 11+ occurrences combined, never spelled any other
 * way — which is the signature of an intentional, if unusually named,
 * locked identifier, not a one-off typo).
 */
export type RuleId =
  | "component/nonexistent-slug"
  | "api/nonexistent-prop"
  | "maturity/false-stable-claim"
  | "distribution/false-installable-claim"
  | "token/undeclared-css-var"
  | "distribution/hostrequirements-leak"
  | "distribution/hosthost-schema-consistency";

/** All seven locked rules are ERROR per the readiness audit §5's locked v0.1 set — no WARNING/INFO rule exists in G-1. */
export type RuleSeverity = "error";

/** Matches the readiness audit §22's own domain split — never mixed within one rule. */
export type RuleDomain = "public" | "internal";

export type FindingSubject = {
  kind: "component" | "prop" | "token" | "manifest" | "contract";
  /** The identifier the finding is about — a slug, a prop name, a token name, a manifest/contract file name. Never a full payload. */
  id: string;
};

/**
 * A single confirmed rule violation. Deliberately minimal — no
 * human-facing message string, no remediation hint, no CLI formatting
 * (G-2's job). `canonicalEvidence` names *which real canonical source*
 * the violation was checked against, so a finding is traceable without
 * embedding the full canonical payload.
 */
export type Finding = {
  ruleId: RuleId;
  severity: RuleSeverity;
  subject: FindingSubject;
  /** Present for source-file-based findings (rules 1–2); absent for structured-claim and internal-registry findings, which have no single JSX call site. */
  location?: { path: string; range?: GuardSourceRange };
  /** e.g. "lib/component-registry.ts: no entry with slug \"command-palette\"" — names the real source consulted, never a guess. */
  canonicalEvidence: string;
  details?: string;
};

/**
 * One evaluated unit's outcome — proves a caller can distinguish "this
 * was checked and is fine," "this couldn't be checked at all," and "this
 * was never in scope for this rule" from an actual violation. Matches
 * the G-0/readiness-audit principle carried into G-1: **unknown is never
 * a violation**, and neither is not-applicable.
 */
export type RuleEvaluation =
  | { status: "violation"; finding: Finding }
  | { status: "pass"; ruleId: RuleId; subject: FindingSubject }
  | { status: "not-applicable"; ruleId: RuleId; reason: string }
  | { status: "unknown"; ruleId: RuleId; subject: FindingSubject; reason: string };

export type RuleCatalogEntry = {
  id: RuleId;
  severity: RuleSeverity;
  domain: RuleDomain;
};
