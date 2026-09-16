import type { ComponentFactSource } from "@/lib/guard/component-facts";
import type { InstallabilityClaim } from "@/lib/guard/structured-claims";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * `distribution/false-installable-claim` — docs/architecture/
 * guard-readiness-audit.md §3.4. Structured input only. Canonical truth
 * is `ComponentFact.installable`, which in internal mode is a direct
 * pass-through of `isDistributedViaSkrewwwRegistry()` — never
 * reimplemented (see `lib/guard/component-facts.ts`).
 *
 * Fires only when a claim says a component IS installable but it real
 * is not (matches the rule's own name — "false-installable-claim," not
 * a general installability-mismatch rule; claiming a genuinely
 * installable component is NOT installable is out of this rule's scope,
 * mirroring the same narrow-name discipline as
 * `maturity/false-stable-claim`).
 *
 * A claim about a component that does not exist at all is
 * `not-applicable` — `component/nonexistent-slug` owns that case, and a
 * nonexistent slug would otherwise trivially satisfy this rule's
 * violation condition too (since a lookup miss resolves `installable:
 * false`), producing a confusing duplicate finding for the same root
 * cause.
 */
export function evaluateDistributionFalseInstallableClaim(
  claims: InstallabilityClaim[],
  components: ComponentFactSource,
): RuleEvaluation[] {
  return claims.map((claim): RuleEvaluation => evaluateClaim(claim, components));
}

function evaluateClaim(claim: InstallabilityClaim, components: ComponentFactSource): RuleEvaluation {
  const ruleId = "distribution/false-installable-claim" as const;
  const fact = components.getBySlug(claim.componentSlug);

  if (!fact) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Component slug "${claim.componentSlug}" does not exist — see component/nonexistent-slug, not this rule.`,
    };
  }

  if (!claim.claimedInstallable) {
    return {
      status: "not-applicable",
      ruleId,
      reason: `Claim does not assert installability — this rule only checks false claims that a component IS installable.`,
    };
  }

  if (fact.installable) {
    return { status: "pass", ruleId, subject: { kind: "component", id: claim.componentSlug } };
  }

  return {
    status: "violation",
    finding: {
      ruleId,
      severity: "error",
      subject: { kind: "component", id: claim.componentSlug },
      location: claim.location ? { path: claim.location } : undefined,
      canonicalEvidence: `isDistributedViaSkrewwwRegistry("${claim.componentSlug}") === false (lib/agent-kit/project-context.ts)`,
      details: `Claimed "${claim.componentSlug}" is installable via the @skrewww registry, but it is implemented and deliberately not distributed.`,
    },
  };
}
