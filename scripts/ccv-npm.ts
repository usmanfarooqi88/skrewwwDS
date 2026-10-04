/**
 * CCV-3 — npm installed-package verifier (LOCAL_TARBALL only).
 *
 *   npm run ccv:npm                                  build → real tarball → fresh Vite consumer → verify
 *   npm run ccv:npm -- --keep                        keep the workspace for inspection (path printed)
 *   npm run ccv:npm -- --out <dir>                   result directory: ccv-out/… (default, gitignored) or outside the repo
 *   npm run ccv:npm -- --no-write                    print the summary only
 *   npm run ccv:npm -- --compare <a.json> <b.json> [--across-commits]   offline comparison of saved results
 *
 * Nothing is published and public npm is never queried for the package
 * (PUBLIC_NPM is CCV-5). The consumer tools are pinned exactly. Exit: 0 all
 * contract checks pass · 1 usage error · 2 environment/tooling failure (no
 * trustworthy verdict) · 3 the verifier completed and found contract failures.
 */
import { join, relative } from "node:path";
import { readGitInfo } from "../lib/audit/collect-repo-facts";
import { deriveNpmContract } from "../lib/ccv/derive-npm-contract";
import { verifyNpmLocalTarball } from "../lib/ccv/npm/verify";
import { compareCommand, describeComparison, resolveResultDir, resultStem, writeRunArtifact } from "../lib/ccv/runner/artifacts";
import { runCommand } from "../lib/ccv/runner/process";
import { humanSummary } from "../lib/ccv/runner/result";
import { buildReactPackage } from "./build-react-package";

const args = process.argv.slice(2);
if (args[0] === "--compare") {
  const outcome = compareCommand(args);
  for (const line of outcome.out) process.stdout.write(`${line}\n`);
  for (const line of outcome.err) process.stderr.write(`${line}\n`);
  process.exit(outcome.code);
}
const usage = () => {
  process.stderr.write("usage: npm run ccv:npm -- [--mode LOCAL_TARBALL] [--keep] [--out <dir>] [--no-write] | --compare <a.json> <b.json> [--across-commits]\n");
  process.exit(1);
};
const VALUE_FLAGS = ["--mode", "--out"];
args.forEach((arg, index) => {
  if (VALUE_FLAGS.includes(arg) && (args[index + 1] === undefined || args[index + 1].startsWith("--"))) usage();
  if (arg.startsWith("--") && !VALUE_FLAGS.includes(arg) && !["--keep", "--no-write"].includes(arg)) usage();
  if (!arg.startsWith("--") && !VALUE_FLAGS.includes(args[index - 1] ?? "")) usage();
});
const valueOf = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const mode = valueOf("--mode") ?? "LOCAL_TARBALL";
if (mode !== "LOCAL_TARBALL") {
  process.stderr.write(`mode ${mode} is not available in this slice: only LOCAL_TARBALL (PUBLIC_NPM is CCV-5; shadcn modes are ccv:shadcn)\n`);
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

async function main(): Promise<void> {
  const git = readGitInfo(repoRoot);
  const contract = deriveNpmContract({ gitSha: git.sha, mode: "LOCAL_TARBALL" });
  process.stdout.write(`CCV-3 npm LOCAL_TARBALL — ${contract.subject}@${contract.expectations.package.version}, expected commit ${git.sha}${git.workingTreeDirty ? " (working tree dirty)" : ""}\n`);
  const output = await verifyNpmLocalTarball({
    repoRoot,
    gitSha: git.sha,
    contract,
    packageDir: join(repoRoot, "packages", "react"),
    buildPackage: buildReactPackage,
    run: runCommand,
    parentEnv: process.env,
    keep: args.includes("--keep"),
    log: (line) => process.stdout.write(`${line}\n`),
  });
  for (const line of humanSummary(output.result)) process.stdout.write(`${line}\n`);
  if (output.kept) process.stdout.write(`Workspace kept: ${output.workspaceRoot}\n`);
  if (outDir) {
    const written = writeRunArtifact(outDir, resultStem(["npm", output.result.mode, contract.subject, git.sha]), output.result);
    if (written.previous) for (const line of describeComparison(written.previous.comparison, written.previous.name)) process.stdout.write(`${line}\n`);
    process.stdout.write(`Result: ${relative(repoRoot, written.file) || written.file}\n`);
  }
  process.exit(output.exitCode);
}

main().catch((error) => {
  process.stderr.write(`CCV verifier error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
