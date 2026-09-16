import { describe, expect, it } from "vitest";
import { findingToDiagnostic, sortDiagnostics, type GuardDiagnostic } from "@/lib/guard/diagnostics";
import type { Finding } from "@/lib/guard/rule-types";

function baseFinding(overrides: Partial<Finding> & Pick<Finding, "ruleId" | "subject">): Finding {
  return {
    severity: "error",
    canonicalEvidence: "test-evidence",
    ...overrides,
  };
}

describe("findingToDiagnostic", () => {
  it("maps required fields and 1-based location", () => {
    const finding = baseFinding({
      ruleId: "component/nonexistent-slug",
      subject: { kind: "component", id: "CommandPalette" },
      location: {
        path: "lib/guard/__fixtures__/g1/nonexistent-component.tsx",
        range: { start: { line: 3, column: 10 }, end: { line: 3, column: 24 } },
      },
      details:
        'Claimed a Skrewww component "CommandPalette" via "@/components/ui/CommandPalette", but no such component exists in the canonical registry.',
    });

    const d = findingToDiagnostic(finding, { projectRoot: process.cwd() });
    expect(d.ruleId).toBe("component/nonexistent-slug");
    expect(d.severity).toBe("error");
    expect(d.message).toContain("CommandPalette");
    expect(d.location?.file).toBe("lib/guard/__fixtures__/g1/nonexistent-component.tsx");
    expect(d.location?.line).toBe(4);
    expect(d.location?.column).toBe(11);
    expect(d.evidence.source).toBe("test-evidence");
    expect(d.remediation).toMatch(/canonical Skrewww component/i);
    expect(d.message).not.toContain("import {");
  });

  it("emits remediation for all six v0.1 rules", () => {
    const rules: Finding["ruleId"][] = [
      "component/nonexistent-slug",
      "maturity/false-stable-claim",
      "distribution/false-installable-claim",
      "token/undeclared-css-var",
      "distribution/hostrequirements-leak",
      "distribution/hosthost-schema-consistency",
    ];
    for (const ruleId of rules) {
      const d = findingToDiagnostic(
        baseFinding({
          ruleId,
          subject: { kind: "component", id: "x" },
          details: `detail for ${ruleId}`,
        }),
      );
      expect(d.remediation, ruleId).toBeTruthy();
      expect(d.message).toBe(`detail for ${ruleId}`);
    }
  });

  it("allows missing location for internal findings", () => {
    const d = findingToDiagnostic(
      baseFinding({
        ruleId: "distribution/hostrequirements-leak",
        subject: { kind: "manifest", id: "button.json" },
        details: 'Generated manifest "button.json" leaks hostRequirements.',
      }),
    );
    expect(d.location).toBeUndefined();
  });
});

describe("sortDiagnostics", () => {
  it("sorts by file, position, ruleId, subject", () => {
    const items: GuardDiagnostic[] = [
      {
        ruleId: "component/nonexistent-slug",
        severity: "error",
        message: "b",
        location: { file: "b.tsx", line: 1, column: 1 },
        subject: { kind: "component", id: "b" },
        evidence: { source: "e" },
      },
      {
        ruleId: "component/nonexistent-slug",
        severity: "error",
        message: "a2",
        location: { file: "a.tsx", line: 2, column: 1 },
        subject: { kind: "component", id: "z" },
        evidence: { source: "e" },
      },
      {
        ruleId: "maturity/false-stable-claim",
        severity: "error",
        message: "a1",
        location: { file: "a.tsx", line: 1, column: 5 },
        subject: { kind: "component", id: "a" },
        evidence: { source: "e" },
      },
      {
        ruleId: "component/nonexistent-slug",
        severity: "error",
        message: "a0",
        location: { file: "a.tsx", line: 1, column: 1 },
        subject: { kind: "component", id: "a" },
        evidence: { source: "e" },
      },
    ];
    const sorted = sortDiagnostics(items);
    expect(sorted.map((d) => d.message)).toEqual(["a0", "a1", "a2", "b"]);
  });
});
