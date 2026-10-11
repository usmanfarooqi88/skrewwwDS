import type { CcvResult } from "@/lib/ccv/types";

/**
 * CCV-5 — the provenance verdict of a result, kept SEPARATE from "did it install and
 * run". Provenance checks are the `registry-public:*` (minus the directory service
 * check) and `provenance:*` families. A LOCAL mode has none and reports NOT_EVALUATED;
 * a public mode with no provenance check at all is UNKNOWN, never PASS.
 */

export type ProvenanceState = "PASS" | "FAIL" | "UNKNOWN" | "NOT_EVALUATED";
export type ProvenanceVerdict = { state: ProvenanceState; pass: number; fail: number; unknown: number; notApplicable: number; failing: string[]; unknownChecks: string[] };

const isProvenanceCheck = (checkId: string): boolean => /^(shadcn|npm):[^:]+:(registry-public|provenance):/.test(checkId) && !/:registry-public:directory$/.test(checkId);

export function provenanceVerdict(result: CcvResult): ProvenanceVerdict {
  const checks = result.checks.filter((check) => isProvenanceCheck(check.checkId));
  const count = (status: string) => checks.filter((check) => check.status === status).length;
  const verdict: ProvenanceVerdict = {
    state: "NOT_EVALUATED",
    pass: count("pass"), fail: count("fail"), unknown: count("unknown"), notApplicable: count("not-applicable"),
    failing: checks.filter((check) => check.status === "fail").map((check) => check.checkId),
    unknownChecks: checks.filter((check) => check.status === "unknown").map((check) => check.checkId),
  };
  const isPublic = result.mode === "PUBLIC_REGISTRY" || result.mode === "PUBLIC_NPM";
  if (!isPublic) return verdict;
  verdict.state = verdict.fail > 0 ? "FAIL" : verdict.pass === 0 || verdict.unknown > 0 ? "UNKNOWN" : "PASS";
  return verdict;
}

export function provenanceLines(result: CcvResult): string[] {
  const verdict = provenanceVerdict(result);
  if (verdict.state === "NOT_EVALUATED") return [`Provenance: NOT_EVALUATED (${result.mode} proves installability, not public identity)`];
  return [
    `Provenance: ${verdict.state} — ${verdict.pass} pass · ${verdict.fail} fail · ${verdict.unknown} unknown (expected commit ${result.source.expectedGitSha}${result.source.observedGitSha ? `, observed ${result.source.observedGitSha}` : ""}${result.source.integrity ? `, identity ${result.source.integrity.slice(0, 40)}…` : ""})`,
    "  (a successful install is never provenance: only the provenance checks above decide it)",
    ...verdict.failing.slice(0, 5).map((id) => `  FAIL ${id}`),
    ...verdict.unknownChecks.slice(0, 5).map((id) => `  UNKNOWN ${id}`),
  ];
}
