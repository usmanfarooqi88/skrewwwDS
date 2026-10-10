import type { AliasReport } from "@/lib/ccv/css/alias-chains";
import type { Judgement, RecordedAssertion } from "@/lib/ccv/css/runtime-judge";
import { judgeRecorded, assertionKey } from "@/lib/ccv/css/runtime-judge";
import type { ExpectedCss, StaticCssVerdict } from "@/lib/ccv/css/static-delivery";
import { evidence, listEvidence } from "@/lib/ccv/runner/result";
import type { CcvAuthority, CcvCheck, CcvEvidence } from "@/lib/ccv/types";

/**
 * CCV-4 — turns static CSS verdicts and runtime judgements into CcvChecks with
 * stable ids, shared by the shadcn and npm verifiers. Static failures are
 * `CSS_DECLARATION_MISSING`; runtime style failures `CSS_RUNTIME_UNRESOLVED`.
 */

export type IdFn = (category: string, key: string) => string;

export function staticCssChecks(options: { id: IdFn; label: string; verdict: StaticCssVerdict; expected: ExpectedCss; aliases: AliasReport }): CcvCheck[] {
  const { id, label, verdict, expected, aliases } = options;
  const out: CcvCheck[] = [];
  const fail = { status: "fail" as const, failureCode: "CSS_DECLARATION_MISSING" as const };
  out.push({
    checkId: id("css", "declarations"),
    ...(verdict.missingDeclarations.length === 0 ? { status: "pass" as const } : fail),
    claim: `every custom property the installed CSS of ${label} uses resolves to a delivered declaration, a literal fallback, or a runtime assignment in installed source`,
    authority: "delivered-css",
    evidence:
      verdict.missingDeclarations.length === 0
        ? [evidence("css", "declarations", `${verdict.observed.usedCustomProperties.length} used, ${verdict.observed.declaredCustomProperties.length} declared in the delivered set; nothing used without declaration, fallback or runtime assignment`)]
        : listEvidence("css", "missing", verdict.missingDeclarations),
  });
  out.push({
    checkId: id("css", "contract-surface"),
    ...(verdict.differences.length === 0 ? { status: "pass" as const } : fail),
    claim: `the installed CSS surface of ${label} equals the CCV-1 contract`,
    authority: "delivered-css",
    evidence:
      verdict.differences.length === 0
        ? [evidence("css", "surface", "declared, used, unresolved, fallback-backed, mode-selector and script-supplied sets equal the contract")]
        : verdict.differences.flatMap((d) => [...(d.missing.length ? listEvidence("css", `${d.field}:missing`, d.missing, 4) : []), ...(d.extra.length ? listEvidence("css", `${d.field}:extra`, d.extra, 4) : [])]),
  });
  for (const name of expected.fallbackBackedUses) {
    const still = verdict.fallbackBacked.includes(name);
    const declared = verdict.observed.declaredCustomProperties.includes(name);
    out.push({
      checkId: id("css-fallback", name),
      ...(still || declared ? { status: "pass" as const } : fail),
      claim: `${name} remains resolvable through its literal fallback in the installed CSS of ${label}`,
      authority: "delivered-css",
      evidence: [evidence("css", name, still ? "undeclared in the delivered set; every use carries a literal fallback (fallback-backed, as the contract records)" : declared ? "now declared in the delivered set (resolves without the fallback)" : "a use without a usable fallback appeared")],
    });
  }
  out.push({
    checkId: id("css", "alias-chains"),
    ...(aliases.problems.length === 0 ? { status: "pass" as const } : fail),
    claim: `every custom-property alias chain in the delivered CSS of ${label} terminates (no unresolved target, cycle or depth overflow)`,
    authority: "delivered-css",
    evidence:
      aliases.problems.length === 0
        ? [evidence("css", "alias-chains", `${aliases.aliases} alias declaration(s) of ${aliases.declarations}; every chain reaches a value or literal fallback (same selector context first, then :root)`)]
        : aliases.problems.slice(0, 12).map((p) => evidence("css", `${p.kind}:${p.context}`, p.chain.join(" → "))),
  });
  const missingModes = expected.modeSelectors.filter((selector) => !verdict.observed.modeSelectors.includes(selector));
  out.push({
    checkId: id("css", "mode-selectors"),
    ...(missingModes.length === 0 ? { status: "pass" as const } : fail),
    claim: `every Shape/Surface mode selector the contract records for ${label} is present in the installed CSS`,
    authority: "delivered-css",
    evidence: missingModes.length === 0 ? [evidence("css", "mode-selectors", expected.modeSelectors.length === 0 ? "the contract records no mode selector for this subject" : `${expected.modeSelectors.length} contract mode selector(s) present`)] : listEvidence("css", "missing-mode", missingModes),
  });
  return out;
}

/** One check per runtime-supply candidate; the status comes from the runtime layer (or `unknown` when it did not run). */
export function runtimeSuppliedCheck(id: IdFn, label: string, prop: string, judgement: Judgement | undefined, runtimeOffReason: string): CcvCheck {
  const staticEvidence = evidence("source", prop, `used without declaration or fallback in the installed CSS of ${label}; assigned by installed source (a candidate — never subtracted without runtime proof)`);
  if (!judgement) return { checkId: id("css-runtime-supplied", prop), status: "unknown", claim: `${prop} is supplied at runtime by the installed ${label} source`, authority: "ccv-scenario", evidence: [staticEvidence, evidence("command", "runtime", runtimeOffReason)] };
  return toCheck(id("css-runtime-supplied", prop), `${prop} is supplied at runtime by the installed ${label} source`, "ccv-scenario", judgement, [staticEvidence]);
}

export function toCheck(checkId: string, claim: string, authority: CcvAuthority, judgement: Judgement, extra: CcvEvidence[] = []): CcvCheck {
  return {
    checkId,
    status: judgement.status,
    ...(judgement.failureCode ? { failureCode: judgement.failureCode } : {}),
    claim,
    authority,
    evidence: [...extra, evidence("command", "runtime", judgement.detail)],
  };
}

export function recordedChecks(id: IdFn, prefix: string, recorded: readonly RecordedAssertion[]): CcvCheck[] {
  const seen = new Map<string, number>();
  return recorded.map((assertion) => {
    const base = `${prefix}-${assertionKey(assertion.name)}`;
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return toCheck(id("runtime", n === 1 ? base : `${base}-${n}`), assertion.name, "ccv-scenario", judgeRecorded(assertion));
  });
}

/** A runtime check that could not run because the browser/server failed: UNKNOWN, ENVIRONMENT_ERROR. */
export const environmentJudgement = (detail: string): Judgement => ({ status: "unknown", failureCode: "ENVIRONMENT_ERROR", detail });
