import { describe, expect, it } from "vitest";
import type { GuardDiagnostic } from "@/lib/guard/diagnostics";
import { formatGuardResult, formatGuardSummary } from "@/lib/guard/format";

const sample: GuardDiagnostic = {
  ruleId: "component/nonexistent-slug",
  severity: "error",
  message:
    'Claimed a Skrewww component "CommandPalette" via "@/components/ui/CommandPalette", but no such component exists in the canonical registry.',
  location: {
    file: "lib/guard/__fixtures__/g1/nonexistent-component.tsx",
    line: 7,
    column: 11,
  },
  subject: { kind: "component", id: "CommandPalette" },
  evidence: { source: "lib/component-registry.ts: no entry..." },
  remediation: "Use a canonical Skrewww component slug, or remove the Skrewww-path import claim.",
};

describe("formatGuardResult", () => {
  it("renders compact human output with Fix line and summary", () => {
    const out = formatGuardResult({ diagnostics: [sample] });
    expect(out).toContain("ERROR component/nonexistent-slug");
    expect(out).toContain("lib/guard/__fixtures__/g1/nonexistent-component.tsx:7:11");
    expect(out).toContain("CommandPalette");
    expect(out).toContain("Fix: Use a canonical Skrewww component");
    expect(out).toContain("Guard: 1 error in 1 file");
    expect(out).not.toMatch(/╔|══|ansi/i);
  });

  it("summarizes clean runs", () => {
    expect(formatGuardSummary([])).toBe("Guard: no errors found");
  });

  it("is deterministic across repeated calls", () => {
    const a = formatGuardResult({ diagnostics: [sample] });
    const b = formatGuardResult({ diagnostics: [sample] });
    expect(a).toBe(b);
  });

  it("formats execution errors without treating them as rule IDs", () => {
    const out = formatGuardResult({
      diagnostics: [],
      executionErrors: [
        {
          kind: "parse",
          message: "Source parse failed: '}' expected.",
          file: "lib/guard/__fixtures__/edge-cases/malformed-source.tsx:4:1",
        },
      ],
    });
    expect(out).toContain("ERROR tool/parse");
    expect(out).toContain("Source parse failed");
    expect(out).toContain("Guard: no errors found");
    expect(out).not.toContain("api/nonexistent-prop");
  });
});
