import { describe, expect, it } from "vitest";
import { loadInternalComponentFacts } from "@/lib/guard/component-facts";
import { evaluateMaturityFalseStableClaim } from "@/lib/guard/rules/maturity-false-stable-claim";

const components = loadInternalComponentFacts();

describe("maturity/false-stable-claim", () => {
  it("PASS: canonical Stable + claim Stable", () => {
    // Button's real canonical status is "stable" (confirmed directly against lib/component-registry.ts).
    const [evaluation] = evaluateMaturityFalseStableClaim(
      [{ componentSlug: "button", claimedStatus: "stable" }],
      components,
    );
    expect(evaluation).toEqual({
      status: "pass",
      ruleId: "maturity/false-stable-claim",
      subject: { kind: "component", id: "button" },
    });
  });

  it("VIOLATION: canonical Beta + claim Stable", () => {
    // Toggle Group's real canonical status is "beta".
    const [evaluation] = evaluateMaturityFalseStableClaim(
      [{ componentSlug: "toggle-group", claimedStatus: "stable", location: "some-doc.md" }],
      components,
    );
    expect(evaluation.status).toBe("violation");
    if (evaluation.status !== "violation") throw new Error("unreachable");
    expect(evaluation.finding).toEqual({
      ruleId: "maturity/false-stable-claim",
      severity: "error",
      subject: { kind: "component", id: "toggle-group" },
      location: { path: "some-doc.md" },
      canonicalEvidence: expect.stringContaining('has status "beta"'),
      details: expect.stringContaining("toggle-group"),
    });
  });

  it("NOT APPLICABLE: a claimed status other than 'stable' is out of this narrow rule's scope", () => {
    const [evaluation] = evaluateMaturityFalseStableClaim(
      [{ componentSlug: "toggle-group", claimedStatus: "beta" }],
      components,
    );
    expect(evaluation.status).toBe("not-applicable");
  });

  it("NOT APPLICABLE: a nonexistent component slug defers to component/nonexistent-slug, no duplicate finding", () => {
    const [evaluation] = evaluateMaturityFalseStableClaim(
      [{ componentSlug: "command-palette", claimedStatus: "stable" }],
      components,
    );
    expect(evaluation.status).toBe("not-applicable");
    if (evaluation.status !== "not-applicable") throw new Error("unreachable");
    expect(evaluation.reason).toContain("component/nonexistent-slug");
  });

  it("STRUCTURED INPUT ONLY: no freeform-prose scanning exists — the function's only input is the explicit claims array", () => {
    // There is no "parseMarkdownForMaturityClaims"-shaped function anywhere
    // in lib/guard/ — this test documents that fact by construction: the
    // rule can only ever see what a caller explicitly constructs.
    expect(evaluateMaturityFalseStableClaim([], components)).toEqual([]);
  });
});
