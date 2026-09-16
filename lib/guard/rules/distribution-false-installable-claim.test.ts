import { describe, expect, it } from "vitest";
import { loadInternalComponentFacts } from "@/lib/guard/component-facts";
import { isDistributedViaSkrewwwRegistry } from "@/lib/agent-kit/project-context";
import { evaluateDistributionFalseInstallableClaim } from "@/lib/guard/rules/distribution-false-installable-claim";

const components = loadInternalComponentFacts();

describe("distribution/false-installable-claim", () => {
  it("PASS: a genuinely distributed component claimed installable", () => {
    expect(isDistributedViaSkrewwwRegistry("button")).toBe(true); // sanity: canonical truth agrees
    const [evaluation] = evaluateDistributionFalseInstallableClaim(
      [{ componentSlug: "button", claimedInstallable: true }],
      components,
    );
    expect(evaluation).toEqual({
      status: "pass",
      ruleId: "distribution/false-installable-claim",
      subject: { kind: "component", id: "button" },
    });
  });

  it("VIOLATION: a deferred banking component claimed installable", () => {
    expect(isDistributedViaSkrewwwRegistry("banking-account-card")).toBe(false); // sanity
    const [evaluation] = evaluateDistributionFalseInstallableClaim(
      [{ componentSlug: "banking-account-card", claimedInstallable: true }],
      components,
    );
    expect(evaluation.status).toBe("violation");
    if (evaluation.status !== "violation") throw new Error("unreachable");
    expect(evaluation.finding.subject).toEqual({ kind: "component", id: "banking-account-card" });
    expect(evaluation.finding.canonicalEvidence).toContain("isDistributedViaSkrewwwRegistry");
  });

  it("Foundation: reuses the same canonical truth — not special-cased separately", () => {
    // Foundation is handled by the distribution architecture as its own
    // registry:file item, not a "component" slug in componentRegistry —
    // this rule only ever evaluates real component slugs it's given.
    expect(components.getBySlug("foundation")).toBeUndefined();
  });

  it("NOT APPLICABLE: a claim that does NOT assert installability is out of scope (narrow rule name, not generic mismatch)", () => {
    const [evaluation] = evaluateDistributionFalseInstallableClaim(
      [{ componentSlug: "banking-account-card", claimedInstallable: false }],
      components,
    );
    expect(evaluation.status).toBe("not-applicable");
  });

  it("NOT APPLICABLE: a nonexistent component slug defers to component/nonexistent-slug, no duplicate finding", () => {
    const [evaluation] = evaluateDistributionFalseInstallableClaim(
      [{ componentSlug: "command-palette", claimedInstallable: true }],
      components,
    );
    expect(evaluation.status).toBe("not-applicable");
    if (evaluation.status !== "not-applicable") throw new Error("unreachable");
    expect(evaluation.reason).toContain("component/nonexistent-slug");
  });

  it("does not reimplement installability logic — reuses isDistributedViaSkrewwwRegistry via the shared ComponentFact loader", () => {
    for (const slug of ["button", "banking-account-card", "toggle-group"]) {
      expect(components.getBySlug(slug)!.installable).toBe(isDistributedViaSkrewwwRegistry(slug));
    }
  });
});
