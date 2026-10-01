/**
 * Build or check the Make Kit guideline set (MK-2B). Never publishes, never
 * touches the network or Figma, and never modifies canonical sources.
 *
 *   npm run build:make-guidelines   writes make-kit/dist/ (generated, gitignored)
 *   npm run check:make-guidelines   compiles in memory and validates; no writes
 *     --verify-dist                 also cross-checks the exports against a built
 *                                   packages/react/dist (run after the package build)
 *
 * The check compiles twice and requires byte-identical output, validates the
 * package/contract/status mapping (the compiler throws on any drift), and, if
 * make-kit/dist already exists, requires it to match a fresh compile (ignoring
 * only the commit-specific provenance fields) so stale output is caught.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadMakeKitInputs } from "../lib/make-kit/inputs";
import { compileMakeKit } from "../lib/make-kit/compiler";
import type { MakeKitFile, MakeKitInput, MakeKitOutput } from "../lib/make-kit/types";
import { checkDistIntegrity, extractExportedNames } from "../lib/react-package/release-checks";
import { buildReactPackageEntry } from "../lib/react-package/pilot-entry";
import { componentRegistry } from "../lib/component-registry";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "make-kit", "dist");

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: root }).toString().trim();
}

function compile(): { input: MakeKitInput; output: MakeKitOutput } {
  const input = loadMakeKitInputs(root, {
    sourceGitSha: git("rev-parse HEAD"),
    // %cI: committer date, strict ISO 8601 — deterministic per SHA (same convention as the Agent contracts).
    sourceGitCommitTimestamp: git("log -1 --format=%cI"),
  });
  return { input, output: compileMakeKit(input) };
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Drops the commit-specific provenance fields so output can be compared across commits. */
function comparable(file: MakeKitFile): string {
  if (file.path !== "manifest.json") return file.content;
  const manifest = JSON.parse(file.content);
  delete manifest.provenance.sourceGitSha;
  delete manifest.provenance.sourceGitCommitTimestamp;
  return JSON.stringify(manifest);
}

function build(): void {
  const { output } = compile();
  rmSync(outDir, { recursive: true, force: true });
  for (const file of output.files) {
    const path = join(outDir, file.path);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, file.content, "utf8");
  }
  const m = output.manifest;
  console.log(`Make Kit guidelines written to make-kit/dist (${output.files.length} files) for ${m.package.name}@${m.package.version}.`);
  console.log(`  components: ${m.components.map((c) => `${c.slug} (${c.status})`).join(", ")}`);
  console.log(`  digest: ${m.provenance.guidelinesDigest.slice(0, 16)}… · source: ${m.provenance.sourceGitSha.slice(0, 9)}`);
  console.log("Generated; not committed. No Make Kit was created and nothing was published.");
}

function check(verifyDist: boolean): void {
  const issues: string[] = [];
  const first = compile();
  const second = compile();
  const identical = first.output.files.length === second.output.files.length && first.output.files.every((file, i) => file.path === second.output.files[i].path && file.content === second.output.files[i].content);
  if (!identical) issues.push("compiling twice produced different bytes (output is not deterministic)");

  if (existsSync(outDir)) {
    const onDisk = new Map(walk(outDir).map((path) => [path.slice(outDir.length + 1), readFileSync(path, "utf8")]));
    for (const file of first.output.files) {
      const existing = onDisk.get(file.path);
      if (existing === undefined) issues.push(`make-kit/dist is missing ${file.path} (stale output — rebuild)`);
      else if (comparable({ path: file.path, content: existing }) !== comparable(file)) issues.push(`make-kit/dist/${file.path} differs from a fresh compile (stale output — rebuild)`);
      onDisk.delete(file.path);
    }
    for (const extra of Array.from(onDisk.keys())) issues.push(`make-kit/dist has an unexpected file: ${extra}`);
  }

  if (verifyDist) {
    const distDir = join(root, "packages", "react", "dist");
    if (!existsSync(distDir)) {
      issues.push("--verify-dist was requested but packages/react/dist does not exist (run npm run build:react-package first)");
    } else {
      const barrel = readFileSync(join(root, "components", "ui", "index.ts"), "utf8");
      const expected = extractExportedNames(buildReactPackageEntry(componentRegistry, barrel).source);
      for (const issue of checkDistIntegrity(distDir, expected)) issues.push(issue.message);
      // Every export the guidelines promise must exist in the BUILT package, not just the source entry.
      const builtJs = readFileSync(join(distDir, "index.js"), "utf8");
      const clause = /export\s*\{([\s\S]*?)\}\s*;?\s*$/.exec(builtJs)?.[1] ?? "";
      const builtExports = new Set(clause.split(",").map((s) => s.trim()).filter(Boolean));
      for (const name of Object.keys(first.output.manifest.exportIndex)) {
        if (!builtExports.has(name)) issues.push(`guidelines promise export "${name}" but packages/react/dist/index.js does not export it`);
      }
      const builtPkg = JSON.parse(readFileSync(join(root, "packages", "react", "package.json"), "utf8"));
      if (builtPkg.version !== first.output.manifest.package.version) issues.push("manifest package version differs from packages/react/package.json");
    }
  }

  if (issues.length > 0) {
    for (const issue of issues) console.error(`  ✖ ${issue}`);
    console.error(`\nMake Kit guideline check FAILED (${issues.length} issue(s)).`);
    process.exit(1);
  }
  const m = first.output.manifest;
  console.log(`Make Kit guideline check passed: ${m.components.length} components for ${m.package.name}@${m.package.version}, deterministic${existsSync(outDir) ? ", dist matches" : ""}${verifyDist ? ", built package exports verified" : ""}.`);
}

try {
  const args = process.argv.slice(2);
  if (args.includes("--check")) check(args.includes("--verify-dist"));
  else build();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
