import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { deriveNpmContract } from "@/lib/ccv/derive-npm-contract";
import { CCV_VITE_CONSUMER_PINS } from "@/lib/ccv/npm/consumer";

const root = process.cwd();
const sources = readdirSync(join(root, "lib/ccv/npm")).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts")).map((name) => join("lib/ccv/npm", name)).concat("scripts/ccv-npm.ts");
const code = (file: string) => readFileSync(join(root, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("CCV-3 boundaries", () => {
  it("pins the consumer tools to the versions the repository lockfile already resolved", () => {
    const lock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8")) as { packages: Record<string, { version?: string }> };
    for (const [name, version] of Object.entries(CCV_VITE_CONSUMER_PINS)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
      expect(lock.packages[`node_modules/${name}`]?.version, name).toBe(version);
    }
  });

  it("never publishes, never queries public npm for the package, never uses a floating version", () => {
    for (const file of sources) {
      expect(code(file), file).not.toMatch(/npm\s+publish|"publish"|--from-registry|registry\.npmjs\.org|npm view|@latest\b|"latest"/);
    }
  });

  it("keeps no hand-maintained export, type or specifier list: no contract name is a literal in the verifier", () => {
    const e = deriveNpmContract({ gitSha: "0".repeat(40) }).expectations;
    for (const file of sources) {
      for (const name of [...e.exports.values, ...e.exports.types]) expect(code(file), `${file} names ${name}`).not.toMatch(new RegExp(`["'\`]${name}["'\`]`));
      expect(code(file), file).not.toMatch(/components\/ui\//);
    }
  });

  it("does not touch Guard, Figma, Make Kit, the shadcn verifier or the existing package smoke", () => {
    for (const file of sources) {
      const imports = Array.from(code(file).matchAll(/from\s+"([^"]+)"/g), (match) => match[1]);
      for (const specifier of imports) expect(specifier, `${file} imports ${specifier}`).not.toMatch(/lib\/guard|figma|make-kit|shadcn\/verify|smoke-react-package|smoke-test-consumer/i);
    }
    for (const file of ["scripts/smoke-react-package.ts", "scripts/smoke-test-consumer.ts", "packages/react/package.json"]) {
      expect(spawnSync("git", ["diff", "--quiet", "HEAD", "--", file], { cwd: root }).status, file).toBe(0);
    }
  });
});

describe("npm run ccv:npm — usage errors exit 1 before anything runs", () => {
  const tsx = join(root, "node_modules", ".bin", "tsx");
  const run = (...args: string[]) => spawnSync(tsx, ["scripts/ccv-npm.ts", ...args], { cwd: root, encoding: "utf8" });
  it("rejects PUBLIC_NPM and other modes, bad flags and in-repo output paths", () => {
    expect(run("--mode", "PUBLIC_NPM").status).toBe(1);
    expect(run("--mode", "PUBLIC_NPM").stderr).toMatch(/CCV-5/);
    expect(run("--mode", "LOCAL_CANONICAL").status).toBe(1);
    expect(run("--bogus").status).toBe(1);
    expect(run("--out", "lib").status).toBe(1);
    expect(run("--compare", "only-one.json").status).toBe(1);
  }, 120_000);
});
