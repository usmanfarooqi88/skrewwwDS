import { CCV_FAILURES, type CcvFailureCode } from "@/lib/ccv/failure-codes";
import { CCV_EVIDENCE_OBSERVED_LIMIT, CCV_RESULT_SCHEMA_VERSION, type CcvCheck, type CcvEvidence, type CcvResult } from "@/lib/ccv/types";
import { stableStringify } from "@/lib/ccv/serialize";
import { summarizeChecks, validateCcvResult } from "@/lib/ccv/validate";

/**
 * CCV-2/CCV-3 — shared result assembly, exit codes, human summary and stable
 * comparison for every installed-result verifier. The result is always the CCV-1
 * `CcvResult`, validated before it is returned; there is no second format.
 */

export const truncate = (text: string, limit: number = CCV_EVIDENCE_OBSERVED_LIMIT): string =>
  text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;

export function evidence(kind: CcvEvidence["kind"], ref: string, observed: string, sha256?: string): CcvEvidence {
  const entry: CcvEvidence = { kind, ref: truncate(ref, 200), observed: truncate(observed) };
  if (sha256) entry.sha256 = sha256;
  return entry;
}

/** Splits a long list into several bounded evidence entries instead of one oversized one. */
export function listEvidence(kind: CcvEvidence["kind"], ref: string, values: readonly string[], maxEntries = 40): CcvEvidence[] {
  const out: CcvEvidence[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length > 0) out.push(evidence(kind, `${ref}#${out.length + 1}`, current.join(", ")));
    current = [];
  };
  for (const value of values) {
    if ([...current, value].join(", ").length > CCV_EVIDENCE_OBSERVED_LIMIT) flush();
    current.push(value);
  }
  flush();
  if (out.length > maxEntries) return [...out.slice(0, maxEntries), evidence(kind, `${ref}#more`, `${out.length - maxEntries} further entries omitted`)];
  return out;
}

export type AssembleInput = {
  distribution: CcvResult["distribution"];
  mode: CcvResult["mode"];
  subject: string;
  packageVersion?: string;
  integrity?: string;
  gitSha: string;
  environment: CcvResult["environment"];
  checks: CcvCheck[];
  volatile?: CcvResult["volatile"];
};

export function assembleResult(input: AssembleInput): CcvResult {
  const result: CcvResult = {
    schemaVersion: CCV_RESULT_SCHEMA_VERSION,
    distribution: input.distribution,
    mode: input.mode,
    subject: input.subject,
    environment: input.environment,
    source: {
      expectedGitSha: input.gitSha,
      ...(input.packageVersion ? { packageVersion: input.packageVersion } : {}),
      ...(input.integrity ? { integrity: input.integrity } : {}),
    },
    checks: input.checks,
    summary: summarizeChecks(input.checks),
  };
  if (input.volatile) result.volatile = input.volatile;
  const validation = validateCcvResult(result);
  if (!validation.ok) throw new Error(`CCV produced an invalid CcvResult:\n  - ${validation.problems.join("\n  - ")}`);
  return result;
}

export type ResultCounts = { failuresByCode: Record<string, number>; upstream: number; skrewww: number; environmentErrors: number; unknown: number };

export function countResult(result: CcvResult): ResultCounts {
  const failuresByCode: Record<string, number> = {};
  let upstream = 0;
  let skrewww = 0;
  let environmentErrors = 0;
  for (const check of result.checks) {
    if (check.failureCode === "ENVIRONMENT_ERROR") environmentErrors += 1;
    if (check.status !== "fail" || !check.failureCode) continue;
    failuresByCode[check.failureCode] = (failuresByCode[check.failureCode] ?? 0) + 1;
    if (CCV_FAILURES[check.failureCode].attribution === "upstream") upstream += 1;
    else skrewww += 1;
  }
  return { failuresByCode, upstream, skrewww, environmentErrors, unknown: result.summary.unknown };
}

/**
 * 0 — the verifier ran and every contract check passed.
 * 2 — an environment/tooling failure means there is no trustworthy verdict.
 * 3 — the verifier completed and found contract failures.
 * An `unknown` without a failure code (a check that could not be judged) and no
 * contract failure is also 2: an undecided check is never reported as a pass.
 * (1 is reserved for CLI usage errors.)
 */
export function exitCodeFor(result: CcvResult): 0 | 2 | 3 {
  const counts = countResult(result);
  if (counts.environmentErrors > 0) return 2;
  if (result.summary.fail > 0) return 3;
  if (result.summary.unknown > 0) return 2;
  return 0;
}

export function humanSummary(result: CcvResult): string[] {
  const counts = countResult(result);
  const code = exitCodeFor(result);
  const lines = [
    `CCV verifier: ${code === 2 ? "INCOMPLETE — environment/tooling failure, no trustworthy verdict" : "completed"}`,
    `Contract result: ${code === 0 ? "PASS" : code === 3 ? "FAIL" : "UNKNOWN"}`,
    `Distribution: ${result.distribution} · mode ${result.mode} · subject ${result.subject} · expected commit ${result.source.expectedGitSha}`,
    `Checks: pass ${result.summary.pass} · fail ${result.summary.fail} · unknown ${result.summary.unknown} · not-applicable ${result.summary.notApplicable}`,
    `Failures attributed to Skrewww: ${counts.skrewww} · upstream (installer) transforms: ${counts.upstream} · environment errors: ${counts.environmentErrors}`,
  ];
  for (const [failure, count] of Object.entries(counts.failuresByCode).sort()) lines.push(`  ${failure}: ${count} — ${CCV_FAILURES[failure as CcvFailureCode].meaning}`);
  return lines;
}

export type StableComparison = { identical: boolean; differingChecks: string[]; onlyInFirst: string[]; onlyInSecond: string[]; otherDifferences: string[] };

/**
 * Compares the STABLE sections of two results: everything except `volatile`
 * (timestamp, duration). Temp paths, ports and timings never reach the stable
 * sections, so two runs against identical installed bytes compare identical.
 */
export function compareStableResults(first: CcvResult, second: CcvResult, options: { acrossCommits?: boolean } = {}): StableComparison {
  // acrossCommits: the two runs were taken at different commits whose canonical inputs are known to be unchanged;
  // only the commit label is neutralised — every check (including every expected hash) must still be identical.
  const strip = ({ volatile: _volatile, checks: _checks, ...rest }: CcvResult) =>
    options.acrossCommits ? { ...rest, source: { ...rest.source, expectedGitSha: "<commit>" } } : rest;
  // Key-order independent: a saved result (sorted keys) must compare equal to an in-memory one.
  const a = new Map(first.checks.map((check) => [check.checkId, stableStringify(check)]));
  const b = new Map(second.checks.map((check) => [check.checkId, stableStringify(check)]));
  const differingChecks = Array.from(a.keys()).filter((key) => b.has(key) && a.get(key) !== b.get(key));
  const onlyInFirst = Array.from(a.keys()).filter((key) => !b.has(key));
  const onlyInSecond = Array.from(b.keys()).filter((key) => !a.has(key));
  const otherDifferences: string[] = [];
  const restA = strip(first) as Record<string, unknown>;
  const restB = strip(second) as Record<string, unknown>;
  for (const key of Array.from(new Set([...Object.keys(restA), ...Object.keys(restB)])).sort()) {
    if (stableStringify(restA[key] ?? null) !== stableStringify(restB[key] ?? null)) otherDifferences.push(key);
  }
  const orderDiffers = JSON.stringify(first.checks.map((check) => check.checkId)) !== JSON.stringify(second.checks.map((check) => check.checkId));
  if (orderDiffers && differingChecks.length + onlyInFirst.length + onlyInSecond.length === 0) otherDifferences.push("check order");
  return { identical: differingChecks.length + onlyInFirst.length + onlyInSecond.length + otherDifferences.length === 0, differingChecks, onlyInFirst, onlyInSecond, otherDifferences };
}
