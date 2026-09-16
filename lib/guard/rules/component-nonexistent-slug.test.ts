import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractSourceFacts } from "@/lib/guard/facts";
import { evaluateComponentNonexistentSlug } from "@/lib/guard/rules/component-nonexistent-slug";

const FIXTURES_DIR = join(process.cwd(), "lib/guard/__fixtures__");

function evaluateFixture(relativePath: string) {
  const content = readFileSync(join(FIXTURES_DIR, relativePath), "utf8");
  const facts = extractSourceFacts({ path: relativePath, content });
  return evaluateComponentNonexistentSlug(facts);
}

describe("component/nonexistent-slug", () => {
  it("PASS: a real Skrewww component resolves to pass, not a finding", () => {
    const evaluations = evaluateFixture("valid/direct-import.tsx");
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]).toEqual({
      status: "pass",
      ruleId: "component/nonexistent-slug",
      subject: { kind: "component", id: "button" },
    });
  });

  it("FAIL: a proven Skrewww-path import naming a nonexistent component is a violation", () => {
    const evaluations = evaluateFixture("g1/nonexistent-component.tsx");
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].status).toBe("violation");
    if (evaluations[0].status !== "violation") throw new Error("unreachable");
    expect(evaluations[0].finding).toEqual({
      ruleId: "component/nonexistent-slug",
      severity: "error",
      subject: { kind: "component", id: "CommandPalette" },
      location: { path: "g1/nonexistent-component.tsx", range: expect.anything() },
      canonicalEvidence: expect.stringContaining("@/components/ui/CommandPalette"),
      details: expect.stringContaining("CommandPalette"),
    });
  });

  it("NO FINDING: a local, user-owned component sharing a Skrewww component's name is not-applicable, never a finding", () => {
    const evaluations = evaluateFixture("edge-cases/local-button-name.tsx");
    expect(evaluations.every((e) => e.status === "not-applicable")).toBe(true);
  });

  it("NO FINDING: the same name imported from a non-Skrewww local module is not-applicable, never a finding", () => {
    const evaluations = evaluateFixture("edge-cases/local-button-import.tsx");
    expect(evaluations.every((e) => e.status === "not-applicable")).toBe(true);
  });

  it("NO FINDING: a wrapper component's outer call site is not-applicable; the inner real Skrewww usage independently passes", () => {
    const evaluations = evaluateFixture("edge-cases/wrapper-component.tsx");
    expect(evaluations).toHaveLength(2);
    const outer = evaluations.find((e) => e.status === "not-applicable");
    const inner = evaluations.find((e) => e.status === "pass");
    expect(outer).toBeDefined();
    expect(inner).toEqual({
      status: "pass",
      ruleId: "component/nonexistent-slug",
      subject: { kind: "component", id: "button" },
    });
  });

  it("NO FINDING: ordinary native HTML elements are not-applicable", () => {
    const evaluations = evaluateFixture("valid/native-elements.tsx");
    const intrinsicCount = evaluations.filter((e) => e.status === "not-applicable").length;
    expect(intrinsicCount).toBe(2); // div + span
    expect(evaluations.filter((e) => e.status === "pass")).toHaveLength(1); // the real Button
  });

  it("NO FINDING: compound sub-component names re-exported from one file via the barrel (DrawerTrigger, DrawerContent, DrawerBody — all really exported from Drawer.tsx, not files of their own) all resolve to the real 'drawer' slug, never a false violation", () => {
    const evaluations = evaluateFixture("g1/compound-component-barrel-import.tsx");
    expect(evaluations).toHaveLength(4);
    expect(evaluations.every((e) => e.status === "pass")).toBe(true);
    expect(evaluations.every((e) => e.status === "pass" && e.subject.id === "drawer")).toBe(true);
  });

  it("a malformed source file (real parse error) produces zero rule evaluations, never a false finding", () => {
    const evaluations = evaluateFixture("edge-cases/malformed-source.tsx");
    expect(evaluations).toEqual([]);
  });
});
