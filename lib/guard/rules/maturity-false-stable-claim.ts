import type { ComponentFactSource } from "@/lib/guard/component-facts";
import type { MaturityClaim } from "@/lib/guard/structured-claims";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * `maturity/false-stable-claim` — docs/architecture/
 * guard-readiness-audit.md §3.3. Structured input only. Fires ONLY when
 * the claimed status is literally "stable" and the component's real
 * canonical status is not — the rule is named `false-stable-claim`, not
 * generic status validation, and the G-1 brief is explicit that
 * expanding it into a general "any status mismatch" rule is not
 * authorized here.
 *
 * A claim about a component that does not exist at all is
 * `not-applicable` (that's `component/nonexistent-slug`'s job — this
 * rule never produces a duplicate or conflicting finding for the same
 * root cause).
 */
export function evaluateMaturityFalseStableClaim(
  claims: MaturityClaim[],
  components: ComponentFactSource,
): RuleEvaluation[] {
  return claims.map((claim): RuleEvaluation => evaluateClaim(claim, components));
}

function evaluateClaim(claim: MaturityClaim, components: ComponentFactSource): RuleEvaluation {
  const ruleId = "maturity/false-stable-claim" as const;
  const fact = components.getBySlug(claim.componentSlug);

  if (!fact) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Component slug "${claim.componentSlug}" does not exist — see component/nonexistent-slug, not this rule.`,
    };
  }

  if (claim.claimedStatus !== "stable") {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Claimed status "${claim.claimedStatus}" is not "stable" — this rule only checks false Stable claims, not generic status validation.`,
    };
  }

  if (fact.status === "stable") {
    return { status: "pass", ruleId, subject: { kind: "component", id: claim.componentSlug } };
  }

  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: claim.componentSlug },
      location: claim.location ? { path: claim.location } : undefined,
      canonicalEvidence: `lib/component-registry.ts: "${claim.componentSlug}" has status "${fact.status}"`,
      details: `Claimed "${claim.componentSlug}" is Stable, but its real canonical status is "${fact.status}".`,
    },
  };
}
