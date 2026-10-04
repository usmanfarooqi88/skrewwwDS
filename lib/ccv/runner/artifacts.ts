import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { compareStableResults, type StableComparison } from "@/lib/ccv/runner/result";
import { serializeCcvResult } from "@/lib/ccv/serialize";
import type { CcvResult } from "@/lib/ccv/types";
import { validateCcvResult } from "@/lib/ccv/validate";

/**
 * CCV — result artifacts. Results are local evidence in the gitignored
 * `ccv-out/` (or a directory outside the repository). A run NEVER overwrites
 * another: each is written atomically to the next `<stem>.run-<n>.json`, and the
 * stable sections are compared with the previous run of the same stem.
 */

export const DEFAULT_RESULT_DIR = "ccv-out";

const inside = (parent: string, child: string) => {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
};

export function resolveResultDir(repoRoot: string, requested?: string): { ok: true; dir: string } | { ok: false; message: string } {
  const dir = resolve(repoRoot, requested ?? DEFAULT_RESULT_DIR);
  if (inside(repoRoot, dir) && !inside(resolve(repoRoot, DEFAULT_RESULT_DIR), dir)) {
    return { ok: false, message: `refusing to write inside the repository outside ${DEFAULT_RESULT_DIR}/` };
  }
  return { ok: true, dir };
}

/** A filesystem-safe stem: `@`, `/` and other unsafe characters become `-`. */
export function resultStem(parts: readonly string[]): string {
  return parts.map((part) => part.replace(/^@/, "").replace(/[^A-Za-z0-9._+-]+/g, "-")).join(".");
}

export type WrittenArtifact = { file: string; previous?: { name: string; comparison: StableComparison } };

export function writeRunArtifact(dir: string, stem: string, result: CcvResult): WrittenArtifact {
  mkdirSync(dir, { recursive: true });
  const escaped = stem.replace(/[.+]/g, "\\$&");
  const pattern = new RegExp(`^${escaped}\\.run-(\\d+)\\.json$`);
  const earlier = readdirSync(dir)
    .filter((name) => name === `${stem}.json` || pattern.test(name))
    .sort((a, b) => Number(pattern.exec(a)?.[1] ?? 0) - Number(pattern.exec(b)?.[1] ?? 0));
  const last = earlier.at(-1);
  const previous = last ? { name: last, comparison: compareStableResults(JSON.parse(readFileSync(join(dir, last), "utf8")) as CcvResult, result) } : undefined;
  let run = earlier.length + 1;
  let file = join(dir, `${stem}.run-${run}.json`);
  while (existsSync(file)) file = join(dir, `${stem}.run-${(run += 1)}.json`);
  const temporary = `${file}.tmp-${process.pid}`;
  try {
    writeFileSync(temporary, serializeCcvResult(result), { flag: "wx" });
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
  return previous ? { file, previous } : { file };
}

export function describeComparison(comparison: StableComparison, label: string): string[] {
  return comparison.identical
    ? [`Reproducibility: stable sections IDENTICAL to ${label}`]
    : [
        `Reproducibility: stable sections DIFFER from ${label}`,
        ...comparison.differingChecks.slice(0, 20).map((id) => `  differs: ${id}`),
        ...comparison.onlyInFirst.slice(0, 20).map((id) => `  only in earlier: ${id}`),
        ...comparison.onlyInSecond.slice(0, 20).map((id) => `  only in this run: ${id}`),
        ...comparison.otherDifferences.map((key) => `  section differs: ${key}`),
      ];
}

/** `--compare <a> <b> [--across-commits]`: returns the exit code (0 identical, 1 usage, 3 different) and output lines. */
export function compareCommand(args: readonly string[]): { code: 0 | 1 | 3; out: string[]; err: string[] } {
  const acrossCommits = args.includes("--across-commits");
  const files = args.filter((arg) => arg !== "--across-commits" && arg !== "--compare");
  if (files.length !== 2 || args.length !== files.length + 1 + (acrossCommits ? 1 : 0)) {
    return { code: 1, out: [], err: ["usage: --compare <a.json> <b.json> [--across-commits]"] };
  }
  const loaded: CcvResult[] = [];
  for (const path of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      return { code: 1, out: [], err: [`${path}: ${error instanceof Error ? error.message : String(error)}`] };
    }
    const validation = validateCcvResult(parsed);
    if (!validation.ok) return { code: 1, out: [], err: [`${path} is not a valid CcvResult:`, ...validation.problems.map((p) => `  - ${p}`)] };
    loaded.push(parsed as CcvResult);
  }
  const comparison = compareStableResults(loaded[0], loaded[1], { acrossCommits });
  const out = [
    ...(acrossCommits ? [`Across commits: ${loaded[0].source.expectedGitSha} → ${loaded[1].source.expectedGitSha} (commit label neutralised; every check must still match)`] : []),
    ...describeComparison(comparison, files[0]),
  ];
  return { code: comparison.identical ? 0 : 3, out, err: [] };
}
