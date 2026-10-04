/**
 * CCV-2 — shadcn installed-result verifier (LOCAL_CANONICAL only).
 *
 *   npm run ccv:shadcn                              full distribution in ONE clean consumer
 *   npm run ccv:shadcn -- --item button             one item (its registry closure is installed too); repeatable
 *   npm run ccv:shadcn -- --install sequential      one `shadcn add` per subject inside the same consumer
 *   npm run ccv:shadcn -- --keep                    keep the workspace for inspection (path printed)
 *   npm run ccv:shadcn -- --out <dir>               result directory: ccv-out/… (default, gitignored) or outside the repo
 *   npm run ccv:shadcn -- --no-write                print the summary only
 *   npm run ccv:shadcn -- --compare <a.json> <b.json> [--across-commits]   offline: compare the stable sections of two saved
 *       results; --across-commits neutralises only the commit label (use it only when the canonical inputs did not change)
 *
 * A run never overwrites an earlier result: each run is written to the next free
 * `….run-<n>.json`, and when an earlier result for the same subject and commit
 * exists, the stable sections are compared and the verdict is printed.
 *
 * The registry payload is the canonical generator output on 127.0.0.1; the
 * production registry is never contacted (PUBLIC_REGISTRY is CCV-5). Tools are
 * pinned exactly. Exit: 0 all contract checks pass · 1 usage error · 2
 * environment/tooling failure (no trustworthy verdict) · 3 the verifier
 * completed and found contract failures.
 */
import { relative } from "node:path";
import { readGitInfo } from "../lib/audit/collect-repo-facts";
import { deriveAllShadcnContracts } from "../lib/ccv/derive-shadcn-contract";
import { runCommand } from "../lib/ccv/runner/process";
import { deriveBatchSubjects } from "../lib/ccv/shadcn/expected";
import { compareCommand, describeComparison, resolveResultDir, resultStem, writeRunArtifact } from "../lib/ccv/runner/artifacts";
import { humanSummary } from "../lib/ccv/shadcn/result";
import { verifyShadcnLocalCanonical, type InstallStrategy } from "../lib/ccv/shadcn/verify";
import { buildDistributedRegistryItems } from "../lib/shadcn-registry-generator";

const args = process.argv.slice(2);

if (args[0] === "--compare") {
  const outcome = compareCommand(args);
  for (const line of outcome.out) process.stdout.write(`${line}\n`);
  for (const line of outcome.err) process.stderr.write(`${line}\n`);
  process.exit(outcome.code);
}
const usage = () => {
  process.stderr.write("usage: npm run ccv:shadcn -- [--mode LOCAL_CANONICAL] [--item <name>]... [--install single|sequential] [--keep] [--out <dir>] [--no-write]\n");
  process.exit(1);
};
const values = (flag: string) => args.flatMap((arg, index) => (arg === flag ? [args[index + 1]] : []));
const VALUE_FLAGS = ["--mode", "--item", "--install", "--out"];
args.forEach((arg, index) => {
  if (VALUE_FLAGS.includes(arg) && (args[index + 1] === undefined || args[index + 1].startsWith("--"))) usage();
  if (arg.startsWith("--") && !VALUE_FLAGS.includes(arg) && !["--keep", "--no-write"].includes(arg)) usage();
  if (!arg.startsWith("--") && !VALUE_FLAGS.includes(args[index - 1] ?? "")) usage();
});
const mode = values("--mode")[0] ?? "LOCAL_CANONICAL";
if (mode !== "LOCAL_CANONICAL") {
  process.stderr.write(`mode ${mode} is not available in this slice: only LOCAL_CANONICAL (PUBLIC_REGISTRY is CCV-5; npm modes are CCV-3/CCV-5)\n`);
  process.exit(1);
}
const strategy = (values("--install")[0] ?? "single") as InstallStrategy;
if (strategy !== "single" && strategy !== "sequential") usage();

const repoRoot = process.cwd();
const items = buildDistributedRegistryItems();
const requested = values("--item");
const unknown = requested.filter((name) => !items.some((item) => item.name === name));
if (unknown.length > 0) {
  process.stderr.write(`not a distributed item: ${unknown.join(", ")} (see npm run ccv:contract -- shadcn --list)\n`);
  process.exit(1);
}
const subjects = requested.length > 0 ? requested : deriveBatchSubjects(items);
const subjectLabel = requested.length === 1 ? requested[0] : requested.length > 1 ? requested.join("+") : "all";

let outDir: string | undefined;
if (!args.includes("--no-write")) {
  const resolved = resolveResultDir(repoRoot, values("--out")[0]);
  if (!resolved.ok) {
    process.stderr.write(`${resolved.message}\n`);
    process.exit(1);
  }
  outDir = resolved.dir;
}

async function main(): Promise<void> {
  const git = readGitInfo(repoRoot);
  const contracts = deriveAllShadcnContracts({ gitSha: git.sha, items });
  process.stdout.write(`CCV-2 shadcn LOCAL_CANONICAL — ${subjects.length} subject(s), expected commit ${git.sha}${git.workingTreeDirty ? " (working tree dirty)" : ""}\n`);
  const output = await verifyShadcnLocalCanonical({
    repoRoot,
    gitSha: git.sha,
    items,
    contracts,
    subjects,
    subjectLabel,
    run: runCommand,
    parentEnv: process.env,
    keep: args.includes("--keep"),
    installStrategy: strategy,
    log: (line) => process.stdout.write(`${line}\n`),
  });
  for (const line of humanSummary(output.result)) process.stdout.write(`${line}\n`);
  if (output.kept) process.stdout.write(`Workspace kept: ${output.workspaceRoot}\n`);
  if (outDir) {
    const written = writeRunArtifact(outDir, resultStem(["shadcn", output.result.mode, subjectLabel, git.sha]), output.result);
    if (written.previous) for (const line of describeComparison(written.previous.comparison, written.previous.name)) process.stdout.write(`${line}\n`);
    process.stdout.write(`Result: ${relative(repoRoot, written.file) || written.file}\n`);
  }
  process.exit(output.exitCode);
}

main().catch((error) => {
  process.stderr.write(`CCV verifier error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
