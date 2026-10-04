/**
 * CCV-2 — shadcn installed-result verifier (LOCAL_CANONICAL only).
 *
 *   npm run ccv:shadcn                              full distribution in ONE clean consumer
 *   npm run ccv:shadcn -- --item button             one item (its registry closure is installed too); repeatable
 *   npm run ccv:shadcn -- --install sequential      one `shadcn add` per subject inside the same consumer
 *   npm run ccv:shadcn -- --keep                    keep the workspace for inspection (path printed)
 *   npm run ccv:shadcn -- --out <dir>               result directory: ccv-out/… (default, gitignored) or outside the repo
 *   npm run ccv:shadcn -- --no-write                print the summary only
 *   npm run ccv:shadcn -- --compare <a.json> <b.json>   offline: compare the stable sections of two saved results
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
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { readGitInfo } from "../lib/audit/collect-repo-facts";
import { deriveAllShadcnContracts } from "../lib/ccv/derive-shadcn-contract";
import { runCommand } from "../lib/ccv/runner/process";
import { deriveBatchSubjects } from "../lib/ccv/shadcn/expected";
import { compareStableResults, humanSummary, type StableComparison } from "../lib/ccv/shadcn/result";
import type { CcvResult } from "../lib/ccv/types";
import { validateCcvResult } from "../lib/ccv/validate";
import { verifyShadcnLocalCanonical, type InstallStrategy } from "../lib/ccv/shadcn/verify";
import { serializeCcvResult } from "../lib/ccv/serialize";
import { buildDistributedRegistryItems } from "../lib/shadcn-registry-generator";

const DEFAULT_OUT = "ccv-out";
const args = process.argv.slice(2);

const describeComparison = (comparison: StableComparison, label: string): string[] =>
  comparison.identical
    ? [`Reproducibility: stable sections IDENTICAL to ${label}`]
    : [
        `Reproducibility: stable sections DIFFER from ${label}`,
        ...comparison.differingChecks.slice(0, 20).map((id) => `  differs: ${id}`),
        ...comparison.onlyInFirst.slice(0, 20).map((id) => `  only in earlier: ${id}`),
        ...comparison.onlyInSecond.slice(0, 20).map((id) => `  only in this run: ${id}`),
        ...comparison.otherDifferences.map((key) => `  section differs: ${key}`),
      ];

if (args[0] === "--compare") {
  if (args.length !== 3) {
    process.stderr.write("usage: npm run ccv:shadcn -- --compare <a.json> <b.json>\n");
    process.exit(1);
  }
  const load = (path: string): CcvResult => {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as CcvResult;
    const validation = validateCcvResult(parsed);
    if (!validation.ok) {
      process.stderr.write(`${path} is not a valid CcvResult:\n  - ${validation.problems.join("\n  - ")}\n`);
      process.exit(1);
    }
    return parsed;
  };
  const comparison = compareStableResults(load(args[1]), load(args[2]));
  for (const line of describeComparison(comparison, args[1])) process.stdout.write(`${line}\n`);
  process.exit(comparison.identical ? 0 : 3);
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
  outDir = resolve(repoRoot, values("--out")[0] ?? DEFAULT_OUT);
  const rel = relative(repoRoot, outDir);
  const insideRepo = rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
  const insideDefault = (() => {
    const r = relative(resolve(repoRoot, DEFAULT_OUT), outDir);
    return r === "" || (!r.startsWith("..") && !isAbsolute(r));
  })();
  if (insideRepo && !insideDefault) {
    process.stderr.write(`refusing to write inside the repository outside ${DEFAULT_OUT}/\n`);
    process.exit(1);
  }
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
    mkdirSync(outDir, { recursive: true });
    const stem = `shadcn.${output.result.mode}.${subjectLabel}.${git.sha}`;
    const earlier = readdirSync(outDir)
      .filter((name) => name === `${stem}.json` || new RegExp(`^${stem.replace(/[.+]/g, "\\$&")}\\.run-(\\d+)\\.json$`).test(name))
      .sort((a, b) => Number(/run-(\d+)/.exec(a)?.[1] ?? 0) - Number(/run-(\d+)/.exec(b)?.[1] ?? 0));
    const previous = earlier.at(-1);
    if (previous) {
      const comparison = compareStableResults(JSON.parse(readFileSync(join(outDir, previous), "utf8")) as CcvResult, output.result);
      for (const line of describeComparison(comparison, previous)) process.stdout.write(`${line}\n`);
    }
    let run = earlier.length + 1;
    let file = join(outDir, `${stem}.run-${run}.json`);
    while (existsSync(file)) file = join(outDir, `${stem}.run-${(run += 1)}.json`);
    const temporary = `${file}.tmp-${process.pid}`;
    try {
      writeFileSync(temporary, serializeCcvResult(output.result), { flag: "wx" });
      renameSync(temporary, file);
    } finally {
      rmSync(temporary, { force: true });
    }
    process.stdout.write(`Result: ${relative(repoRoot, file) || file}\n`);
  }
  process.exit(output.exitCode);
}

main().catch((error) => {
  process.stderr.write(`CCV verifier error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
