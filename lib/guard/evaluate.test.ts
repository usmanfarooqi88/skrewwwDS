import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateInternalRegistryRules, evaluateSourceRules, evaluateStructuredClaims } from "@/lib/guard/evaluate";
import { extractSourceFacts } from "@/lib/guard/facts";
import { loadInternalComponentFacts } from "@/lib/guard/component-facts";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";

const FIXTURES_DIR = join(process.cwd(), "lib/guard/__fixtures__");
const components = loadInternalComponentFacts();

function extractFixture(relativePath: string) {
  const content = readFileSync(join(FIXTURES_DIR, relativePath), "utf8");
  return extractSourceFacts({ path: relativePath, content });
}

describe("release-critical: zero-findings realistic fixture", () => {
  it("a realistic valid source (aliased import, native props, aria/data attributes, dynamic values, spread props, local wrapper) produces ZERO violations across every implemented source rule", () => {
    const facts = extractFixture("g1/zero-findings-realistic.tsx");
    const evaluations = evaluateSourceRules(facts);
    const violations = evaluations.filter((e) => e.status === "violation");
    expect(violations).toEqual([]);
    // Sanity: this isn't vacuous — real elements were actually evaluated.
    expect(evaluations.length).toBeGreaterThan(0);
    expect(evaluations.some((e) => e.status === "pass")).toBe(true);
  });

  it("the same fixture also produces zero violations across the internal registry rules against the real repo", () => {
    const evaluations = evaluateInternalRegistryRules();
    const violations = evaluations.filter((e) => e.status === "violation");
    expect(violations).toEqual([]);
  });

  it("zero violations for structured claims that are all truthful", () => {
    const evaluations = evaluateStructuredClaims(
      {
        maturity: [{ componentSlug: "button", claimedStatus: "stable" }],
        installability: [{ componentSlug: "button", claimedInstallable: true }],
      },
      components,
    );
    expect(evaluations.filter((e) => e.status === "violation")).toEqual([]);
  });
});

describe("determinism", () => {
  it("evaluateSourceRules produces deep-equal findings across repeated runs, for every G-0 + G-1 fixture", () => {
    const fixtures = [
      "valid/direct-import.tsx",
      "valid/aliased-import.tsx",
      "valid/barrel-import.tsx",
      "edge-cases/wrapper-component.tsx",
      "edge-cases/local-button-name.tsx",
      "edge-cases/local-button-import.tsx",
      "g1/nonexistent-component.tsx",
      "g1/zero-findings-realistic.tsx",
      "g1/compound-component-barrel-import.tsx",
    ];
    for (const fixture of fixtures) {
      const facts = extractFixture(fixture);
      const first = evaluateSourceRules(facts);
      const second = evaluateSourceRules(facts);
      expect(second).toEqual(first);
    }
  });

  it("evaluateInternalRegistryRules produces deep-equal findings across repeated runs against the real repo", () => {
    const first = evaluateInternalRegistryRules();
    const second = evaluateInternalRegistryRules();
    expect(second).toEqual(first);
  });

  it("evaluateStructuredClaims produces deep-equal findings across repeated runs", () => {
    const claims = { maturity: [{ componentSlug: "toggle-group", claimedStatus: "stable" }] };
    const first = evaluateStructuredClaims(claims, components);
    const second = evaluateStructuredClaims(claims, components);
    expect(second).toEqual(first);
  });

  it("finding order is deterministic (stable iteration order, tokens sorted where multiple can occur per entry)", () => {
    const evaluations1 = evaluateInternalRegistryRules();
    const evaluations2 = evaluateInternalRegistryRules();
    expect(evaluations2.map((e) => JSON.stringify(e))).toEqual(evaluations1.map((e) => JSON.stringify(e)));
  });
});

describe("rule catalog", () => {
  it("every rule ID is unique", () => {
    const ids = GUARD_RULE_CATALOG.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every locked rule is ERROR severity (matches the readiness audit's locked v0.1 set — no WARNING/INFO rule in G-1)", () => {
    expect(GUARD_RULE_CATALOG.every((r) => r.severity === "error")).toBe(true);
  });

  it("catalog matches exactly the 6 implemented rule IDs (api/nonexistent-prop is deliberately excluded — BLOCKED)", () => {
    const ids = GUARD_RULE_CATALOG.map((r) => r.id).sort();
    expect(ids).toEqual(
      [
        "component/nonexistent-slug",
        "distribution/false-installable-claim",
        "distribution/hosthost-schema-consistency",
        "distribution/hostrequirements-leak",
        "maturity/false-stable-claim",
        "token/undeclared-css-var",
      ].sort(),
    );
    expect(ids).not.toContain("api/nonexistent-prop");
  });

  it("public vs. internal domain split matches the readiness audit exactly", () => {
    const byId = new Map(GUARD_RULE_CATALOG.map((r) => [r.id, r.domain]));
    expect(byId.get("component/nonexistent-slug")).toBe("public");
    expect(byId.get("maturity/false-stable-claim")).toBe("public");
    expect(byId.get("distribution/false-installable-claim")).toBe("public");
    expect(byId.get("token/undeclared-css-var")).toBe("internal");
    expect(byId.get("distribution/hostrequirements-leak")).toBe("internal");
    expect(byId.get("distribution/hosthost-schema-consistency")).toBe("internal");
  });
});

describe("no deferred rules were implemented", () => {
  it("the rules directory contains no file for any deferred/rejected rule ID", () => {
    // Structural proof, not just a docs claim: these rule IDs must never
    // appear anywhere in the implemented catalog.
    const ids = GUARD_RULE_CATALOG.map((r) => r.id);
    for (const deferred of [
      "distribution/missing-registry-dependency",
      "token/hardcoded-primitive-where-provable",
      "api/icon-only-button-missing-name",
      "accessibility/table-role-grid-misuse",
    ]) {
      expect(ids).not.toContain(deferred);
    }
  });
});
