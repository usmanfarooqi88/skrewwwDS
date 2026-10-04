import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDistributedRegistryItems } from "@/lib/shadcn-registry-generator";

const root = process.cwd();
const sources = ["lib/ccv/runner", "lib/ccv/shadcn"].flatMap((dir) =>
  readdirSync(join(root, dir)).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts")).map((name) => join(dir, name)),
).concat("scripts/ccv-shadcn.ts");
const code = (file: string) => readFileSync(join(root, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("CCV-2 boundaries", () => {
  it("never contacts the production registry and never uses a floating tool version", () => {
    for (const file of sources) {
      expect(code(file), file).not.toMatch(/skrewww\.com/);
      expect(code(file), file).not.toMatch(/@latest\b|"latest"/);
    }
  });

  it("has no second item allowlist: no distributed slug is a literal in the runner or verifier", () => {
    // "foundation" is excluded only because it is also a CCV-1 file-kind literal (`own | internal | foundation`).
    const slugs = buildDistributedRegistryItems().map((item) => item.name).filter((name) => name !== "foundation");
    expect(slugs.length).toBeGreaterThan(40);
    for (const file of sources) for (const slug of slugs) expect(code(file), `${file} names "${slug}"`).not.toMatch(new RegExp(`["'\`]${slug}["'\`]`));
  });

  it("does not normalize installed bytes or allowlist the origin-marker transform", () => {
    const compare = code("lib/ccv/shadcn/compare-files.ts");
    expect(compare).toMatch(/ACCEPTED_INSTALLER_TRANSFORMS: readonly InstallerTransformId\[\] = \[\]/);
    const verify = code("lib/ccv/shadcn/verify.ts");
    expect(verify).not.toMatch(/ACCEPTED_INSTALLER_TRANSFORMS/);
    expect(verify).not.toMatch(/status: "pass"[^}]*UPSTREAM_TRANSFORM/);
  });

  it("does not touch Guard, the Audit Agent comparison layers, Figma or the npm package verifier", () => {
    for (const file of sources) {
      const imports = Array.from(code(file).matchAll(/from\s+"([^"]+)"/g), (match) => match[1]);
      for (const specifier of imports) expect(specifier, `${file} imports ${specifier}`).not.toMatch(/lib\/guard\/(?!provenance-marker)|lib\/audit\/(?!repo-source|collect-repo-facts)|figma|smoke-react-package|react-package|derive-npm-contract/i);
    }
  });

  it("leaves the existing smoke:consumer harness untouched", () => {
    expect(spawnSync("git", ["diff", "--quiet", "HEAD", "--", "scripts/smoke-test-consumer.ts"], { cwd: root }).status).toBe(0);
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts["smoke:consumer"]).toBe("tsx scripts/smoke-test-consumer.ts");
  });
});

describe("npm run ccv:shadcn — usage errors exit 1 before anything runs", () => {
  const tsx = join(root, "node_modules", ".bin", "tsx");
  const run = (...args: string[]) => spawnSync(tsx, ["scripts/ccv-shadcn.ts", ...args], { cwd: root, encoding: "utf8" });

  it("rejects public and npm modes, unknown items, bad flags and in-repo output paths", () => {
    expect(run("--mode", "PUBLIC_REGISTRY").status).toBe(1);
    expect(run("--mode", "PUBLIC_NPM").status).toBe(1);
    expect(run("--item", "no-such-item").status).toBe(1);
    expect(run("--install", "parallel").status).toBe(1);
    expect(run("--bogus").status).toBe(1);
    expect(run("--item").status).toBe(1);
    expect(run("--out", "lib").status).toBe(1);
    expect(run("--mode", "PUBLIC_REGISTRY").stderr).toMatch(/CCV-5/);
    expect(run("--compare", "only-one.json").status).toBe(1);
  }, 120_000);

  it("--compare works offline on saved results: identical stable sections exit 0, differences exit 3", () => {
    const dir = mkdtempSync(join(tmpdir(), "ccv-compare-"));
    try {
      const result = {
        schemaVersion: "1.0.0", distribution: "shadcn-registry", mode: "LOCAL_CANONICAL", subject: "all", environment: {},
        source: { expectedGitSha: "0123456789abcdef0123456789abcdef01234567" },
        checks: [{ checkId: "shadcn:all:file:a.ts", status: "pass", claim: "c", authority: "generator", evidence: [] }],
        summary: { pass: 1, fail: 0, unknown: 0, notApplicable: 0 },
      };
      writeFileSync(join(dir, "a.json"), JSON.stringify({ ...result, volatile: { durationMs: 1 } }));
      writeFileSync(join(dir, "b.json"), JSON.stringify({ ...result, volatile: { durationMs: 2 } }));
      writeFileSync(join(dir, "c.json"), JSON.stringify({ ...result, checks: [{ ...result.checks[0], actual: "x" }] }));
      const same = run("--compare", join(dir, "a.json"), join(dir, "b.json"));
      expect(same.status).toBe(0);
      expect(same.stdout).toMatch(/IDENTICAL/);
      const different = run("--compare", join(dir, "a.json"), join(dir, "c.json"));
      expect(different.status).toBe(3);
      expect(different.stdout).toMatch(/differs: shadcn:all:file:a\.ts/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});
