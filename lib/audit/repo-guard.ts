import { compileAllContracts } from "@/lib/agent-kit/contract-compiler";
import type { GuardEvaluationFact } from "@/lib/audit/repo-facts-types";
import { evaluateInternalRegistryRules } from "@/lib/guard/evaluate";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";
import type { RuleEvaluation } from "@/lib/guard/rule-types";
import { buildDistributedRegistryItems } from "@/lib/shadcn-registry-generator";

/**
 * Guard integration for the Audit Agent repo-facts collector.
 *
 * `runGuard()` returns diagnostics for VIOLATIONS only — it discards `pass`,
 * `not-applicable` and `unknown` evaluations. The Audit Agent must keep those
 * states (an `unknown` is never a failure), so this module calls the same
 * evaluation layer `runGuard()` uses (`evaluateInternalRegistryRules`) and
 * keeps every `RuleEvaluation`.
 *
 * Inputs are generated IN MEMORY from canonical sources at the observed SHA
 * (contracts via the Agent contract compiler, manifests via the shadcn
 * registry generator) instead of read from `public/`, which is gitignored and
 * absent in a clean checkout before `npm run build`. No generated artifact is
 * read or written.
 *
 * Guard evaluations are not keyed by slug, so attribution is explicit:
 * subject id (`component` id, or `<slug>.json` for manifest/contract subjects)
 * or, for evaluations whose subject is a token or that carry only prose, the
 * quoted `"<slug>"` inside the evidence/reason text. The strategy is recorded
 * per evaluation (`attribution`).
 */

export const GUARD_SOURCE = "evaluateInternalRegistryRules (in-memory generated artifacts)";

export function internalGuardRuleIds(): string[] {
  return GUARD_RULE_CATALOG.filter((entry) => entry.domain === "internal")
    .map((entry) => entry.id as string)
    .sort();
}

/** Runs every internal Guard rule against in-memory generated artifacts at `gitSha`. */
export function evaluateInternalGuard(root: string, gitSha: string, gitCommitTimestamp: string): RuleEvaluation[] {
  const { contracts } = compileAllContracts({ sourceGitSha: gitSha, sourceGitCommitTimestamp: gitCommitTimestamp });
  const generatedContracts = contracts.map((contract) => ({
    fileName: `${contract.slug}.json`,
    json: JSON.parse(JSON.stringify(contract)) as Record<string, unknown>,
  }));
  const generatedManifests = buildDistributedRegistryItems().map((item) => ({
    fileName: `${item.name}.json`,
    json: JSON.parse(JSON.stringify(item)) as Record<string, unknown>,
  }));
  return evaluateInternalRegistryRules({ root, manifests: generatedManifests, contracts: generatedContracts });
}

function quoted(slug: string): string {
  return `"${slug}"`;
}

function attribute(evaluation: RuleEvaluation, slug: string): GuardEvaluationFact["attribution"] | undefined {
  if (evaluation.status === "not-applicable") {
    return evaluation.reason.includes(quoted(slug)) ? "evidence-text" : undefined;
  }
  const subject = evaluation.status === "violation" ? evaluation.finding.subject : evaluation.subject;
  if (subject.kind === "component" && subject.id === slug) return "subject";
  if ((subject.kind === "contract" || subject.kind === "manifest") && subject.id === `${slug}.json`) return "subject";
  if (evaluation.status === "violation") {
    const text = `${evaluation.finding.canonicalEvidence}\n${evaluation.finding.details ?? ""}`;
    return text.includes(quoted(slug)) ? "evidence-text" : undefined;
  }
  if (evaluation.status === "unknown") return evaluation.reason.includes(quoted(slug)) ? "evidence-text" : undefined;
  return undefined;
}

/**
 * Keeps only the evaluations about `slug`, normalized and sorted. Guard states
 * are preserved verbatim: `unknown` stays `unknown`, `not-applicable` stays
 * `not-applicable`, and nothing is translated into an audit status.
 */
export function filterGuardEvaluationsForSlug(evaluations: readonly RuleEvaluation[], slug: string): GuardEvaluationFact[] {
  const facts: GuardEvaluationFact[] = [];
  for (const evaluation of evaluations) {
    const attribution = attribute(evaluation, slug);
    if (!attribution) continue;
    if (evaluation.status === "violation") {
      const { finding } = evaluation;
      const fact: GuardEvaluationFact = {
        ruleId: finding.ruleId,
        status: "violation",
        subject: { kind: finding.subject.kind, id: finding.subject.id },
        finding: { severity: finding.severity, canonicalEvidence: finding.canonicalEvidence },
        attribution,
      };
      if (finding.details) fact.finding!.details = finding.details;
      if (finding.location) fact.finding!.location = { path: finding.location.path };
      facts.push(fact);
    } else if (evaluation.status === "pass") {
      facts.push({ ruleId: evaluation.ruleId, status: "pass", subject: { kind: evaluation.subject.kind, id: evaluation.subject.id }, attribution });
    } else if (evaluation.status === "unknown") {
      facts.push({
        ruleId: evaluation.ruleId,
        status: "unknown",
        subject: { kind: evaluation.subject.kind, id: evaluation.subject.id },
        reason: evaluation.reason,
        attribution,
      });
    } else {
      facts.push({ ruleId: evaluation.ruleId, status: "not-applicable", reason: evaluation.reason, attribution });
    }
  }
  return facts.sort(
    (a, b) =>
      a.ruleId.localeCompare(b.ruleId) ||
      a.status.localeCompare(b.status) ||
      (a.subject?.kind ?? "").localeCompare(b.subject?.kind ?? "") ||
      (a.subject?.id ?? "").localeCompare(b.subject?.id ?? ""),
  );
}

export function summarizeGuard(evaluations: readonly GuardEvaluationFact[]) {
  const summary = { violation: 0, pass: 0, notApplicable: 0, unknown: 0 };
  for (const evaluation of evaluations) {
    if (evaluation.status === "violation") summary.violation += 1;
    else if (evaluation.status === "pass") summary.pass += 1;
    else if (evaluation.status === "unknown") summary.unknown += 1;
    else summary.notApplicable += 1;
  }
  return summary;
}
