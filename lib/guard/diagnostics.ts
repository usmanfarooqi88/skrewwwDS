import type { Finding, FindingSubject, RuleId, RuleSeverity } from "@/lib/guard/rule-types";
import { toProjectRelativePath } from "@/lib/guard/paths";

/**
 * Normalized diagnostic contract — docs/architecture/guard-readiness-audit.md §17.
 *
 * Rule evaluators emit machine `Finding`s; this adapter adds presentation
 * fields (message, remediation) without changing rule semantics.
 *
 * Severity vocabulary includes warning/info for future rules; v0.1 ships
 * ERROR-only findings.
 */
export type DiagnosticSeverity = "error" | "warning" | "info";

export type GuardDiagnostic = {
  ruleId: RuleId;
  severity: DiagnosticSeverity;
  /** One actionable sentence — what is wrong + canonical conflict. */
  message: string;
  /** Optional — absent for registry-wide / structured-claim checks. */
  location?: { file: string; line?: number; column?: number };
  subject: FindingSubject;
  /** Concise evidence identifier — never a full registry payload. */
  evidence: { source: string; sourceGitSha?: string };
  remediation?: string;
};

export type GuardExecutionError = {
  kind: "parse" | "io" | "usage" | "claims" | "internal";
  message: string;
  file?: string;
};

const REMEDIATION_BY_RULE: Record<
  Exclude<RuleId, "api/nonexistent-prop">,
  (finding: Finding) => string
> = {
  "component/nonexistent-slug": (finding) =>
    finding.canonicalEvidence.includes("packaged consumer facts")
      ? "Use a canonical Skrewww component slug in the origin marker, or remove the @skrewww-component marker from non-Skrewww source."
      : "Use a canonical Skrewww component slug, or remove the Skrewww-path import claim.",
  "maturity/false-stable-claim": (finding) =>
    `Correct the structured maturity metadata for "${finding.subject.id}" to match its canonical status, or promote the component first.`,
  "distribution/false-installable-claim": (finding) =>
    `Do not claim "${finding.subject.id}" is installable via the Skrewww registry until it is distributed.`,
  "token/undeclared-css-var": (finding) =>
    `Declare ${finding.subject.id} in the component's canonical cssTokens metadata.`,
  "distribution/hostrequirements-leak": () =>
    "Remove hostRequirements from the public registry projection (keep it internal-only).",
  "distribution/hosthost-schema-consistency": (finding) =>
    finding.subject.kind === "contract"
      ? "Remove shadcn-transport fields (e.g. $schema) from Agent Kit contracts."
      : "Remove Agent-Kit-only fields (guidance, tokens) from shadcn manifests.",
};

function messageFor(finding: Finding): string {
  if (finding.details && finding.details.trim().length > 0) {
    return finding.details.trim();
  }

  switch (finding.ruleId) {
    case "component/nonexistent-slug":
      return `Component slug "${finding.subject.id}" is not present in the canonical Skrewww registry.`;
    case "maturity/false-stable-claim":
      return `"${finding.subject.id}" was claimed Stable, but that conflicts with its canonical maturity status.`;
    case "distribution/false-installable-claim":
      return `"${finding.subject.id}" is not distributed through the Skrewww registry, but was claimed installable.`;
    case "token/undeclared-css-var":
      return `CSS variable ${finding.subject.id} is referenced but not declared in canonical cssTokens metadata.`;
    case "distribution/hostrequirements-leak":
      return `Generated manifest "${finding.subject.id}" leaks hostRequirements into public registry output.`;
    case "distribution/hosthost-schema-consistency":
      return `Generated artifact "${finding.subject.id}" mixes shadcn and Agent Kit schema fields.`;
    case "api/nonexistent-prop":
      // Deferred — should never appear; defensive fallback only.
      return `Deferred rule api/nonexistent-prop produced a finding (should not ship in v0.1).`;
  }
}

/**
 * Convert a G-1 machine finding into a §17 diagnostic.
 * Positions in findings are 0-based (TypeScript convention); emitted
 * line/column are 1-based for human/CLI display.
 */
export function findingToDiagnostic(
  finding: Finding,
  options?: { projectRoot?: string; sourceGitSha?: string },
): GuardDiagnostic {
  const projectRoot = options?.projectRoot ?? process.cwd();
  const remediation =
    finding.ruleId === "api/nonexistent-prop"
      ? undefined
      : REMEDIATION_BY_RULE[finding.ruleId](finding);

  let location: GuardDiagnostic["location"];
  if (finding.location?.path) {
    const file = toProjectRelativePath(finding.location.path, projectRoot);
    const start = finding.location.range?.start;
    location = {
      file,
      ...(start
        ? { line: start.line + 1, column: start.column + 1 }
        : {}),
    };
  }

  return {
    ruleId: finding.ruleId,
    severity: finding.severity as DiagnosticSeverity,
    message: messageFor(finding),
    location,
    subject: finding.subject,
    evidence: {
      source: finding.canonicalEvidence,
      ...(options?.sourceGitSha ? { sourceGitSha: options.sourceGitSha } : {}),
    },
    remediation,
  };
}

export function findingsToDiagnostics(
  findings: Finding[],
  options?: { projectRoot?: string; sourceGitSha?: string },
): GuardDiagnostic[] {
  return sortDiagnostics(findings.map((f) => findingToDiagnostic(f, options)));
}

/** Deterministic: file → line → column → ruleId → subject.id */
export function sortDiagnostics(diagnostics: GuardDiagnostic[]): GuardDiagnostic[] {
  return [...diagnostics].sort((a, b) => {
    const fileA = a.location?.file ?? "";
    const fileB = b.location?.file ?? "";
    if (fileA !== fileB) return fileA < fileB ? -1 : 1;

    const lineA = a.location?.line ?? -1;
    const lineB = b.location?.line ?? -1;
    if (lineA !== lineB) return lineA - lineB;

    const colA = a.location?.column ?? -1;
    const colB = b.location?.column ?? -1;
    if (colA !== colB) return colA - colB;

    if (a.ruleId !== b.ruleId) return a.ruleId < b.ruleId ? -1 : 1;
    if (a.subject.id !== b.subject.id) return a.subject.id < b.subject.id ? -1 : 1;
    return 0;
  });
}

export function severityAffectsExit(severity: DiagnosticSeverity | RuleSeverity): boolean {
  return severity === "error";
}
