/**
 * CCV-3 / CCV-5 — npm installed-package verifier.
 *
 *   --mode LOCAL_TARBALL   (default) build → real tarball → fresh Vite consumer → verify
 *   --mode PUBLIC_NPM      the PUBLISHED package: `--package-version <v>` is resolved through public npm (never the
 *                          workspace, a link or a local tarball), checked against the release tag `react-v<v>`, the
 *                          registry gitHead / dist-tags / signatures / integrity and a rebuild at the tag commit, then
 *                          installed from the registry and verified. Read-only network; nothing is published.
 *
 *   npm run ccv:npm                                  LOCAL_TARBALL full run
 *   npm run ccv:npm -- --mode PUBLIC_NPM --package-version <v> [--runtime]
 *   npm run ccv:npm -- --runtime                     CCV-4: also run the representative browser runtime (real Chromium)
 *   npm run ccv:npm -- --keep                        keep the workspace for inspection (path printed)
 *   npm run ccv:npm -- --out <dir>                   result directory: ccv-out/… (default, gitignored) or outside the repo
 *   npm run ccv:npm -- --no-write                    print the summary only
 *   npm run ccv:npm -- --compare <a.json> <b.json> [--across-commits]   offline comparison of saved results
 *
 * The consumer tools are pinned exactly. Exit: 0 all contract checks pass · 1 usage error · 2 environment/tooling
 * failure or provenance not established (no trustworthy verdict) · 3 the verifier completed and found contract failures.
 */
import { join, relative } from "node:path";
import { readGitInfo } from "../lib/audit/collect-repo-facts";
import { deriveNpmContract } from "../lib/ccv/derive-npm-contract";
import { verifyNpmLocalTarball } from "../lib/ccv/npm/verify";
import { compareCommand, describeComparison, resolveResultDir, resultStem, writeRunArtifact } from "../lib/ccv/runner/artifacts";
import { runCommand } from "../lib/ccv/runner/process";
import { humanSummary } from "../lib/ccv/runner/result";
import { httpFetcher } from "../lib/ccv/public/fetcher";
import { execGitReader } from "../lib/ccv/public/git-reader";
import { selectMode } from "../lib/ccv/public/modes";
import { deriveReleaseIdentity } from "../lib/ccv/public/release-identity";
import { provenanceLines } from "../lib/ccv/public/verdict";
import { NPM_PUBLIC_REGISTRY_ORIGIN } from "../lib/ccv/derive-npm-contract";

const args = process.argv.slice(2);
if (args[0] === "--compare") {
  const outcome = compareCommand(args);
  for (const line of outcome.out) process.stdout.write(`${line}\n`);
  for (const line of outcome.err) process.stderr.write(`${line}\n`);
  process.exit(outcome.code);
}
const usage = () => {
  process.stderr.write("usage: npm run ccv:npm -- [--mode LOCAL_TARBALL|PUBLIC_NPM] [--package-version <v>] [--runtime] [--keep] [--out <dir>] [--no-write] | --compare <a.json> <b.json> [--across-commits]\n");
  process.exit(1);
};
const VALUE_FLAGS = ["--mode", "--out", "--package-version"];
args.forEach((arg, index) => {
  if (VALUE_FLAGS.includes(arg) && (args[index + 1] === undefined || args[index + 1].startsWith("--"))) usage();
  if (arg.startsWith("--") && !VALUE_FLAGS.includes(arg) && !["--keep", "--no-write", "--runtime"].includes(arg)) usage();
  if (!arg.startsWith("--") && !VALUE_FLAGS.includes(args[index - 1] ?? "")) usage();
});
const valueOf = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const selection = selectMode("npm-package", valueOf("--mode"));
if (!selection.ok) {
  process.stderr.write(`${selection.message}\n`);
  process.exit(1);
}
const isPublic = selection.public;
if (!isPublic && valueOf("--package-version") !== undefined) {
  process.stderr.write("--package-version applies to PUBLIC_NPM only (LOCAL_TARBALL builds the checked-out source)\n");
  process.exit(1);
}
const repoRoot = process.cwd();
let outDir: string | undefined;
if (!args.includes("--no-write")) {
  const resolved = resolveResultDir(repoRoot, valueOf("--out"));
  if (!resolved.ok) {
    process.stderr.write(`${resolved.message}\n`);
    process.exit(1);
  }
  outDir = resolved.dir;
}

const runtime = args.includes("--runtime");

async function main(): Promise<void> {
  const git = readGitInfo(repoRoot);
  const contract = deriveNpmContract({ gitSha: git.sha, mode: isPublic ? "PUBLIC_NPM" : "LOCAL_TARBALL" });
  const version = valueOf("--package-version") ?? contract.expectations.package.version;
  const release = isPublic ? deriveReleaseIdentity({ packageName: contract.subject, version, git: execGitReader(repoRoot) }) : undefined;
  process.stdout.write(`CCV npm ${selection.ok ? selection.mode : ""}${runtime ? " + runtime" : ""} — ${contract.subject}@${version}, expected ${release ? `release ${release.tag} → ${release.tagCommit ?? "(tag not in this checkout)"}` : `commit ${git.sha}`}${git.workingTreeDirty ? " (working tree dirty)" : ""}\n`);
  // The local build module is loaded ONLY for LOCAL_TARBALL: a public run can never build or pack the working tree by accident.
  const buildPackage = isPublic ? undefined : (await import("./build-react-package")).buildReactPackage;
  const output = await verifyNpmLocalTarball({
    repoRoot,
    gitSha: git.sha,
    contract,
    packageDir: join(repoRoot, "packages", "react"),
    ...(buildPackage ? { buildPackage } : {}),
    ...(isPublic && release ? { public: { version, registryOrigin: NPM_PUBLIC_REGISTRY_ORIGIN, release, fetcher: httpFetcher } } : {}),
    run: runCommand,
    parentEnv: process.env,
    keep: args.includes("--keep"),
    ...(runtime ? { runtime: {} } : {}),
    log: (line) => process.stdout.write(`${line}\n`),
  });
  for (const line of humanSummary(output.result)) process.stdout.write(`${line}\n`);
  for (const line of provenanceLines(output.result)) process.stdout.write(`${line}\n`);
  if (output.kept) process.stdout.write(`Workspace kept: ${output.workspaceRoot}\n`);
  if (outDir) {
    const written = writeRunArtifact(outDir, resultStem(["npm", output.result.mode, contract.subject, ...(isPublic ? [version] : []), output.result.source.expectedGitSha, ...(runtime ? ["runtime"] : [])]), output.result);
    if (written.previous) for (const line of describeComparison(written.previous.comparison, written.previous.name)) process.stdout.write(`${line}\n`);
    process.stdout.write(`Result: ${relative(repoRoot, written.file) || written.file}\n`);
  }
  process.exit(output.exitCode);
}

main().catch((error) => {
  process.stderr.write(`CCV verifier error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
