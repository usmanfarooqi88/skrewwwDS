/**
 * G-3 release-validation suite — permanent regressions for pilot gates.
 * Avoids duplicating every G-1/G-2 unit case; focuses on process/CLI,
 * privacy, catalog lock, mode isolation, and packaging/fact honesty.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runGuardCli, printHelp } from "@/lib/guard/cli";
import { discoverSourceFiles } from "@/lib/guard/discover";
import { evaluateDistributionHosthostSchemaConsistency } from "@/lib/guard/rules/distribution-hosthost-schema-consistency";
import { evaluateDistributionHostrequirementsLeak } from "@/lib/guard/rules/distribution-hostrequirements-leak";
import { evaluateTokenUndeclaredCssVar } from "@/lib/guard/rules/token-undeclared-css-var";
import { GUARD_RULE_CATALOG } from "@/lib/guard/rules";
import { runGuard } from "@/lib/guard/run";
import { GUARD_TOOL_VERSION } from "@/lib/guard/version";
import { toProjectRelativePath } from "@/lib/guard/paths";

const ROOT = process.cwd();
const FIX = join("lib", "guard", "__fixtures__");

function spawnGuard(args: string[]): { code: number | null; stdout: string; stderr: string } {
  const tsxBin = join(ROOT, "node_modules", ".bin", "tsx");
  const result = spawnSync(tsxBin, ["scripts/guard.ts", ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return {
    code: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("G-3 six-rule lock", () => {
  it("registers exactly six rules and excludes deferred/out-of-scope IDs", () => {
    expect(GUARD_RULE_CATALOG).toHaveLength(6);
    const ids = GUARD_RULE_CATALOG.map((e) => e.id);
    expect(ids).toEqual([
      "component/nonexistent-slug",
      "maturity/false-stable-claim",
      "distribution/false-installable-claim",
      "token/undeclared-css-var",
      "distribution/hostrequirements-leak",
      "distribution/hosthost-schema-consistency",
    ]);
    for (const banned of [
      "api/nonexistent-prop",
      "distribution/missing-registry-dependency",
      "token/hardcoded-primitive-where-provable",
    ]) {
      expect(ids).not.toContain(banned);
    }
    expect(ids.some((id) => id.startsWith("shape/") || id.startsWith("surface/") || id.startsWith("accessibility/"))).toBe(
      false,
    );
  });
});

describe("G-3 dogfood / pilots (process-level)", () => {
  it(
    "internal dogfood → exit 0",
    () => {
      const r = spawnGuard(["--internal", "."]);
      expect(r.code).toBe(0);
      expect(r.stdout).toContain("Guard: no errors found");
    },
    30_000,
  );

  it(
    "consumer Reference App + components/ui → exit 0",
    () => {
      expect(spawnGuard(["components/reference-app"]).code).toBe(0);
      expect(spawnGuard(["components/ui"]).code).toBe(0);
    },
    60_000,
  );

  it(
    "invalid consumer fixture → exit 1 with actionable diagnostic",
    () => {
      const r = spawnGuard([join(FIX, "g1", "nonexistent-component.tsx")]);
      expect(r.code).toBe(1);
      expect(r.stdout).toContain("ERROR component/nonexistent-slug");
      expect(r.stdout).toContain("Fix:");
      expect(r.stdout).not.toContain("/Users/");
    },
    30_000,
  );

  it(
    "claims valid/invalid/malformed → 0 / 1 / 2",
    () => {
      expect(
        spawnGuard([
          join(FIX, "valid", "direct-import.tsx"),
          "--claims",
          join(FIX, "g2", "claims-clean.json"),
        ]).code,
      ).toBe(0);
      const bad = spawnGuard([
        join(FIX, "valid", "direct-import.tsx"),
        "--claims",
        join(FIX, "g2", "claims-violations.json"),
      ]);
      expect(bad.code).toBe(1);
      expect(bad.stdout).toContain("maturity/false-stable-claim");
      expect(bad.stdout).toContain("distribution/false-installable-claim");

      const tmp = mkdtempSync(join(tmpdir(), "g3-claims-"));
      try {
        const claimsPath = join(tmp, "bad.json");
        writeFileSync(claimsPath, "{not-json", "utf8");
        const malformed = spawnGuard([join(FIX, "valid", "direct-import.tsx"), "--claims", claimsPath]);
        expect(malformed.code).toBe(2);
        expect(malformed.stderr).toContain("tool/claims");
        expect(malformed.stderr).not.toContain("/Users/");
        expect(malformed.stderr).not.toMatch(/\/tmp\/g3-claims-/);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    },
    60_000,
  );

  it(
    "malformed source and missing path → exit 2 (not rule ERROR)",
    () => {
      const parse = spawnGuard([join(FIX, "edge-cases", "malformed-source.tsx")]);
      expect(parse.code).toBe(2);
      expect(parse.stderr).toContain("tool/parse");
      expect(parse.stderr).not.toContain("component/nonexistent-slug");

      const missing = spawnGuard(["does-not-exist-g3-release.tsx"]);
      expect(missing.code).toBe(2);
      expect(missing.stderr).toContain("tool/io");
    },
    30_000,
  );
});

describe("G-3 false-positive stress", () => {
  it("adversarial valid fixtures produce zero findings", () => {
    const files = [
      "edge-cases/local-button-name.tsx",
      "edge-cases/local-button-import.tsx",
      "edge-cases/wrapper-component.tsx",
      "valid/aliased-import.tsx",
      "valid/barrel-import.tsx",
      "g1/compound-component-barrel-import.tsx",
      "edge-cases/spread-props.tsx",
      "edge-cases/dynamic-prop-value.tsx",
      "valid/native-elements.tsx",
      "g1/zero-findings-realistic.tsx",
    ];
    for (const rel of files) {
      const r = runGuard({ target: join(FIX, rel), projectRoot: ROOT, mode: "consumer" });
      expect(r.exitCode, rel).toBe(0);
      expect(r.diagnostics, rel).toEqual([]);
    }
  });
});

describe("G-3 internal synthetic violations", () => {
  it("token/undeclared-css-var fires on injectable registry+css reader", () => {
    const tmp = mkdtempSync(join(tmpdir(), "g3-token-"));
    try {
      writeFileSync(join(tmp, "x.css"), ".x { color: var(--missing-token); }", "utf8");
      const evals = evaluateTokenUndeclaredCssVar(
        tmp,
        [{ slug: "x", files: ["x.css"], cssTokens: [] } as never],
        (absolutePath) => (existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : undefined),
      );
      const violations = evals.filter((e) => e.status === "violation");
      expect(violations).toHaveLength(1);
      if (violations[0]?.status === "violation") {
        expect(violations[0].finding.ruleId).toBe("token/undeclared-css-var");
        expect(violations[0].finding.subject.id).toBe("--missing-token");
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("hostrequirements-leak and hosthost-schema-consistency fire on synthetic artifacts", () => {
    const leak = evaluateDistributionHostrequirementsLeak([
      { fileName: "leaky.json", json: { name: "x", hostRequirements: ["react"] } },
    ]);
    expect(leak.some((e) => e.status === "violation")).toBe(true);

    const schema = evaluateDistributionHosthostSchemaConsistency(
      [{ fileName: "bad-contract.json", json: { slug: "x", $schema: "https://example.com" } }],
      [{ fileName: "bad-manifest.json", json: { name: "x", guidance: {}, tokens: {} } }],
    );
    const viol = schema.filter((e) => e.status === "violation");
    expect(viol.length).toBeGreaterThanOrEqual(2);
  });
});

describe("G-3 privacy / discovery / determinism", () => {
  it("source privacy: does not echo SECRET_TEST_VALUE", () => {
    const r = runGuardCli([join(FIX, "g3", "source-privacy-secret.tsx")], { projectRoot: ROOT });
    expect(r.exitCode).toBe(1);
    expect(r.stdout).not.toContain("do-not-print-this-value");
    expect(r.stdout).not.toContain("SECRET_TEST_VALUE");
    expect(r.stdout).not.toContain("const SECRET");
  });

  it("absolute CLI target still emits project-relative diagnostic paths", () => {
    const abs = join(ROOT, FIX, "g1", "nonexistent-component.tsx");
    const r = runGuardCli([abs], { projectRoot: ROOT });
    expect(r.stdout).toContain("lib/guard/__fixtures__/g1/nonexistent-component.tsx");
    expect(r.stdout).not.toContain("/Users/");
  });

  it("outside-root paths collapse to basename", () => {
    expect(toProjectRelativePath("/tmp/outside-g3/file.tsx", ROOT)).toBe("file.tsx");
  });

  it("file discovery skips ignored dirs and ignores symlink loops", () => {
    const tmp = mkdtempSync(join(tmpdir(), "g3-disc-"));
    try {
      mkdirSync(join(tmp, "src"));
      mkdirSync(join(tmp, "node_modules", "pkg"), { recursive: true });
      mkdirSync(join(tmp, ".next"));
      mkdirSync(join(tmp, "dist"));
      mkdirSync(join(tmp, "coverage"));
      writeFileSync(join(tmp, "src", "a.tsx"), "export const A = 1;\n", "utf8");
      writeFileSync(join(tmp, "src", "b.ts"), "export const B = 1;\n", "utf8");
      writeFileSync(join(tmp, "src", "asset.png"), "x", "utf8");
      writeFileSync(join(tmp, "node_modules", "pkg", "skip.tsx"), "export {};\n", "utf8");
      writeFileSync(join(tmp, ".next", "skip.tsx"), "export {};\n", "utf8");
      writeFileSync(join(tmp, "dist", "skip.tsx"), "export {};\n", "utf8");
      try {
        symlinkSync(tmp, join(tmp, "src", "loop"));
      } catch {
        // symlink may fail on some CI FS — discovery still must not include node_modules
      }
      const found = discoverSourceFiles(tmp, tmp);
      expect(found).toEqual(["src/a.tsx", "src/b.ts"]);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("parse-mix directory: exit 2, parse reported, valid files still evaluated", () => {
    const r = runGuard({
      target: join(FIX, "g3", "parse-mix"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    expect(r.exitCode).toBe(2);
    expect(r.executionErrors.some((e) => e.kind === "parse")).toBe(true);
    expect(r.executionErrors.every((e) => e.file && !e.file.includes("/Users/"))).toBe(true);
    // valid-a / valid-b should produce zero slug violations
    expect(r.diagnostics.filter((d) => d.ruleId === "component/nonexistent-slug")).toEqual([]);
  });

  it("deterministic repeated CLI output", () => {
    const a = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], { projectRoot: ROOT });
    const b = runGuardCli([join(FIX, "g1", "nonexistent-component.tsx")], { projectRoot: ROOT });
    expect(a.stdout).toBe(b.stdout);
    expect(a.exitCode).toBe(b.exitCode);
  });
});

describe("G-3 mode isolation + help honesty", () => {
  it("consumer never evaluates internal rule IDs; internal never evaluates public source rules", () => {
    const consumer = runGuard({
      target: join(FIX, "g1", "zero-findings-realistic.tsx"),
      projectRoot: ROOT,
      mode: "consumer",
    });
    expect(consumer.evaluatedRuleIds).toEqual([
      "component/nonexistent-slug",
      "maturity/false-stable-claim",
      "distribution/false-installable-claim",
    ]);
    const internal = runGuard({ target: ".", projectRoot: ROOT, mode: "internal" });
    expect(internal.evaluatedRuleIds).toEqual([
      "token/undeclared-css-var",
      "distribution/hostrequirements-leak",
      "distribution/hosthost-schema-consistency",
    ]);
  });

  it("help states TypeScript boundary and non-claims for a11y/Figma", () => {
    const help = printHelp();
    expect(help).toContain(GUARD_TOOL_VERSION);
    expect(help).toMatch(/Does not replace TypeScript/i);
    expect(help).toMatch(/accessibility/i);
    expect(help).toMatch(/Figma/i);
    expect(help).not.toMatch(/^\s+api\/nonexistent-prop\b/m);
    expect(help).toContain("Not a Guard config file");
  });
});

describe("G-3 packaging / external fact honesty", () => {
  it("repo package is private with no bin — Guard is not a published CLI today", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      private?: boolean;
      bin?: unknown;
      name: string;
    };
    expect(pkg.private).toBe(true);
    expect(pkg.bin).toBeUndefined();
    expect(pkg.name).toBe("skrewww-docs");
  });

  it("consumer claims path loads in-repo componentRegistry facts (not a portable fact bundle)", () => {
    // Honesty gate: loadInternalComponentFacts is wired into runGuard claims.
    // External install would require packaging those facts — recorded as
    // pre-release prerequisite, not silently assumed.
    const source = readFileSync(join(ROOT, "lib/guard/run.ts"), "utf8");
    expect(source).toContain("loadInternalComponentFacts");
    expect(existsSync(join(ROOT, "lib/component-registry.ts"))).toBe(true);
    expect(existsSync(join(ROOT, "public/agent/contracts/button.json"))).toBe(true);
  });

  it("no network clients in Guard runtime modules", () => {
    const files = [
      "lib/guard/run.ts",
      "lib/guard/cli.ts",
      "lib/guard/diagnostics.ts",
      "lib/guard/provenance.ts",
      "lib/guard/component-facts.ts",
      "lib/guard/evaluate.ts",
    ];
    for (const file of files) {
      const text = readFileSync(join(ROOT, file), "utf8");
      expect(text, file).not.toMatch(/\bfetch\s*\(/);
      expect(text, file).not.toMatch(/\baxios\b/);
      expect(text, file).not.toMatch(/api\.openai|anthropic|figma\.com/i);
    }
  });
});
