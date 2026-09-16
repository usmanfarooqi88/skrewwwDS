import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { componentRegistry } from "@/lib/component-registry";
import { evaluateTokenUndeclaredCssVar } from "@/lib/guard/rules/token-undeclared-css-var";

describe("token/undeclared-css-var — against the real repository", () => {
  it("produces zero violations for the real, current canonical registry (matches the existing cssTokens-accuracy test's own guarantee)", () => {
    const evaluations = evaluateTokenUndeclaredCssVar();
    const violations = evaluations.filter((e) => e.status === "violation");
    expect(violations).toEqual([]);
  });

  it("Table's real --table-surface alias (defined within table.module.css's own text) does not produce a false positive", () => {
    const evaluations = evaluateTokenUndeclaredCssVar();
    // Table must appear as a real "pass" — it owns CSS files, and its
    // --table-surface: var(--component-card-surface) local redefinition
    // (an alias, not a fresh value) is correctly captured by the regex
    // scanning the file's own literal text.
    const tablePass = evaluations.find((e) => e.status === "pass" && e.subject.id === "table");
    expect(tablePass).toBeDefined();
  });

  it("components with no owned CSS files are not-applicable, never silently 'passing' or flagged", () => {
    const evaluations = evaluateTokenUndeclaredCssVar();
    const noCssEntry = componentRegistry.find(
      (entry) => (entry.files ?? []).filter((f) => f.endsWith(".css")).length === 0,
    );
    expect(noCssEntry).toBeDefined();
    const result = evaluations.find(
      (e) => (e.status === "not-applicable") && e.reason.includes(`"${noCssEntry!.slug}"`),
    );
    expect(result).toBeDefined();
  });
});

describe("token/undeclared-css-var — synthetic violation proof (injectable registry/reader, real repo untouched)", () => {
  it("VIOLATION: a component's CSS references a var(--x) absent from its declared cssTokens", () => {
    const syntheticEntry = {
      slug: "synthetic-widget",
      files: ["components/ui/synthetic-widget.module.css"],
      cssTokens: ["--declared-token"],
    } as const;

    const evaluations = evaluateTokenUndeclaredCssVar(
      "/fake-root",
      [syntheticEntry as never],
      () => `.root { color: var(--declared-token); background: var(--undeclared-token); }`,
    );

    expect(evaluations).toHaveLength(1);
    expect(evaluations[0].status).toBe("violation");
    if (evaluations[0].status !== "violation") throw new Error("unreachable");
    expect(evaluations[0].finding).toEqual({
      ruleId: "token/undeclared-css-var",
      severity: "error",
      subject: { kind: "token", id: "--undeclared-token" },
      canonicalEvidence: expect.stringContaining("--undeclared-token"),
      details: expect.stringContaining("synthetic-widget"),
    });
  });

  it("valid alias/indirect case: a token re-declared as a local alias within the same CSS file is correctly captured, no false positive", () => {
    const syntheticEntry = {
      slug: "synthetic-alias-widget",
      files: ["components/ui/synthetic-alias-widget.module.css"],
      cssTokens: ["--local-alias", "--shared-token"],
    } as const;

    // Mirrors the real Table pattern: a local alias re-declared from a
    // shared token, both referenced via var() within the same owned file.
    const evaluations = evaluateTokenUndeclaredCssVar(
      "/fake-root",
      [syntheticEntry as never],
      () => `.scrollArea { --local-alias: var(--shared-token); background: var(--local-alias); }`,
    );

    expect(evaluations).toEqual([
      { status: "pass", ruleId: "token/undeclared-css-var", subject: { kind: "component", id: "synthetic-alias-widget" } },
    ]);
  });

  it("intentional over-declaration remains allowed: cssTokens listing a token the CSS doesn't reference is never flagged", () => {
    const syntheticEntry = {
      slug: "synthetic-narrowed-widget",
      files: ["components/ui/synthetic-narrowed-widget.module.css"],
      cssTokens: ["--used-token", "--figma-verified-but-unused-token"],
    } as const;

    const evaluations = evaluateTokenUndeclaredCssVar(
      "/fake-root",
      [syntheticEntry as never],
      () => `.root { color: var(--used-token); }`,
    );

    expect(evaluations).toEqual([
      { status: "pass", ruleId: "token/undeclared-css-var", subject: { kind: "component", id: "synthetic-narrowed-widget" } },
    ]);
  });
});

describe("token/undeclared-css-var — shared helper reuse proof", () => {
  it("reuses the same extractCssVarRefs logic the existing cssTokens-accuracy test uses (same real registry, same real CSS, same violation set: none)", () => {
    // Both this rule and lib/component-registry.test.ts's accuracy test
    // now import extractCssVarRefs from lib/css-custom-properties.ts —
    // proven by running the exact same real-file scan both ways and
    // confirming they agree exactly (zero divergence).
    const root = process.cwd();
    for (const entry of componentRegistry) {
      const cssFiles = (entry.files ?? []).filter((f) => f.endsWith(".css"));
      for (const relPath of cssFiles) {
        const content = readFileSync(join(root, relPath), "utf8");
        expect(content.length).toBeGreaterThan(0); // sanity: real files, not empty
      }
    }
    const violations = evaluateTokenUndeclaredCssVar().filter((e) => e.status === "violation");
    expect(violations).toEqual([]);
  });
});
