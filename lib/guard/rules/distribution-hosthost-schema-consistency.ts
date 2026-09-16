import type { GeneratedContract, GeneratedManifest } from "@/lib/guard/generated-artifacts";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * `distribution/hosthost-schema-consistency` — docs/architecture/
 * guard-readiness-audit.md §3.11. **Internal repository only.** Exact
 * spelling preserved verbatim from the readiness audit — see
 * `lib/guard/rule-types.ts`'s own module doc for why this was kept, not
 * silently renamed.
 *
 * Real, audited meaning (not guessed from the rule name): the two
 * generators — `lib/agent-kit/contract-compiler.ts` (Agent Kit
 * contracts) and `lib/shadcn-registry-generator.ts` (shadcn manifests) —
 * must never cross-contaminate schemas. Mirrors
 * `lib/agent-kit/registry-integration.test.ts`'s existing, real check
 * exactly:
 *   - a generated Agent Kit contract (`public/agent/contracts/<slug>
 *     .json`) must never carry `$schema` (a shadcn-manifest-only field)
 *   - a generated shadcn manifest (`public/r/<name>.json`) must never
 *     carry `guidance` or `tokens` (Agent-Kit-contract-only fields)
 *
 * No new public field is invented here, and no existing schema is
 * altered — this rule only validates the boundary the existing test
 * already proves, generalized to every generated artifact rather than
 * one hardcoded `button` example.
 */
export function evaluateDistributionHosthostSchemaConsistency(
  contracts: GeneratedContract[],
  manifests: GeneratedManifest[],
): RuleEvaluation[] {
  const ruleId = "distribution/hosthost-schema-consistency" as const;
  const evaluations: RuleEvaluation[] = [];

  for (const contract of contracts) {
    if ("$schema" in contract.json) {
      evaluations.push({
        status: "violation",
        finding: {
          ruleId,
          severity: "error",
          subject: { kind: "contract", id: contract.fileName },
          canonicalEvidence: `public/agent/contracts/${contract.fileName}: has a "$schema" field — a shadcn-transport-only field`,
          details: `Agent Kit contract "${contract.fileName}" carries "$schema", which must only ever appear on shadcn manifests.`,
        },
      });
    } else {
      evaluations.push({ status: "pass", ruleId, subject: { kind: "contract", id: contract.fileName } });
    }
  }

  for (const manifest of manifests) {
    const leakedFields = ["guidance", "tokens"].filter((field) => field in manifest.json);
    if (leakedFields.length > 0) {
      evaluations.push({
        status: "violation",
        finding: {
          ruleId,
          severity: "error",
          subject: { kind: "manifest", id: manifest.fileName },
          canonicalEvidence: `public/r/${manifest.fileName}: has field(s) [${leakedFields.join(", ")}] — Agent-Kit-contract-only fields`,
          details: `Shadcn manifest "${manifest.fileName}" carries [${leakedFields.join(", ")}], which must only ever appear on Agent Kit contracts.`,
        },
      });
    } else {
      evaluations.push({ status: "pass", ruleId, subject: { kind: "manifest", id: manifest.fileName } });
    }
  }

  return evaluations;
}
