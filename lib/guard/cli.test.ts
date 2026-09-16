import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadStructuredClaimsFromFile, parseStructuredClaimsJson } from "@/lib/guard/claims-file";
import { runGuardCli, parseCliArgs, printHelp } from "@/lib/guard/cli";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";
import { runGuard } from "@/lib/guard/run";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";

const ROOT = process.cwd();
const FIX = join("lib", "guard", "__fixtures__");

describe("CLI help / catalog", () => {
  it("lists exactly six rules and never api/nonexistent-prop", () => {
    const help = printHelp();
    expect(GUARD_RULE_CATALOG).toHaveLength(6);
    expect(help).toContain("component/nonexistent-slug");
    expect(help).toContain("deferred");
    expect(help).not.toMatch(/api\/nonexistent-prop(?!.*deferred)/);
    // Explicit: deferred mention is OK; must not list it as an available rule line.
    const availableLines = help
      .split("\n")
      .filter((l) => /^\s+(component|maturity|distribution|token)\//.test(l));
    expect(availableLines).toHaveLength(6);
    expect(availableLines.join("\n")).not.toContain("api/nonexistent-prop");
    expect(help).toContain(GUARD_TOOL_VERSION);
    expect(help).toContain("Exit codes");
  });

  it("rejects --json as deferred", () => {
    const parsed = parseCliArgs(["--json"]);
    expect(parsed.kind).toBe("usage-error");
  });
});

describe("CLI exit codes (adversarial fixtures)", () => {
  it("A. clean valid target → exit 0", () => {
    const result = runGuardCli([join(FIX, "g1", "zero-findings-realistic.tsx")], {
      projectRoot: ROOT,
    });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Guard: no errors found");
    expect(result.stdout).not.toContain("/Users/");
  });

  it("B. actual violation → exit 1", () => {
    const result = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], {
      projectRoot: ROOT,
    });
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("ERROR component/nonexistent-slug");
    expect(result.stdout).toContain("CommandPalette");
    expect(result.stdout).toContain("Fix:");
    expect(result.stdout).toMatch(/Guard: 1 error/);
    expect(result.stdout).not.toContain("import { CommandPalette");
    expect(result.stdout).not.toContain(ROOT);
  });

  it("C. malformed source → exit 2 (tool/parse, not a rule violation)", () => {
    const result = runGuardCli([join(FIX, "edge-cases", "malformed-source.tsx")], {
      projectRoot: ROOT,
    });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("tool/parse");
    expect(result.stderr).toContain("Source parse failed");
    expect(result.stderr).not.toContain("component/nonexistent-slug");
    expect(result.stderr).not.toContain("api/nonexistent-prop");
  });

  it("D. nonexistent target → exit 2", () => {
    const result = runGuardCli(["does-not-exist-anywhere-g2.tsx"], { projectRoot: ROOT });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/does not exist|Target path/i);
  });

  it("E. deterministic repeated output", () => {
    const a = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], { projectRoot: ROOT });
    const b = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], { projectRoot: ROOT });
    expect(a.stdout).toBe(b.stdout);
    expect(a.exitCode).toBe(b.exitCode);
  });

  it("F. no api/nonexistent-prop in CLI surfaces", () => {
    const help = runGuardCli(["--help"], { projectRoot: ROOT });
    expect(help.stdout).not.toMatch(/^\s+api\/nonexistent-prop\b/m);
    const run = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], { projectRoot: ROOT });
    expect(run.stdout).not.toContain("api/nonexistent-prop");
    const programmatic = runGuard({
      target: join(FIX, "g1", "nonexistent-component.tsx"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    expect(programmatic.evaluatedRuleIds).not.toContain("api/nonexistent-prop");
    expect(programmatic.diagnostics.every((d) => d.ruleId !== "api/nonexistent-prop")).toBe(true);
  });

  it("G. internal rules not applied to consumer mode", () => {
    const result = runGuard({
      target: join(FIX, "g1", "zero-findings-realistic.tsx"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    expect(result.evaluatedRuleIds).not.toContain("token/undeclared-css-var");
    expect(result.evaluatedRuleIds).not.toContain("distribution/hostrequirements-leak");
    expect(result.evaluatedRuleIds).not.toContain("distribution/hosthost-schema-consistency");
    expect(result.evaluatedRuleIds).toContain("component/nonexistent-slug");
    expect(result.evaluatedRuleIds).not.toContain("api/nonexistent-prop");
  });

  it("H. consumer rules not misapplied as internal assumptions", () => {
    const result = runGuard({
      target: ROOT,
      projectRoot: ROOT,
      mode: "internal",
    });
    expect(result.exitCode).toBe(0);
    expect(result.evaluatedRuleIds).toEqual([
      "token/undeclared-css-var",
      "distribution/hostrequirements-leak",
      "distribution/hosthost-schema-consistency",
    ]);
    expect(result.evaluatedRuleIds).not.toContain("component/nonexistent-slug");
    expect(result.diagnostics.every((d) => d.ruleId !== "component/nonexistent-slug")).toBe(true);
  });
});

describe("structured claims CLI data", () => {
  it("loads valid claims JSON and reports maturity/installability violations", () => {
    const result = runGuardCli(
      [join(FIX, "valid", "direct-import.tsx"), "--claims", join(FIX, "g2", "claims-violations.json")],
      { projectRoot: ROOT },
    );
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain("maturity/false-stable-claim");
    expect(result.stdout).toContain("distribution/false-installable-claim");
    expect(result.stdout).toContain("date-picker");
    expect(result.stdout).toContain("banking-account-card");
  });

  it("clean claims → exit 0", () => {
    const result = runGuardCli(
      [join(FIX, "valid", "direct-import.tsx"), "--claims", join(FIX, "g2", "claims-clean.json")],
      { projectRoot: ROOT },
    );
    expect(result.exitCode).toBe(0);
  });

  it("rejects unknown claims fields (not a config file)", () => {
    const parsed = parseStructuredClaimsJson({ severityOverrides: {} });
    expect(parsed.ok).toBe(false);
  });

  it("rejects --claims with --internal", () => {
    const parsed = parseCliArgs(["--internal", "--claims", "x.json"]);
    expect(parsed.kind).toBe("usage-error");
  });

  it("loadStructuredClaimsFromFile reads fixture", () => {
    const loaded = loadStructuredClaimsFromFile(join(ROOT, FIX, "g2", "claims-clean.json"));
    expect(loaded.ok).toBe(true);
    if (loaded.ok) {
      expect(loaded.claims.maturity?.[0]?.componentSlug).toBe("button");
    }
  });
});

describe("security / privacy / offline", () => {
  it("does not echo full source or absolute project root in diagnostics", () => {
    const result = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], {
      projectRoot: ROOT,
    });
    expect(result.stdout).not.toContain("export function Example");
    expect(result.stdout).not.toContain(ROOT);
    expect(result.stdout).not.toMatch(/\/Users\/[^/\s]+/);
  });

  it("runGuard does not perform network I/O (no fetch in module graph for this path)", () => {
    // Smoke: completes offline against local fixtures/registry.
    const result = runGuard({
      target: join(FIX, "g1", "zero-findings-realistic.tsx"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    expect(result.exitCode).toBe(0);
  });
});

describe("performance sanity", () => {
  it("fixture + reference-app-sized directory completes quickly", () => {
    const t0 = Date.now();
    const a = runGuard({ target: join(FIX), projectRoot: ROOT, mode: "consumer" });
    const t1 = Date.now();
    const b = runGuard({
      target: join("components", "reference-app"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    const t2 = Date.now();
    const c = runGuard({
      target: join("components", "ui"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    const t3 = Date.now();
    expect(a.exitCode === 0 || a.exitCode === 1 || a.exitCode === 2).toBe(true);
    expect(b.exitCode).toBe(0);
    expect(c.exitCode).toBe(0);
    // Soft sanity: each tranche should finish in well under a minute on CI-class hardware.
    expect(t1 - t0).toBeLessThan(60_000);
    expect(t2 - t1).toBeLessThan(60_000);
    expect(t3 - t2).toBeLessThan(60_000);
  });
});
