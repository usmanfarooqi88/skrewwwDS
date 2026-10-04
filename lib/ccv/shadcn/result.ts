import { assembleResult as assembleAny, type AssembleInput } from "@/lib/ccv/runner/result";
import type { CcvResult } from "@/lib/ccv/types";

/**
 * CCV-2 — shadcn result helpers. The implementation is shared with every
 * installed-result verifier (`lib/ccv/runner/result.ts`); this module fixes the
 * distribution and mode of a shadcn LOCAL_CANONICAL result.
 */
export {
  compareStableResults,
  countResult,
  evidence,
  exitCodeFor,
  humanSummary,
  listEvidence,
  truncate,
  type ResultCounts,
  type StableComparison,
} from "@/lib/ccv/runner/result";

export function assembleResult(input: Omit<AssembleInput, "distribution" | "mode">): CcvResult {
  return assembleAny({ ...input, distribution: "shadcn-registry", mode: "LOCAL_CANONICAL" });
}
