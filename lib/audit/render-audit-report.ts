import type { AuditComparison, AuditFinding } from "@/lib/audit/audit-types";
import { orderFindings, REASON_MEANINGS } from "@/lib/audit/build-explanation-request";
import type { AuditExplanationRequest, AuditExplanationResponse, FindingExplanation } from "@/lib/audit/explanation-types";

/**
 * AG-1E — deterministic Markdown report. The structure, statuses, evidence
 * list, citations and reason meanings come from AG-1D and the request; the
 * only provider text is the VALIDATED explanation, rendered as escaped inline
 * text and labelled observed / inferred. Same comparison + request + response
 * → byte-identical Markdown. No score, percentage or ranking.
 */

const STATUS_LABEL: Record<AuditFinding["status"], string> = {
  pass: "PASS",
  fail: "FAIL",
  unknown: "UNKNOWN",
  "not-applicable": "NOT APPLICABLE",
  "intentional-difference": "INTENTIONAL DIFFERENCE",
};

/** Untrusted text rendered inline: no markup, no HTML, no line breaks that could start a heading. */
export function inlineText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([\\`*_[\]<>#|~])/g, "\\$1");
}

function code(value: string): string {
  return `\`${value.replace(/`/g, "ʼ").replace(/\s+/g, " ")}\``;
}

function cite(ids: readonly string[]): string {
  return ids.map((id) => `[${id}]`).join("");
}

export type RenderAuditReportInput = {
  comparison: AuditComparison;
  request: AuditExplanationRequest;
  /** A response that has passed `validateExplanationResponse`, or null for a deterministic-only report. */
  explanations: AuditExplanationResponse | null;
};

export function renderAuditReport({ comparison, request, explanations }: RenderAuditReportInput): string {
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);
  const byId = new Map((explanations?.explanations ?? []).map((explanation) => [explanation.findingId, explanation]));
  const requestFindings = new Map(request.findings.map((finding) => [finding.findingId, finding]));
  const ordered = orderFindings(comparison.findings);
  const { provenance, summary } = comparison;

  push(`# Skrewww Audit — ${inlineText(comparison.component.name)}`, "");
  push(
    "> **How to read this report.** Statuses, evidence and reason meanings come from the deterministic AG-1D comparator. Explanation prose may be model-generated: it is labelled, checked against the cited evidence, and cannot change a status. Source evidence remains authoritative; this report is not canonical metadata. **No changes were applied.** `UNKNOWN` means unresolved — not good and not bad.",
    "",
  );
  if (!explanations) push("> No explanation response was supplied; this report contains deterministic content only.", "");

  push("## Summary", "");
  push(`- Component: ${code(comparison.component.slug)}`);
  push(`- Repo SHA: ${code(provenance.repoGitSha)}${provenance.repoWorkingTreeDirty ? " (working tree had uncommitted changes)" : ""}`);
  push(`- Figma snapshot: ${code(`${provenance.figmaFileKey}/${provenance.figmaNodeId}`)} (${provenance.figmaNodeType}), captured ${code(provenance.figmaCapturedAt)}`, "");
  push("| Pass | Fail | Unknown | Not applicable | Intentional difference |", "|---:|---:|---:|---:|---:|");
  push(`| ${summary.pass} | ${summary.fail} | ${summary.unknown} | ${summary.notApplicable} | ${summary.intentionalDifference} |`, "");

  const attention = ordered.filter((finding) => finding.status === "fail" || finding.status === "unknown");
  const intentional = ordered.filter((finding) => finding.status === "intentional-difference");
  const notApplicable = ordered.filter((finding) => finding.status === "not-applicable");
  const passed = ordered.filter((finding) => finding.status === "pass");

  push("## Findings requiring attention", "");
  if (attention.length === 0) push("None.", "");
  for (const finding of attention) renderFinding(finding, byId.get(finding.findingId), requestFindings.get(finding.findingId)?.evidence ?? [], push);

  push("## Intentional differences", "");
  if (intentional.length === 0) push("None recorded.", "");
  for (const finding of intentional) renderFinding(finding, byId.get(finding.findingId), requestFindings.get(finding.findingId)?.evidence ?? [], push);

  push("## Not applicable", "");
  if (notApplicable.length === 0) push("None.", "");
  for (const finding of notApplicable) {
    push(`- **${inlineText(finding.claim)}** (${code(finding.findingId)}) — ${REASON_MEANINGS[finding.reasonCode]} Evidence: ${finding.evidence.map((e) => code(e.sourceRef)).join(", ")}`);
  }
  if (notApplicable.length > 0) push("");

  push("## Passed checks", "");
  push(`${passed.length} deterministic checks passed. They are listed without explanation prose.`, "");
  if (passed.length > 0) {
    push("| Category | Claim | Evidence |", "|---|---|---|");
    for (const finding of passed) {
      push(`| ${finding.category} | ${inlineText(finding.claim)} | ${finding.evidence.map((e) => code(e.sourceRef)).join(", ")} |`);
    }
    push("");
  }

  push("## Provenance", "");
  push(`- Repo: ${code(provenance.repoGitSha)} (committed ${code(provenance.repoGitCommitTimestamp)})`);
  push(`- Figma: ${code(provenance.figmaFileKey)} node ${code(provenance.figmaNodeId)}, snapshot captured ${code(provenance.figmaCapturedAt)}`);
  push(
    `- Schemas: comparison ${comparison.schemaVersion}, RepoFacts ${provenance.repoFactsSchemaVersion}, Figma snapshot ${provenance.figmaSnapshotSchemaVersion}, property map ${provenance.propertyMapVersion ?? "none"}, explanation request ${request.schemaVersion}`,
  );
  push(`- Explanations: ${explanations ? "provider response validated against this request" : "not supplied"}`, "");
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

function renderFinding(
  finding: AuditFinding,
  explanation: FindingExplanation | undefined,
  evidence: AuditExplanationRequest["findings"][number]["evidence"],
  push: (...items: string[]) => void,
): void {
  push(`### ${STATUS_LABEL[finding.status]} — ${inlineText(finding.claim)}`, "");
  if (finding.requiresHumanDecision) push("**Human decision required.** The explanation below can describe the decision; it does not make it.", "");
  push("**Deterministic finding**", "");
  push(`- Finding: ${code(finding.findingId)} · severity ${finding.severity} · basis ${finding.basis} · confidence ${finding.confidence}`);
  push(`- Reason: ${code(finding.reasonCode)} — ${REASON_MEANINGS[finding.reasonCode]}`);
  if (finding.expected !== undefined) push(`- Expected: ${code(finding.expected)}`);
  if (finding.actual !== undefined) push(`- Actual: ${code(finding.actual)}`);
  push("");

  push("**Explanation**", "");
  if (!explanation) {
    push("_Not provided._", "");
  } else {
    push(`${inlineText(explanation.summary.text)} ${cite(explanation.summary.citations)}`, "");
    for (const statement of explanation.statements) {
      push(`- ${statement.kind === "observed" ? "Observed" : "Inferred (model interpretation)"}: ${inlineText(statement.text)} ${cite(statement.citations)}`);
    }
    push("");
    if (explanation.missingEvidence) {
      push("**Missing evidence**", "");
      push(`- Missing: ${inlineText(explanation.missingEvidence.description)}`);
      push(`- Would be resolved by: ${inlineText(explanation.missingEvidence.wouldResolveBy)}`, "");
    }
    if (explanation.suggestedAction) {
      push("**Suggested next action (advisory, not applied)**", "");
      push(`- Target: ${code(explanation.suggestedAction.target)} — ${inlineText(explanation.suggestedAction.description)} ${cite(explanation.suggestedAction.citations)}`, "");
    }
  }

  push("**Evidence**", "");
  for (const entry of evidence) push(`- [${entry.evidenceId}] ${code(entry.sourceRef)} — ${inlineText(entry.observed)}`);
  push("");
}
