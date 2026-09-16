import { evaluateComponentNonexistentSlug } from "@/lib/guard/rules/component-nonexistent-slug";
import { evaluateMaturityFalseStableClaim } from "@/lib/guard/rules/maturity-false-stable-claim";
import { evaluateDistributionFalseInstallableClaim } from "@/lib/guard/rules/distribution-false-installable-claim";
import { evaluateTokenUndeclaredCssVar } from "@/lib/guard/rules/token-undeclared-css-var";
import { evaluateDistributionHostrequirementsLeak } from "@/lib/guard/rules/distribution-hostrequirements-leak";
import { evaluateDistributionHosthostSchemaConsistency } from "@/lib/guard/rules/distribution-hosthost-schema-consistency";
import { loadGeneratedContracts, loadGeneratedManifests } from "@/lib/guard/generated-artifacts";
import type { ComponentFactSource } from "@/lib/guard/component-facts";
import type { ExtractedSourceFacts } from "@/lib/guard/types";
import type { InstallabilityClaim, MaturityClaim } from "@/lib/guard/structured-claims";
import type { RuleEvaluation } from "@/lib/guard/rule-types";

/**
 * G-1's top-level EVALUATE RULES entry points — three separate
 * functions, one per input domain (source files, structured claims,
 * internal generated artifacts), never forced through one unnatural
 * shared input object. Matches docs/architecture/guard-readiness-audit
 * .md §11's own consumer-input-model split.
 *
 * No severity-based exit behavior here — every function returns
 * `RuleEvaluation[]`. G-2 owns diagnostics, formatting, and exit codes
 * (`lib/guard/diagnostics.ts`, `lib/guard/run.ts`, `lib/guard/cli.ts`).
 */

/**
 * Rules that operate on one parsed source file's extracted facts:
 * `component/nonexistent-slug`. (`api/nonexistent-prop` would belong
 * here too, but is BLOCKED for G-1 — see
 * `rules/api-nonexistent-prop.ts`.)
 */
export function evaluateSourceRules(facts: ExtractedSourceFacts): RuleEvaluation[] {
  return [...evaluateComponentNonexistentSlug(facts)];
}

/**
 * Rules that operate on explicit, caller-supplied structured claims —
 * never freeform prose. A caller with no claims of a given kind simply
 * passes an empty array for it; this function never invents claims.
 */
export function evaluateStructuredClaims(claims: {
  maturity?: MaturityClaim[];
  installability?: InstallabilityClaim[];
}, components: ComponentFactSource): RuleEvaluation[] {
  return [
    ...evaluateMaturityFalseStableClaim(claims.maturity ?? [], components),
    ...evaluateDistributionFalseInstallableClaim(claims.installability ?? [], components),
  ];
}

/**
 * Rules that only make sense run against THIS repository's own
 * canonical registry and generated artifacts — never a consumer
 * project (see docs/architecture/guard-readiness-audit.md §8/§22's own
 * internal-vs-public domain split). Defaults to reading this repo's own
 * `public/r/` and `public/agent/contracts/` output; a caller may supply
 * already-loaded artifacts instead (e.g. from a test fixture) via the
 * optional parameters.
 */
export function evaluateInternalRegistryRules(options?: {
  root?: string;
  manifests?: ReturnType<typeof loadGeneratedManifests>;
  contracts?: ReturnType<typeof loadGeneratedContracts>;
}): RuleEvaluation[] {
  const root = options?.root ?? process.cwd();
  const manifests = options?.manifests ?? loadGeneratedManifests(root);
  const contracts = options?.contracts ?? loadGeneratedContracts(root);

  return [
    ...evaluateTokenUndeclaredCssVar(root),
    ...evaluateDistributionHostrequirementsLeak(manifests),
    ...evaluateDistributionHosthostSchemaConsistency(contracts, manifests),
  ];
}
